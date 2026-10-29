import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getGuruList, getJadwalGuru } from '@/lib/jadwal-api';

// GET /api/v1/jadwal/guru
export const GET = createApiHandler(
  async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const namaGuru = searchParams.get('nama');

    if (namaGuru) {
      const searchResult = await getJadwalGuru(namaGuru);
      if (!searchResult) {
        return apiError(`Jadwal untuk guru '${namaGuru}' tidak ditemukan`, 'NOT_FOUND', 404);
      }
      return apiSuccess(searchResult, `Jadwal guru '${namaGuru}' berhasil diambil`);
    }

    const guruMap = await getGuruList();
    const guruList = Object.entries(guruMap).map(([kode, detail]) => ({
      kode,
      nama: detail.nama,
      mapel: detail.mapel,
    }));

    return apiSuccess({
      total: guruList.length,
      guru: guruList,
    }, 'Daftar guru berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: false,
  }
);
