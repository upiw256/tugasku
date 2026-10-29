import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiPaginated, apiSuccess } from '@/lib/api/response';
import { CreateApiKeySchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { ApiKey } from '@/models';
import crypto from 'crypto';

// GET /api/v1/system/api-keys (Admin only)
export const GET = createApiHandler(
  async (req: NextRequest) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const total = await ApiKey.countDocuments();
    const keys = await ApiKey.find()
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = keys.map((k: any) => ({
      id: k._id.toString(),
      name: k.name,
      owner: k.owner,
      masked_key: k.key.length > 10 ? `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 4)}` : '***',
      permissions: k.permissions || [],
      rate_limit: k.rate_limit,
      is_active: k.is_active,
      allowed_ips: k.allowed_ips || ['*'],
      created_at: k.created_at,
      last_used_at: k.last_used_at || null,
      expires_at: k.expires_at || null,
    }));

    return apiPaginated(formatted, page, limit, total, 'Daftar API Key berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);

// POST /api/v1/system/api-keys (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const data = CreateApiKeySchema.parse(body);

    await connectDB();

    // Generate secure random key: tk_{env}_{hex32}
    const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const randomHex = crypto.randomBytes(16).toString('hex');
    const generatedKey = `tk_${env}_${randomHex}`;

    let expiresAt: Date | null = null;
    if (data.expires_in_days && data.expires_in_days > 0) {
      expiresAt = new Date(Date.now() + data.expires_in_days * 24 * 3600 * 1000);
    }

    const newApiKey = await ApiKey.create({
      key: generatedKey,
      name: data.name.trim(),
      owner: data.owner.trim(),
      permissions: data.permissions || ['read', 'write'],
      rate_limit: data.rate_limit || 100,
      allowed_ips: data.allowed_ips || ['*'],
      is_active: true,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    return apiSuccess({
      id: newApiKey._id.toString(),
      key: generatedKey, // Complete key returned ONLY upon creation!
      name: newApiKey.name,
      owner: newApiKey.owner,
      permissions: newApiKey.permissions,
      rate_limit: newApiKey.rate_limit,
      allowed_ips: newApiKey.allowed_ips,
      created_at: newApiKey.created_at,
      expires_at: newApiKey.expires_at,
    }, 'API Key berhasil dibuat. Simpan kunci ini dengan aman karena tidak akan ditampilkan lagi secara penuh!', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
