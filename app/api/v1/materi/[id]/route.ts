import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { UpdateMateriSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Materi } from '@/models';

// GET /api/v1/materi/[id]
export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const materi = await Materi.findById(id).lean();
    if (!materi) {
      return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: (materi as any)._id.toString(),
      judul: (materi as any).judul,
      deskripsi: (materi as any).deskripsi || '',
      file_url: (materi as any).file_url,
      kelas: Array.isArray((materi as any).kelas) ? (materi as any).kelas : [(materi as any).kelas],
      diunggah_oleh: (materi as any).diunggah_oleh,
      tanggal_upload: (materi as any).tanggal_upload,
      total_downloads: ((materi as any).downloads || []).length,
    }, 'Detail materi berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// PUT /api/v1/materi/[id] (Admin only)
export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json();
    const data = UpdateMateriSchema.parse(body);

    await connectDB();

    const updateFields: any = { ...data };
    if (data.kelas) {
      updateFields.kelas = Array.isArray(data.kelas)
        ? data.kelas
        : typeof data.kelas === 'string' && data.kelas.includes(',')
        ? data.kelas.split(',').map((k: string) => k.trim())
        : [String(data.kelas).trim()];
    }

    const updated = await Materi.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).lean();
    if (!updated) {
      return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: (updated as any)._id.toString(),
      judul: (updated as any).judul,
      deskripsi: (updated as any).deskripsi,
      file_url: (updated as any).file_url,
      kelas: (updated as any).kelas,
    }, 'Materi berhasil diperbarui');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);

// DELETE /api/v1/materi/[id] (Admin only)
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const deleted = await Materi.findByIdAndDelete(id);
    if (!deleted) {
      return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({ id }, 'Materi berhasil dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
