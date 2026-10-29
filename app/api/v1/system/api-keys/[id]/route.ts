import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { ApiKey } from '@/models';

// PATCH /api/v1/system/api-keys/[id] (Admin only)
export const PATCH = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json().catch(() => ({}));

    await connectDB();
    const keyDoc = await ApiKey.findById(id);
    if (!keyDoc) {
      return apiError('API Key tidak ditemukan', 'NOT_FOUND', 404);
    }

    if (body.is_active !== undefined) {
      keyDoc.is_active = Boolean(body.is_active);
    } else {
      keyDoc.is_active = !keyDoc.is_active;
    }

    if (body.rate_limit && typeof body.rate_limit === 'number') {
      keyDoc.rate_limit = body.rate_limit;
    }

    await keyDoc.save();

    return apiSuccess({
      id: keyDoc._id.toString(),
      is_active: keyDoc.is_active,
      rate_limit: keyDoc.rate_limit,
    }, `API Key berhasil ${keyDoc.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);

// DELETE /api/v1/system/api-keys/[id] (Admin only)
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const deleted = await ApiKey.findByIdAndDelete(id);
    if (!deleted) {
      return apiError('API Key tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({ id }, 'API Key berhasil dicabut/dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
