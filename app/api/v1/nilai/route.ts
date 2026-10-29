import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiPaginated, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Nilai, Member } from '@/models';

// GET /api/v1/nilai
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const tugasId = searchParams.get('tugas_id');
    const memberIdParam = searchParams.get('member_id');
    const kelasParam = searchParams.get('kelas');

    const query: any = {};

    // RBAC: Siswa can only see their own submissions
    if (ctx.user?.role === 'siswa') {
      if (!ctx.user.member_id) {
        return apiError('Profil siswa tidak terhubung dengan akun ini', 'FORBIDDEN', 403);
      }
      query.member_id = ctx.user.member_id;
    } else if (memberIdParam) {
      query.member_id = memberIdParam;
    }

    if (tugasId) {
      query.tugas_id = tugasId;
    }

    // Filter by class if provided
    if (kelasParam && ctx.user?.role === 'admin') {
      const classMembers = await Member.find({ kelas: kelasParam }).select('_id').lean();
      const memberIds = classMembers.map((m: any) => m._id);
      if (query.member_id) {
        // Intersect
      } else {
        query.member_id = { $in: memberIds };
      }
    }

    const total = await Nilai.countDocuments(query);
    const submissions = await Nilai.find(query)
      .populate('member_id', 'nis nama_lengkap kelas jenis_kelamin')
      .populate('tugas_id', 'judul deadline tipe_tugas tipe_pengumpulan is_active')
      .sort({ tanggal_mengumpulkan: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = submissions.map((s: any) => ({
      id: s._id.toString(),
      member: s.member_id ? {
        id: s.member_id._id.toString(),
        nis: s.member_id.nis,
        nama_lengkap: s.member_id.nama_lengkap,
        kelas: s.member_id.kelas,
      } : null,
      tugas: s.tugas_id ? {
        id: s.tugas_id._id.toString(),
        judul: s.tugas_id.judul,
        deadline: s.tugas_id.deadline,
        tipe_tugas: s.tugas_id.tipe_tugas,
      } : null,
      nilai: s.nilai,
      file_url: s.file_url || null,
      catatan_siswa: s.catatan_siswa || null,
      tanggal_mengumpulkan: s.tanggal_mengumpulkan,
      tanggal_dinilai: s.tanggal_dinilai || null,
      status: s.tanggal_dinilai ? 'GRADED' : (s.file_url || s.nilai > 0 ? 'SUBMITTED' : 'NOT_SUBMITTED'),
    }));

    return apiPaginated(formatted, page, limit, total, 'Data nilai & pengumpulan berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
