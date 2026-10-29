import { apiSuccess, apiError, apiPaginated } from '@/lib/api/response';
import { signAccessToken, signRefreshToken, verifyApiToken } from '@/lib/api/jwt';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { validateApiKey } from '@/lib/api/api-key';
import { LoginSchema, CreateTugasSchema, CreateMemberSchema } from '@/lib/api/validation';

describe('TugasKu Full REST API v1 Suite', () => {
  describe('Standard API Response Formats', () => {
    test('apiSuccess returns standard envelope', async () => {
      const res = apiSuccess({ foo: 'bar' }, 'Sukses', 200);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe('Sukses');
      expect(json.data).toEqual({ foo: 'bar' });
    });

    test('apiPaginated formats pagination metadata correctly', async () => {
      const items = [{ id: '1' }, { id: '2' }];
      const res = apiPaginated(items, 1, 10, 25);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        total_pages: 3,
      });
      expect(json.data).toHaveLength(2);
    });

    test('apiError returns structured error response', async () => {
      const res = apiError('Data tidak valid', 'VALIDATION_ERROR', 400, [
        { field: 'judul', message: 'Wajib diisi' }
      ]);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.message).toBe('Data tidak valid');
      expect(json.error.details).toHaveLength(1);
    });
  });

  describe('JWT Security & Token Verification', () => {
    test('signAccessToken generates valid verifiable token', async () => {
      const payload = {
        sub: '654321654321654321654321',
        email: '2201001@siswa.com',
        role: 'siswa' as const,
        nama: 'Ahmad Siswa',
        kelas: 'XI 1',
      };

      const token = await signAccessToken(payload, '1h');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const verified = await verifyApiToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe(payload.sub);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe('siswa');
      expect(verified?.nama).toBe('Ahmad Siswa');
    });

    test('signRefreshToken generates valid refresh token', async () => {
      const token = await signRefreshToken('user_123', '7d');
      const verified = await verifyApiToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe('user_123');
      expect((verified as any)?.type).toBe('refresh');
    });

    test('verifyApiToken rejects tampered or garbage token', async () => {
      const verified = await verifyApiToken('not.a.valid.jwt.token');
      expect(verified).toBeNull();
    });
  });

  describe('Rate Limiter', () => {
    test('checkRateLimit tracks requests and enforces limit', async () => {
      const key = `test_client_${Date.now()}`;
      const limit = 5;

      for (let i = 0; i < 5; i++) {
        const res = await checkRateLimit(key, limit, 60);
        expect(res.success).toBe(true);
      }

      // 6th request should fail limit
      const exceeded = await checkRateLimit(key, limit, 60);
      expect(exceeded.success).toBe(false);
      expect(exceeded.remaining).toBe(0);
    });
  });

  describe('API Key Validation', () => {
    test('rejects missing API key', async () => {
      const res = await validateApiKey(null);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('API Key is missing');
    });

    test('accepts Master API key', async () => {
      const masterKey = process.env.MASTER_API_KEY || 'tk_master_margaasih_2026';
      const res = await validateApiKey(masterKey);
      expect(res.valid).toBe(true);
      expect(res.apiKey?.permissions).toContain('admin');
    });
  });

  describe('Zod Input Validation Schemas', () => {
    test('LoginSchema validates input properly', () => {
      expect(() => LoginSchema.parse({ username: '', password: '' })).toThrow();
      expect(LoginSchema.parse({ username: 'user1', password: 'secretpassword' })).toEqual({
        username: 'user1',
        password: 'secretpassword',
      });
    });

    test('CreateTugasSchema validates deadlines and classes', () => {
      expect(() => CreateTugasSchema.parse({ judul: '' })).toThrow();
      const valid = CreateTugasSchema.parse({
        judul: 'Tugas Kimia Larutan',
        deadline: '2026-11-01T23:59:00Z',
        kelas: ['XI 1', 'XI 2'],
      });
      expect(valid.judul).toBe('Tugas Kimia Larutan');
      expect(valid.tipe_pengumpulan).toBe('online');
    });

    test('CreateMemberSchema enforces required fields', () => {
      expect(() => CreateMemberSchema.parse({ nis: '2201' })).toThrow();
      const student = CreateMemberSchema.parse({
        nis: '2201001',
        nama_lengkap: 'Budi Santoso',
        kelas: 'X 1',
        jenis_kelamin: 'L',
      });
      expect(student.nama_lengkap).toBe('Budi Santoso');
    });
  });
});
