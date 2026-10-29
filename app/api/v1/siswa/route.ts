import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiPaginated, apiSuccess, apiError } from '@/lib/api/response';
import { CreateMemberSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Member, User } from '@/models';
import md5 from 'md5';

// GET /api/v1/siswa
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const kelas = searchParams.get('kelas');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'nama_lengkap';
    const sortOrder = searchParams.get('order') === 'desc' ? -1 : 1;

    const query: any = {};

    // RBAC: Siswa can only see their own class if filtered
    if (ctx.user?.role === 'siswa') {
      if (ctx.user.kelas && ctx.user.kelas !== '-') {
        query.kelas = ctx.user.kelas;
      }
    } else if (kelas) {
      query.kelas = kelas;
    }

    if (search) {
      query.$or = [
        { nama_lengkap: { $regex: search, $options: 'i' } },
        { nis: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Map and sanitize members
    const formatted = members.map((m: any) => ({
      id: m._id.toString(),
      nis: m.nis,
      nama_lengkap: m.nama_lengkap,
      kelas: m.kelas,
      jenis_kelamin: m.jenis_kelamin,
      poin_keaktifan: m.poin_keaktifan ?? 0,
    }));

    return apiPaginated(formatted, page, limit, total, 'Daftar siswa berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// POST /api/v1/siswa (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const data = CreateMemberSchema.parse(body);

    await connectDB();

    // Check if NIS already exists
    const existing = await Member.findOne({ nis: data.nis.trim() });
    if (existing) {
      return apiError(`Siswa dengan NIS ${data.nis} sudah terdaftar`, 'ALREADY_EXISTS', 409);
    }

    // 1. Create Member
    const newMember = await Member.create({
      nis: data.nis.trim(),
      nama_lengkap: data.nama_lengkap.trim(),
      kelas: data.kelas.trim(),
      jenis_kelamin: data.jenis_kelamin,
      poin_keaktifan: data.poin_keaktifan ?? 0,
    });

    // 2. Create User login account
    const userEmail = `${data.nis.trim()}@siswa.com`;
    const passwordHash = md5(data.password || '123456');

    await User.create({
      user: userEmail,
      password: passwordHash,
      role: 'siswa',
      member_id: newMember._id,
    });

    return apiSuccess({
      id: newMember._id.toString(),
      nis: newMember.nis,
      nama_lengkap: newMember.nama_lengkap,
      kelas: newMember.kelas,
      jenis_kelamin: newMember.jenis_kelamin,
      poin_keaktifan: newMember.poin_keaktifan,
      email: userEmail,
    }, 'Siswa berhasil ditambahkan', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
