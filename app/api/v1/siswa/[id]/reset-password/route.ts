import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ResetPasswordSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { User, Member } from '@/models';
import md5 from 'md5';

// POST /api/v1/siswa/[id]/reset-password (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    let newPassword = '123456';

    try {
      const body = await req.json();
      const parsed = ResetPasswordSchema.parse(body);
      if (parsed.new_password) newPassword = parsed.new_password;
    } catch {
      // Body is optional; default is 123456
    }

    await connectDB();
    const member = await Member.findById(id);
    if (!member) {
      return apiError('Data siswa tidak ditemukan', 'NOT_FOUND', 404);
    }

    const updatedUser = await User.findOneAndUpdate(
      { member_id: id },
      { password: md5(newPassword) },
      { new: true }
    );

    if (!updatedUser) {
      return apiError('Akun login untuk siswa ini tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      member_id: id,
      username: updatedUser.user,
      new_password: newPassword,
    }, `Password siswa berhasil direset menjadi ${newPassword}`);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
