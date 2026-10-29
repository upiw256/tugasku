import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ChangePasswordSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import md5 from 'md5';

export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const body = await req.json();
    const { old_password, new_password } = ChangePasswordSchema.parse(body);

    await connectDB();
    const userDoc = await User.findById(ctx.user!.sub);
    if (!userDoc) {
      return apiError('User tidak ditemukan', 'NOT_FOUND', 404);
    }

    if (userDoc.password !== md5(old_password)) {
      return apiError('Password lama salah', 'INVALID_CREDENTIALS', 400);
    }

    userDoc.password = md5(new_password);
    await userDoc.save();

    return apiSuccess({ id: userDoc._id }, 'Password berhasil diubah');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
