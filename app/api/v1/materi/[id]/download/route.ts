import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Materi, Member } from '@/models';

// POST /api/v1/materi/[id]/download
export const POST = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const materi = await Materi.findById(id);
    if (!materi) {
      return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);
    }

    const userId = ctx.user?.sub;
    if (userId) {
      // Add user to downloads array if not already present
      await Materi.findByIdAndUpdate(id, {
        $addToSet: { downloads: userId },
      });
    }

    // Award +1 keaktifan point if student
    if (ctx.user?.role === 'siswa' && ctx.user.member_id) {
      await Member.findByIdAndUpdate(ctx.user.member_id, {
        $inc: { poin_keaktifan: 1 },
      });
    }

    return apiSuccess({
      materi_id: id,
      file_url: materi.file_url,
    }, 'Download berhasil dicatat');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
