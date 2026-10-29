import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { User } from '@/models';

export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    await connectDB();
    const userDoc = await User.findById(ctx.user!.sub).populate('member_id');
    if (!userDoc) {
      return apiError('User tidak ditemukan', 'NOT_FOUND', 404);
    }

    const memberData = userDoc.member_id && typeof userDoc.member_id === 'object'
      ? userDoc.member_id
      : null;

    return apiSuccess({
      id: userDoc._id,
      username: userDoc.user,
      role: userDoc.role,
      member: memberData ? {
        id: (memberData as any)._id,
        nis: (memberData as any).nis,
        nama_lengkap: (memberData as any).nama_lengkap,
        kelas: (memberData as any).kelas,
        jenis_kelamin: (memberData as any).jenis_kelamin,
        poin_keaktifan: (memberData as any).poin_keaktifan ?? 0,
      } : null,
    }, 'Profil berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
