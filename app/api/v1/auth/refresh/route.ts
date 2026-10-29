import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { RefreshTokenSchema } from '@/lib/api/validation';
import { verifyApiToken, signAccessToken } from '@/lib/api/jwt';
import { connectDB } from '@/lib/db';
import { User } from '@/models';

export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const { refresh_token } = RefreshTokenSchema.parse(body);

    const payload = await verifyApiToken(refresh_token);
    if (!payload || !payload.sub || (payload as any).type !== 'refresh') {
      return apiError(
        'Refresh token tidak valid atau telah kadaluarsa',
        'TOKEN_INVALID',
        401
      );
    }

    await connectDB();
    const user = await User.findById(payload.sub).populate('member_id');
    if (!user) {
      return apiError('User tidak ditemukan', 'NOT_FOUND', 404);
    }

    let displayName = (user as any).nama_lengkap;
    let memberId: string | undefined = undefined;
    let kelas: string = (user as any).kelas || '-';

    if (user.member_id && typeof user.member_id === 'object') {
      const memberObj = user.member_id as any;
      displayName = memberObj.nama_lengkap || displayName;
      memberId = memberObj._id ? memberObj._id.toString() : undefined;
      kelas = memberObj.kelas || kelas;
    }

    if (!displayName) {
      displayName = user.role === 'admin' ? 'Administrator' : user.user;
    }

    const newAccessToken = await signAccessToken({
      sub: user._id.toString(),
      email: user.user,
      role: user.role,
      nama: displayName,
      member_id: memberId,
      kelas,
    });

    return apiSuccess({
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 7 * 24 * 3600,
    }, 'Token berhasil diperbarui');
  },
  {
    requireApiKey: true,
    authRequired: false,
  }
);
