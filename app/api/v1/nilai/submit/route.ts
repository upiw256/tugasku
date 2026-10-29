import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { SubmitNilaiSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Nilai, Tugas, Member, Kelompok } from '@/models';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

// POST /api/v1/nilai/submit
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const body = await req.json();
    const data = SubmitNilaiSchema.parse(body);

    await connectDB();

    const memberId = ctx.user?.member_id;
    if (!memberId) {
      return apiError('Akun Anda tidak terhubung dengan data siswa', 'FORBIDDEN', 403);
    }

    const task = await Tugas.findById(data.tugas_id);
    if (!task) {
      return apiError('Tugas tidak ditemukan', 'NOT_FOUND', 404);
    }

    // Check if task is locked
    if (task.is_active === false) {
      return apiError('Maaf, pengumpulan tugas ini sudah dikunci/ditutup', 'TASK_CLOSED', 403);
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return apiError('Data siswa tidak ditemukan', 'NOT_FOUND', 404);
    }

    // Check group task logic
    let targetMemberIds = [memberId];
    if (task.tipe_tugas === 'kelompok') {
      const group = await Kelompok.findOne({ tugas_id: task._id, anggota: memberId });
      if (!group) {
        return apiError('Anda belum terdaftar dalam kelompok untuk tugas ini', 'FORBIDDEN', 403);
      }
      if (group.ketua && group.ketua.toString() !== memberId.toString()) {
        return apiError('Hanya ketua kelompok yang berhak mengumpulkan tugas kelompok ini', 'FORBIDDEN', 403);
      }
      targetMemberIds = group.anggota;
    }

    // Upsert Nilai for each target member
    const updatedRecords: any[] = [];
    for (const mId of targetMemberIds) {
      const updated = await Nilai.findOneAndUpdate(
        { member_id: mId, tugas_id: task._id },
        {
          file_url: data.file_url,
          catatan_siswa: data.catatan_siswa || '',
          tanggal_mengumpulkan: new Date(),
        },
        { upsert: true, new: true }
      );
      updatedRecords.push(updated);
    }

    // Award +5 activity points to submitting member
    await Member.findByIdAndUpdate(memberId, { $inc: { poin_keaktifan: 5 } });

    await logAktivitasSiswa({
      nama_siswa: member.nama_lengkap,
      kelas: member.kelas,
      aksi: `Mengumpulkan tugas: ${task.judul}`,
      tipe: 'success',
    }).catch(() => {});

    return apiSuccess({
      tugas_id: task._id.toString(),
      tugas_judul: task.judul,
      submitted_at: new Date(),
      file_url: data.file_url || null,
      catatan_siswa: data.catatan_siswa || null,
      affected_members_count: updatedRecords.length,
    }, 'Tugas berhasil dikumpulkan!');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['siswa'],
  }
);
