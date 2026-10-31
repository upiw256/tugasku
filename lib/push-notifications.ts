import { ExpoPushToken, Member, User } from '@/models';

type PushType = 'tugas' | 'materi' | 'pengumuman';

type PushItem = {
  id: string;
  type: PushType;
  title: string;
  classes?: string[];
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Send a new school item notification to active app installs. */
export async function sendNewItemPush({ id, type, title, classes }: PushItem) {
  try {
    let userIds: unknown[] | undefined;
    if (classes?.length) {
      const members = await Member.find({ kelas: { $in: classes } }).select('_id').lean();
      const memberIds = members.map((member) => member._id);
      const users = await User.find({ role: 'siswa', member_id: { $in: memberIds } }).select('_id').lean();
      userIds = users.map((user) => user._id);
      if (!userIds.length) return;
    }

    const query: Record<string, unknown> = { is_active: true };
    if (userIds) query.user_id = { $in: userIds };
    const tokens = await ExpoPushToken.find(query).select('token').lean();
    if (!tokens.length) return;

    for (let offset = 0; offset < tokens.length; offset += 100) {
      const batch = tokens.slice(offset, offset + 100);
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(batch.map(({ token }) => ({
          to: token,
          sound: 'default',
          title: title.slice(0, 100),
          body: type === 'tugas' ? 'Tugas baru telah ditambahkan' : type === 'materi' ? 'Materi baru telah tersedia' : 'Pengumuman baru telah diterbitkan',
          data: { type, id },
          channelId: 'default',
        }))),
      });

      if (!response.ok) throw new Error(`Expo Push Service returned ${response.status}`);
      const result: unknown = await response.json();
      const tickets = isRecord(result) && Array.isArray(result.data) ? result.data : [];
      const invalidTokens = tickets
        .map((ticket, index) => {
          if (!isRecord(ticket) || !isRecord(ticket.details)) return null;
          return ticket.details.error === 'DeviceNotRegistered' ? batch[index]?.token : null;
        })
        .filter(Boolean);
      if (invalidTokens.length) await ExpoPushToken.updateMany({ token: { $in: invalidTokens } }, { $set: { is_active: false } });
    }
  } catch (error) {
    console.error('[Push] Gagal mengirim notifikasi item baru:', error);
  }
}
