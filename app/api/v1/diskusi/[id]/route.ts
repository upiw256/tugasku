import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { MateriComment } from '@/models';
import { pusherServer } from '@/lib/pusher';

// DELETE /api/v1/diskusi/[id]
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const comment = await MateriComment.findById(id);
    if (!comment) {
      return apiError('Komentar tidak ditemukan', 'NOT_FOUND', 404);
    }

    // Role check: Admin can delete any comment, Siswa can only delete own comment
    if (ctx.user?.role === 'siswa' && comment.user_email !== ctx.user.email) {
      return apiError('Anda hanya dapat menghapus komentar Anda sendiri', 'FORBIDDEN', 403);
    }

    await MateriComment.findByIdAndDelete(id);

    try {
      await pusherServer.trigger(`materi-${comment.materi_id}`, 'delete-comment', { id });
    } catch {
      // Pusher broadcast non-fatal
    }

    return apiSuccess({ id }, 'Komentar berhasil dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
