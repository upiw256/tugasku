import { NextRequest, NextResponse } from 'next/server';
import { apiError } from './response';
import { extractApiKey, validateApiKey, extractClientIp, ValidatedApiKey } from './api-key';
import { verifyApiToken, ApiUserPayload } from './jwt';
import { checkRateLimit } from './rate-limit';
import { auth } from '@/lib/auth';
import { ZodError } from 'zod';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

export interface ApiContext {
  user: ApiUserPayload | null;
  apiKey: ValidatedApiKey | null;
  clientIp: string;
  params?: any;
}

export type ApiHandlerFunction = (
  req: NextRequest,
  ctx: ApiContext
) => Promise<NextResponse> | NextResponse;

export interface ApiHandlerOptions {
  requireApiKey?: boolean; // default true for /api/v1/*
  authRequired?: boolean;  // default false
  roles?: ('admin' | 'siswa')[]; // allowed roles
  permissions?: string[];   // permissions required on API Key (e.g. ['write'])
  rateLimit?: number;      // override rate limit per minute
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, Accept',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

/**
 * Higher-order function wrapping Next.js route handlers with security, rate limiting, and standard responses.
 */
export function createApiHandler(
  fn: ApiHandlerFunction,
  options: ApiHandlerOptions = {}
) {
  const {
    requireApiKey = true,
    authRequired = false,
    roles,
    permissions,
    rateLimit,
  } = options;

  return async function (req: NextRequest, rawContext: any = {}): Promise<NextResponse> {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const clientIp = extractClientIp(req);
    let resolvedParams: any = undefined;
    if (rawContext?.params) {
      resolvedParams = typeof rawContext.params.then === 'function' ? await rawContext.params : rawContext.params;
    }

    let validatedKey: ValidatedApiKey | null = null;

    // 2. API Key Validation
    if (requireApiKey) {
      const apiKeyString = extractApiKey(req);
      const keyValidation = await validateApiKey(apiKeyString, clientIp);

      if (!keyValidation.valid) {
        return apiError(
          keyValidation.reason || 'Invalid API Key',
          'INVALID_API_KEY',
          401,
          undefined,
          CORS_HEADERS
        );
      }

      validatedKey = keyValidation.apiKey || null;

      // Check Key Permissions if required
      if (permissions && permissions.length > 0 && validatedKey) {
        const hasAllPerms = permissions.every(p => validatedKey!.permissions.includes(p) || validatedKey!.permissions.includes('admin'));
        if (!hasAllPerms) {
          return apiError(
            `API Key does not have the required permissions: ${permissions.join(', ')}`,
            'FORBIDDEN',
            403,
            undefined,
            CORS_HEADERS
          );
        }
      }
    }

    // 3. Rate Limiting
    const rateLimitIdentifier = validatedKey ? `key:${validatedKey.key}` : `ip:${clientIp}`;
    const maxRequests = rateLimit || validatedKey?.rate_limit || 100;
    const rateCheck = await checkRateLimit(rateLimitIdentifier, maxRequests, 60);

    const rateLimitHeaders = {
      ...CORS_HEADERS,
      'X-RateLimit-Limit': String(rateCheck.limit),
      'X-RateLimit-Remaining': String(rateCheck.remaining),
      'X-RateLimit-Reset': String(rateCheck.reset),
    };

    if (!rateCheck.success) {
      return apiError(
        'Rate limit exceeded. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        429,
        undefined,
        rateLimitHeaders
      );
    }

    // 4. Authentication (JWT or Session)
    let authenticatedUser: ApiUserPayload | null = null;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      authenticatedUser = await verifyApiToken(token);
    } else {
      // Fallback: Check NextAuth session for web clients
      try {
        const session = await auth();
        if (session && session.user) {
          authenticatedUser = {
            sub: (session.user as any).id || (session.user as any)._id,
            email: session.user.email || '',
            role: (session.user as any).role || 'siswa',
            nama: session.user.name || undefined,
            member_id: (session.user as any).member_id || undefined,
          };
        }
      } catch (e) {
        // session lookup failed
      }
    }

    if (authRequired) {
      if (!authenticatedUser) {
        return apiError(
          'Authentication required. Please provide a valid Bearer token.',
          'UNAUTHORIZED',
          401,
          undefined,
          rateLimitHeaders
        );
      }

      // 5. Role-based Access Control (RBAC)
      if (roles && roles.length > 0) {
        if (!roles.includes(authenticatedUser.role)) {
          return apiError(
            `Access forbidden for role '${authenticatedUser.role}'.`,
            'FORBIDDEN',
            403,
            undefined,
            rateLimitHeaders
          );
        }
      }
    }

    // 6. Execute Handler
    try {
      const context: ApiContext = {
        user: authenticatedUser,
        apiKey: validatedKey,
        clientIp,
        params: resolvedParams,
      };

      const response = await fn(req, context);

      // Attach CORS and rate limit headers to response
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        if (!response.headers.has(key)) {
          response.headers.set(key, value);
        }
      }

      return response;
    } catch (error: any) {
      // Handle Zod Validation Errors
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return apiError(
          'Validation failed for input data',
          'VALIDATION_ERROR',
          400,
          details,
          rateLimitHeaders
        );
      }

      console.error(`❌ API Error on [${req.method}] ${req.nextUrl?.pathname || req.url}:`, error);

      await logAktivitasSiswa({
        aksi: `API Error [${req.method} ${req.nextUrl?.pathname || ''}]: ${error?.message || String(error)}`,
        tipe: 'error',
        kategori: 'Sistem',
      }).catch(() => {});

      return apiError(
        error?.message || 'Internal server error occurred',
        'INTERNAL_ERROR',
        500,
        undefined,
        rateLimitHeaders
      );
    }
  };
}
