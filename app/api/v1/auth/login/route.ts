import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { LoginSchema } from '@/lib/api/validation';
import { signAccessToken, signRefreshToken } from '@/lib/api/jwt';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import md5 from 'md5';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const parsed = LoginSchema.parse(body);
    const { username, password } = parsed;

    await connectDB();

    const foundUser = await User.findOne({ user: username.trim() }).populate('member_id');

    if (!foundUser) {
      return apiError(
        'Username atau password salah',
        'INVALID_CREDENTIALS',
        401
      );
    }

    const inputHash = md5(password);
    if (foundUser.password !== inputHash) {
      return apiError(
        'Username atau password salah',
        'INVALID_CREDENTIALS',
        401
      );
    }

    // Determine display name and member info
    let displayName = (foundUser as any).nama_lengkap;
    let memberId: string | undefined = undefined;
    let kelas: string = (foundUser as any).kelas || '-';

    if (foundUser.member_id && typeof foundUser.member_id === 'object') {
      const memberObj = foundUser.member_id as any;
      displayName = memberObj.nama_lengkap || displayName;
      memberId = memberObj._id ? memberObj._id.toString() : undefined;
      kelas = memberObj.kelas || kelas;
    }

    if (!displayName) {
      displayName = foundUser.role === 'admin' ? 'Administrator' : foundUser.user;
    }

    const userId = foundUser._id.toString();

    // Generate JWT access & refresh tokens
    const access_token = await signAccessToken({
      sub: userId,
      email: foundUser.user,
      role: foundUser.role,
      nama: displayName,
      member_id: memberId,
      kelas,
    });

    const refresh_token = await signRefreshToken(userId);

    // Audit log
    await logAktivitasSiswa({
      nama_siswa: displayName,
      kelas,
      kategori: 'Siswa',
      aksi: `API Login sukses (${foundUser.user})`,
      tipe: 'success',
    }).catch(() => {});

    return apiSuccess({
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 7 * 24 * 3600, // 7 days in seconds
      user: {
        id: userId,
        username: foundUser.user,
        nama: displayName,
        role: foundUser.role,
        kelas,
        member_id: memberId,
      },
    }, 'Login berhasil');
  },
  {
    requireApiKey: true,
    authRequired: false,
  }
);
