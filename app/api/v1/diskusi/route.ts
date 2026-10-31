import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { CreateDiskusiSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { MateriComment, Materi, Member, User } from '@/models';
import { pusherServer } from '@/lib/pusher';

const normalizeClass = (value: unknown) =>
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function getStudentClass(ctx: ApiContext) {
  if (ctx.user?.kelas) return ctx.user.kelas;
  if (ctx.user?.member_id) {
    const member = await Member.findById(ctx.user.member_id).lean();
    return member?.kelas || '';
  }
  return '';
}

type MaterialAccess = { kelas?: unknown } | null;

function studentCanAccessMaterial(material: MaterialAccess, studentClass: string) {
  const materialClasses = Array.isArray(material?.kelas) ? material.kelas : [material?.kelas];
  return !!studentClass && materialClasses.some(
    (kelas: unknown) => normalizeClass(kelas) === normalizeClass(studentClass)
  );
}

// GET /api/v1/diskusi?materi_id=...
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const materiId = req.nextUrl.searchParams.get('materi_id');
    if (!materiId) {
      return apiError('Parameter materi_id wajib diisi', 'VALIDATION_ERROR', 400);
    }

    await connectDB();
    const materi = await Materi.findById(materiId).lean();
    if (!materi) return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);

    const query: { materi_id: string; $or?: Array<{ role_pengirim?: { $in: string[] }; kelas_siswa?: string }> } = { materi_id: materiId };
    if (ctx.user?.role === 'siswa') {
      const studentClass = await getStudentClass(ctx);
      if (!studentCanAccessMaterial(materi, studentClass)) {
        return apiError('Anda tidak memiliki akses ke diskusi materi ini', 'FORBIDDEN', 403);
      }
      query.$or = [
        { role_pengirim: { $in: ['admin', 'guru'] } },
        { kelas_siswa: studentClass },
      ];
    }

    const comments = await MateriComment.find(query).sort({ dibuat_pada: 1 }).lean();
    const emails = [...new Set(comments.map((comment) => comment.user_email).filter(Boolean))];
    const users = emails.length
      ? await User.find({ user: { $in: emails } }).select('_id user').lean()
      : [];
    const userIdByEmail = new Map(users.map((user) => [user.user, user._id.toString()]));

    const items = comments.map((comment) => ({
      id: comment._id.toString(),
      materi_id: comment.materi_id.toString(),
      user_id: String(comment.user_id || userIdByEmail.get(comment.user_email) || comment.user_email),
      nama: comment.nama_pengirim,
      role: comment.role_pengirim,
      isi: comment.komentar,
      created_at: new Date(comment.dibuat_pada).toISOString(),
    }));

    return apiSuccess(
      { items, total: items.length, page: 1, limit: items.length, totalPages: 1 },
      'Diskusi berhasil diambil'
    );
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin', 'siswa'],
  }
);

// POST /api/v1/diskusi
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const body = await req.json();
    const data = CreateDiskusiSchema.parse({
      materi_id: body?.materi_id,
      komentar: body?.komentar ?? body?.isi,
    });
    const isi = data.komentar.trim();
    if (!isi) return apiError('Komentar tidak boleh kosong', 'VALIDATION_ERROR', 400);

    await connectDB();
    const materi = await Materi.findById(data.materi_id).lean();
    if (!materi) return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);

    const user = ctx.user!;
    let senderName = user.nama || (user.role === 'admin' ? 'Admin' : 'Siswa');
    let studentClass = user.kelas || '';
    if (user.role === 'siswa') {
      studentClass = await getStudentClass(ctx);
      if (!studentCanAccessMaterial(materi, studentClass)) {
        return apiError('Anda tidak memiliki akses ke diskusi materi ini', 'FORBIDDEN', 403);
      }
      if (user.member_id) {
        const member = await Member.findById(user.member_id).lean();
        senderName = member?.nama_lengkap || senderName;
      }
    }

    const comment = await MateriComment.create({
      materi_id: data.materi_id,
      user_id: String(user.sub),
      user_email: user.email,
      nama_pengirim: senderName,
      role_pengirim: user.role,
      kelas_siswa: user.role === 'siswa' ? studentClass : '',
      komentar: isi,
      dibuat_pada: new Date(),
    });

    const createdAt = new Date(comment.dibuat_pada).toISOString();
    const commentPayload = {
      id: comment._id.toString(),
      materi_id: comment.materi_id.toString(),
      user_id: String(user.sub),
      nama: senderName,
      role: user.role,
      isi,
      created_at: createdAt,
      nama_pengirim: senderName,
      role_pengirim: user.role,
      kelas_siswa: user.role === 'siswa' ? studentClass : '',
      komentar: isi,
      dibuat_pada: createdAt,
    };

    try {
      await pusherServer.trigger('materi-' + data.materi_id, 'komentar-baru', commentPayload);
      await pusherServer.trigger('materi-' + data.materi_id, 'new-comment', commentPayload);
    } catch {
      // Pusher broadcast is best-effort; the comment is already stored.
    }

    return apiSuccess(commentPayload, 'Komentar berhasil dikirim', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin', 'siswa'],
  }
);