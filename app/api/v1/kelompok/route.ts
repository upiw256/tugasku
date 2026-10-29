import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiPaginated, apiSuccess } from '@/lib/api/response';
import { CreateKelompokSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Kelompok } from '@/models';

// GET /api/v1/kelompok
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')));
    const kelasParam = searchParams.get('kelas');
    const tugasId = searchParams.get('tugas_id');

    const query: any = {};

    const targetKelas = ctx.user?.role === 'siswa' ? ctx.user.kelas : kelasParam;
    if (targetKelas && targetKelas !== '-') {
      query.kelas = targetKelas;
    }

    if (tugasId) {
      query.tugas_id = tugasId;
    }

    const total = await Kelompok.countDocuments(query);
    const groups = await Kelompok.find(query)
      .populate('ketua', 'nis nama_lengkap kelas')
      .populate('anggota', 'nis nama_lengkap kelas')
      .sort({ nama_kelompok: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = groups.map((g: any) => ({
      id: g._id.toString(),
      tugas_id: g.tugas_id ? g.tugas_id.toString() : null,
      nama_kelompok: g.nama_kelompok,
      kelas: g.kelas,
      ketua: g.ketua ? {
        id: g.ketua._id.toString(),
        nis: g.ketua.nis,
        nama_lengkap: g.ketua.nama_lengkap,
      } : null,
      total_anggota: (g.anggota || []).length,
      anggota: (g.anggota || []).map((m: any) => ({
        id: m._id.toString(),
        nis: m.nis,
        nama_lengkap: m.nama_lengkap,
      })),
    }));

    return apiPaginated(formatted, page, limit, total, 'Daftar kelompok berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// POST /api/v1/kelompok (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const data = CreateKelompokSchema.parse(body);

    await connectDB();

    const newGroup = await Kelompok.create({
      tugas_id: data.tugas_id,
      nama_kelompok: data.nama_kelompok.trim(),
      kelas: data.kelas.trim(),
      ketua: data.ketua_id || undefined,
      anggota: data.anggota_ids || [],
    });

    return apiSuccess({
      id: newGroup._id.toString(),
      tugas_id: newGroup.tugas_id,
      nama_kelompok: newGroup.nama_kelompok,
      kelas: newGroup.kelas,
      ketua_id: newGroup.ketua,
      total_anggota: newGroup.anggota.length,
    }, 'Kelompok berhasil dibuat', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
