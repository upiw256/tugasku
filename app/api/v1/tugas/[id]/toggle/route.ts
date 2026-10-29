import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Tugas } from '@/models';

// PATCH /api/v1/tugas/[id]/toggle (Admin only)
export const PATCH = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const task = await Tugas.findById(id);
    if (!task) {
      return apiError('Tugas tidak ditemukan', 'NOT_FOUND', 404);
    }

    task.is_active = !task.is_active;
    await task.save();

    return apiSuccess({
      id: task._id.toString(),
      is_active: task.is_active,
    }, `Status pengumpulan tugas berhasil ${task.is_active ? 'dibuka' : 'dikunci'}`);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
