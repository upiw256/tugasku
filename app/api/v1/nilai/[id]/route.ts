import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Nilai } from '@/models';

// GET /api/v1/nilai/[id]
export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const submission = await Nilai.findById(id)
      .populate('member_id', 'nis nama_lengkap kelas')
      .populate('tugas_id', 'judul deadline')
      .lean();

    if (!submission) {
      return apiError('Data pengumpulan nilai tidak ditemukan', 'NOT_FOUND', 404);
    }

    if (ctx.user?.role === 'siswa') {
      const studentMemberId = (submission as any).member_id?._id?.toString() || (submission as any).member_id?.toString();
      if (studentMemberId !== ctx.user.member_id) {
        return apiError('Anda tidak memiliki akses ke pengumpulan ini', 'FORBIDDEN', 403);
      }
    }

    return apiSuccess({
      id: (submission as any)._id.toString(),
      member: (submission as any).member_id,
      tugas: (submission as any).tugas_id,
      nilai: (submission as any).nilai,
      file_url: (submission as any).file_url || null,
      catatan_siswa: (submission as any).catatan_siswa || null,
      tanggal_mengumpulkan: (submission as any).tanggal_mengumpulkan,
      tanggal_dinilai: (submission as any).tanggal_dinilai || null,
    }, 'Detail pengumpulan berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// PUT /api/v1/nilai/[id] (Admin only)
export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json();

    await connectDB();
    const updateData: any = {};
    if (typeof body.nilai === 'number') updateData.nilai = body.nilai;
    if (body.catatan_siswa !== undefined) updateData.catatan_siswa = body.catatan_siswa;
    if (body.file_url !== undefined) updateData.file_url = body.file_url;
    if (body.nilai !== undefined) updateData.tanggal_dinilai = new Date();

    const updated = await Nilai.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updated) {
      return apiError('Data nilai tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: updated._id.toString(),
      nilai: updated.nilai,
      tanggal_dinilai: updated.tanggal_dinilai,
    }, 'Data nilai berhasil diperbarui');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);

// DELETE /api/v1/nilai/[id] (Admin only)
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const deleted = await Nilai.findByIdAndDelete(id);
    if (!deleted) {
      return apiError('Data nilai tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({ id }, 'Data pengumpulan/nilai berhasil dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
