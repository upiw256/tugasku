import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Kelompok } from '@/models';

// GET /api/v1/kelompok/[id]
export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const group = await Kelompok.findById(id)
      .populate('ketua', 'nis nama_lengkap kelas')
      .populate('anggota', 'nis nama_lengkap kelas')
      .lean();

    if (!group) {
      return apiError('Kelompok tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: (group as any)._id.toString(),
      tugas_id: (group as any).tugas_id ? (group as any).tugas_id.toString() : null,
      nama_kelompok: (group as any).nama_kelompok,
      kelas: (group as any).kelas,
      ketua: (group as any).ketua,
      anggota: (group as any).anggota || [],
    }, 'Detail kelompok berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// PUT /api/v1/kelompok/[id] (Admin only)
export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json();

    await connectDB();
    const updateData: any = {};
    if (body.nama_kelompok) updateData.nama_kelompok = body.nama_kelompok.trim();
    if (body.kelas) updateData.kelas = body.kelas.trim();
    if (body.ketua_id) updateData.ketua = body.ketua_id;
    if (Array.isArray(body.anggota_ids)) updateData.anggota = body.anggota_ids;

    const updated = await Kelompok.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('ketua', 'nis nama_lengkap')
      .populate('anggota', 'nis nama_lengkap');

    if (!updated) {
      return apiError('Kelompok tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: updated._id.toString(),
      nama_kelompok: updated.nama_kelompok,
      kelas: updated.kelas,
      ketua: updated.ketua,
      total_anggota: updated.anggota.length,
    }, 'Kelompok berhasil diperbarui');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);

// DELETE /api/v1/kelompok/[id] (Admin only)
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const deleted = await Kelompok.findByIdAndDelete(id);
    if (!deleted) {
      return apiError('Kelompok tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({ id }, 'Kelompok berhasil dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
