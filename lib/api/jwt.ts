import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'tugasku-secret-key-super-secure-2026';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const JWT_ISSUER = 'tugasku-api';
const JWT_AUDIENCE = 'tugasku-client';

export interface ApiUserPayload extends JWTPayload {
  sub: string; // user MongoDB _id
  email: string;
  role: 'admin' | 'siswa';
  member_id?: string;
  nama?: string;
  kelas?: string;
}

export async function signAccessToken(payload: Omit<ApiUserPayload, 'iat' | 'exp' | 'iss' | 'aud'>, expiresIn: string = '7d'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string, expiresIn: string = '30d'): Promise<string> {
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyApiToken(token: string): Promise<ApiUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as ApiUserPayload;
  } catch (error) {
    return null;
  }
}
