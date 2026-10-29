import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiPaginated, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Absensi, Member } from '@/models';

// GET /api/v1/absensi
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')));
    const tanggalStr = searchParams.get('tanggal');
    const kelas = searchParams.get('kelas');
    const memberId = searchParams.get('member_id');
    const status = searchParams.get('status');

    const query: any = {};

    // RBAC: Siswa can only see their own attendance
    if (ctx.user?.role === 'siswa') {
      if (!ctx.user.member_id) {
        return apiError('Profil siswa tidak terhubung', 'FORBIDDEN', 403);
      }
      query.member_id = ctx.user.member_id;
    } else if (memberId) {
      query.member_id = memberId;
    }

    if (tanggalStr) {
      const dateObj = new Date(tanggalStr);
      dateObj.setHours(0, 0, 0, 0);
      query.tanggal = dateObj;
    }

    if (status) {
      query.status = status;
    }

    // Filter by class for admin
    if (kelas && ctx.user?.role === 'admin') {
      const members = await Member.find({ kelas }).select('_id').lean();
      const memberIds = members.map((m: any) => m._id);
      query.member_id = { $in: memberIds };
    }

    const total = await Absensi.countDocuments(query);
    const records = await Absensi.find(query)
      .populate('member_id', 'nis nama_lengkap kelas')
      .sort({ waktu: -1, tanggal: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = records.map((r: any) => ({
      id: r._id.toString(),
      member: r.member_id ? {
        id: r.member_id._id.toString(),
        nis: r.member_id.nis,
        nama_lengkap: r.member_id.nama_lengkap,
        kelas: r.member_id.kelas,
      } : null,
      tanggal: r.tanggal,
      waktu: r.waktu,
      status: r.status,
    }));

    return apiPaginated(formatted, page, limit, total, 'Data absensi berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
