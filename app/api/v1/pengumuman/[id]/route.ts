import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { UpdatePengumumanSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Pengumuman } from '@/models';

// GET /api/v1/pengumuman/[id]
export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const info = await Pengumuman.findById(id).lean();
    if (!info) {
      return apiError('Pengumuman tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: (info as any)._id.toString(),
      judul: (info as any).judul,
      konten: (info as any).konten,
      prioritas: (info as any).prioritas,
      dibuat_oleh: (info as any).dibuat_oleh,
      tanggal: (info as any).tanggal,
    }, 'Detail pengumuman berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: false,
  }
);

// PUT /api/v1/pengumuman/[id] (Admin only)
export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json();
    const data = UpdatePengumumanSchema.parse(body);

    await connectDB();

    const updated = await Pengumuman.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    if (!updated) {
      return apiError('Pengumuman tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: (updated as any)._id.toString(),
      judul: (updated as any).judul,
      konten: (updated as any).konten,
      prioritas: (updated as any).prioritas,
      tanggal: (updated as any).tanggal,
    }, 'Pengumuman berhasil diperbarui');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);

// DELETE /api/v1/pengumuman/[id] (Admin only)
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const deleted = await Pengumuman.findByIdAndDelete(id);
    if (!deleted) {
      return apiError('Pengumuman tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({ id }, 'Pengumuman berhasil dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
