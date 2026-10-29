import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { UpdateMemberSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Member, User, Nilai } from '@/models';

// GET /api/v1/siswa/[id]
export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    // RBAC: Siswa can only view their own profile
    if (ctx.user?.role === 'siswa' && ctx.user.member_id !== id) {
      return apiError('Anda hanya dapat melihat data profil Anda sendiri', 'FORBIDDEN', 403);
    }

    const member = await Member.findById(id).lean();
    if (!member) {
      return apiError('Data siswa tidak ditemukan', 'NOT_FOUND', 404);
    }

    const userAccount = await User.findOne({ member_id: id }).select('user role').lean();

    return apiSuccess({
      id: (member as any)._id.toString(),
      nis: (member as any).nis,
      nama_lengkap: (member as any).nama_lengkap,
      kelas: (member as any).kelas,
      jenis_kelamin: (member as any).jenis_kelamin,
      poin_keaktifan: (member as any).poin_keaktifan ?? 0,
      user_account: userAccount ? {
        id: (userAccount as any)._id.toString(),
        username: (userAccount as any).user,
        role: (userAccount as any).role,
      } : null,
    }, 'Detail siswa berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// PUT /api/v1/siswa/[id] (Admin only or self for limited fields)
export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json();
    const data = UpdateMemberSchema.parse(body);

    await connectDB();

    // Check permissions
    if (ctx.user?.role === 'siswa' && ctx.user.member_id !== id) {
      return apiError('Anda tidak diizinkan mengubah data siswa ini', 'FORBIDDEN', 403);
    }

    // Siswa cannot change their own NIS or kelas
    if (ctx.user?.role === 'siswa') {
      delete data.nis;
      delete data.kelas;
      delete data.poin_keaktifan;
    }

    const updated = await Member.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    if (!updated) {
      return apiError('Data siswa tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: (updated as any)._id.toString(),
      nis: (updated as any).nis,
      nama_lengkap: (updated as any).nama_lengkap,
      kelas: (updated as any).kelas,
      jenis_kelamin: (updated as any).jenis_kelamin,
      poin_keaktifan: (updated as any).poin_keaktifan,
    }, 'Data siswa berhasil diperbarui');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// DELETE /api/v1/siswa/[id] (Admin only)
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const member = await Member.findByIdAndDelete(id);
    if (!member) {
      return apiError('Data siswa tidak ditemukan', 'NOT_FOUND', 404);
    }

    // Clean up corresponding user and nilai
    await User.findOneAndDelete({ member_id: id });
    await Nilai.deleteMany({ member_id: id });

    return apiSuccess({ id }, 'Data siswa berhasil dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
