import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiPaginated } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { LogAktivitasSiswa } from '@/models';

// GET /api/v1/system/activity-logs (Admin only)
export const GET = createApiHandler(
  async (req: NextRequest) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')));
    const kategori = searchParams.get('kategori');
    const tipe = searchParams.get('tipe');

    const query: any = {};
    if (kategori) query.kategori = kategori;
    if (tipe) query.tipe = tipe;

    const total = await LogAktivitasSiswa.countDocuments(query);
    const logs = await LogAktivitasSiswa.find(query)
      .sort({ waktu: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = logs.map((l: any) => ({
      id: l._id.toString(),
      nama_siswa: l.nama_siswa,
      kelas: l.kelas,
      kategori: l.kategori,
      aksi: l.aksi,
      tipe: l.tipe,
      waktu: l.waktu,
    }));

    return apiPaginated(formatted, page, limit, total, 'Log aktivitas berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
