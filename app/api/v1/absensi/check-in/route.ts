import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { AbsensiCheckInSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Absensi, Member } from '@/models';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

// POST /api/v1/absensi/check-in (Siswa only)
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    let status = 'Hadir';
    try {
      const body = await req.json();
      const parsed = AbsensiCheckInSchema.parse(body);
      if (parsed.status) status = parsed.status;
    } catch {
      // Body optional
    }

    await connectDB();
    const memberId = ctx.user?.member_id;
    if (!memberId) {
      return apiError('Profil siswa tidak ditemukan', 'FORBIDDEN', 403);
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return apiError('Data siswa tidak ditemukan', 'NOT_FOUND', 404);
    }

    // Determine today at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Absensi.findOne({
      member_id: memberId,
      tanggal: today,
    });

    if (existing) {
      return apiError('Anda sudah mengisi absensi untuk hari ini', 'ALREADY_CHECKED_IN', 409);
    }

    const newAbsen = await Absensi.create({
      member_id: memberId,
      tanggal: today,
      waktu: new Date(),
      status,
    });

    // Reward points (+2 keaktifan for checking in)
    await Member.findByIdAndUpdate(memberId, { $inc: { poin_keaktifan: 2 } });

    await logAktivitasSiswa({
      nama_siswa: member.nama_lengkap,
      kelas: member.kelas,
      aksi: `Absen Masuk (${status})`,
      tipe: 'success',
    }).catch(() => {});

    return apiSuccess({
      id: newAbsen._id.toString(),
      tanggal: newAbsen.tanggal,
      waktu: newAbsen.waktu,
      status: newAbsen.status,
    }, 'Berhasil melakukan absensi masuk!', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['siswa'],
  }
);
