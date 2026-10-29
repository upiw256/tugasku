import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { ApiKey } from '@/models';

export interface ValidatedApiKey {
  id: string;
  key: string;
  name: string;
  owner: string;
  permissions: string[];
  rate_limit: number;
}

// In-memory cache for API keys with 60 seconds TTL to keep high throughput
interface CachedKey {
  data: ValidatedApiKey | null;
  cachedAt: number;
}
const keyCache = new Map<string, CachedKey>();
const CACHE_TTL_MS = 60 * 1000;

export function extractClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export function extractApiKey(req: NextRequest | Request): string | null {
  const headerKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key');
  if (headerKey) return headerKey.trim();

  // Also check Authorization: ApiKey <key>
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('apikey ')) {
    return authHeader.substring(7).trim();
  }

  // Fallback to query param
  try {
    const url = new URL(req.url);
    const queryKey = url.searchParams.get('api_key') || url.searchParams.get('apiKey');
    if (queryKey) return queryKey.trim();
  } catch (e) {
    // ignore
  }

  return null;
}

export async function validateApiKey(
  apiKeyString: string | null,
  clientIp: string = '127.0.0.1'
): Promise<{ valid: boolean; apiKey?: ValidatedApiKey; reason?: string }> {
  if (!apiKeyString) {
    return { valid: false, reason: 'API Key is missing. Provide X-API-Key header.' };
  }

  // 1. Check Master API Key (useful for dev / initial setup / server-to-server)
  const masterKey = process.env.MASTER_API_KEY || 'tk_master_margaasih_2026';
  if (apiKeyString === masterKey) {
    return {
      valid: true,
      apiKey: {
        id: 'master',
        key: masterKey,
        name: 'Master / Internal Key',
        owner: 'system@sman1margaasih.sch.id',
        permissions: ['read', 'write', 'admin'],
        rate_limit: 1000,
      },
    };
  }

  // 2. Check cache
  const cached = keyCache.get(apiKeyString);
  const now = Date.now();
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    if (!cached.data) {
      return { valid: false, reason: 'API Key is invalid or deactivated.' };
    }
    return { valid: true, apiKey: cached.data };
  }

  // 3. Query Database
  await connectDB();
  const keyDoc = await ApiKey.findOne({ key: apiKeyString, is_active: true });

  if (!keyDoc) {
    keyCache.set(apiKeyString, { data: null, cachedAt: now });
    return { valid: false, reason: 'API Key is invalid or deactivated.' };
  }

  // 4. Check expiry
  if (keyDoc.expires_at && new Date(keyDoc.expires_at).getTime() < now) {
    keyCache.set(apiKeyString, { data: null, cachedAt: now });
    return { valid: false, reason: 'API Key has expired.' };
  }

  // 5. Check IP Whitelist
  if (
    keyDoc.allowed_ips &&
    keyDoc.allowed_ips.length > 0 &&
    !keyDoc.allowed_ips.includes('*') &&
    !keyDoc.allowed_ips.includes(clientIp)
  ) {
    return { valid: false, reason: `IP address (${clientIp}) is not whitelisted for this API Key.` };
  }

  const validated: ValidatedApiKey = {
    id: keyDoc._id.toString(),
    key: keyDoc.key,
    name: keyDoc.name,
    owner: keyDoc.owner,
    permissions: keyDoc.permissions || ['read', 'write'],
    rate_limit: keyDoc.rate_limit || 100,
  };

  // Cache it
  keyCache.set(apiKeyString, { data: validated, cachedAt: now });

  // Update last_used_at non-blocking
  ApiKey.updateOne({ _id: keyDoc._id }, { last_used_at: new Date() }).exec().catch(() => {});

  return { valid: true, apiKey: validated };
}
