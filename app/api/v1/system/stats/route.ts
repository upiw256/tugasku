import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiSuccess } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Member, Tugas, Nilai, Pengumuman, Materi, SoalPG, Absensi } from '@/models';

// GET /api/v1/system/stats (Admin only)
export const GET = createApiHandler(
  async (_req: NextRequest) => {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSiswa,
      totalTugas,
      totalPengumpulan,
      totalPengumuman,
      totalMateri,
      totalKuis,
      totalAbsenHariIni,
    ] = await Promise.all([
      Member.countDocuments(),
      Tugas.countDocuments(),
      Nilai.countDocuments(),
      Pengumuman.countDocuments(),
      Materi.countDocuments(),
      SoalPG.countDocuments(),
      Absensi.countDocuments({ tanggal: today }),
    ]);

    return apiSuccess({
      total_siswa: totalSiswa,
      total_tugas: totalTugas,
      total_pengumpulan: totalPengumpulan,
      total_pengumuman: totalPengumuman,
      total_materi: totalMateri,
      total_kuis: totalKuis,
      absensi_hari_ini: {
        total_hadir: totalAbsenHariIni,
        persentase_kehadiran: totalSiswa > 0 ? Math.round((totalAbsenHariIni / totalSiswa) * 100) : 0,
      },
    }, 'Statistik sistem berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
