import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiError, apiSuccess } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { ExpoPushToken } from '@/models';

const EXPO_TOKEN_PATTERN = /^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/;

export const POST = createApiHandler(
  async (request: NextRequest, ctx: ApiContext) => {
    const body = await request.json();
    const token = String(body?.token ?? '').trim();
    const platform = String(body?.platform ?? '');
    if (!EXPO_TOKEN_PATTERN.test(token) || !['android', 'ios'].includes(platform)) {
      return apiError('Token atau platform notifikasi tidak valid', 'VALIDATION_ERROR', 400);
    }

    await connectDB();
    await ExpoPushToken.updateOne(
      { token },
      {
        $set: {
          token,
          user_id: ctx.user!.sub,
          platform,
          is_active: true,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );

    return apiSuccess({ registered: true }, 'Perangkat berhasil didaftarkan untuk notifikasi');
  },
  { requireApiKey: true, authRequired: true, roles: ['admin', 'siswa'], rateLimit: 30 }
);

export const DELETE = createApiHandler(
  async (request: NextRequest, ctx: ApiContext) => {
    const body = await request.json();
    const token = String(body?.token ?? '').trim();
    if (!EXPO_TOKEN_PATTERN.test(token)) {
      return apiError('Token notifikasi tidak valid', 'VALIDATION_ERROR', 400);
    }

    await connectDB();
    await ExpoPushToken.deleteOne({ token, user_id: ctx.user!.sub });
    return apiSuccess({ removed: true }, 'Perangkat dihapus dari notifikasi');
  },
  { requireApiKey: true, authRequired: true, roles: ['admin', 'siswa'], rateLimit: 30 }
);
