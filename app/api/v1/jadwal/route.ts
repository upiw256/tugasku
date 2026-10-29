import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess } from '@/lib/api/response';
import { getAllJadwal, getJadwalKelas, getJadwalHari, getGuruList, parseJadwalItem } from '@/lib/jadwal-api';

// GET /api/v1/jadwal
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const searchParams = req.nextUrl.searchParams;
    const kelasParam = searchParams.get('kelas');
    const hari = searchParams.get('hari');

    // If student, default to their own class if not explicitly querying another allowed class
    const targetKelas = ctx.user?.role === 'siswa' && ctx.user.kelas && ctx.user.kelas !== '-'
      ? ctx.user.kelas
      : kelasParam;

    const [guruMap, rawJadwal] = await Promise.all([
      getGuruList(),
      targetKelas
        ? getJadwalKelas(targetKelas)
        : hari
        ? getJadwalHari(hari)
        : getAllJadwal(),
    ]);

    let filtered = rawJadwal;
    if (hari && targetKelas) {
      filtered = filtered.filter((j) => j.hari.toUpperCase() === hari.toUpperCase());
    }

    const parsed = filtered.map((item) => parseJadwalItem(item, guruMap));

    return apiSuccess({
      kelas: targetKelas || 'ALL',
      hari: hari || 'ALL',
      total_items: parsed.length,
      jadwal: parsed,
    }, 'Jadwal pelajaran berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: false,
  }
);
