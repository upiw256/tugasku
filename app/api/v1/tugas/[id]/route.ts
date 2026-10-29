import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { UpdateTugasSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Tugas, Nilai, Member } from '@/models';

// GET /api/v1/tugas/[id]
export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const task = await Tugas.findById(id).lean();
    if (!task) {
      return apiError('Tugas tidak ditemukan', 'NOT_FOUND', 404);
    }

    const taskData: any = {
      id: (task as any)._id.toString(),
      judul: (task as any).judul,
      deskripsi: (task as any).deskripsi || '',
      deadline: (task as any).deadline,
      kelas: Array.isArray((task as any).kelas) ? (task as any).kelas : [(task as any).kelas],
      is_active: (task as any).is_active !== false,
      tipe_pengumpulan: (task as any).tipe_pengumpulan || 'online',
      tipe_tugas: (task as any).tipe_tugas || 'individu',
      dibuat_pada: (task as any).dibuat_pada,
    };

    // If student, attach their own submission
    if (ctx.user?.role === 'siswa' && ctx.user.member_id) {
      const mySubmission = await Nilai.findOne({
        tugas_id: id,
        member_id: ctx.user.member_id,
      }).lean();

      taskData.my_submission = mySubmission ? {
        id: (mySubmission as any)._id.toString(),
        nilai: (mySubmission as any).nilai,
        file_url: (mySubmission as any).file_url || null,
        catatan_siswa: (mySubmission as any).catatan_siswa || null,
        tanggal_mengumpulkan: (mySubmission as any).tanggal_mengumpulkan,
        tanggal_dinilai: (mySubmission as any).tanggal_dinilai || null,
        status: (mySubmission as any).file_url || (mySubmission as any).nilai > 0 ? 'SUBMITTED' : 'NOT_SUBMITTED',
      } : null;
    }

    // If admin, attach summary statistics
    if (ctx.user?.role === 'admin') {
      const targetClasses = taskData.kelas;
      const totalStudents = await Member.countDocuments({ kelas: { $in: targetClasses } });
      const submissions = await Nilai.find({ tugas_id: id }).lean();
      const submittedCount = submissions.filter((s: any) => s.file_url || s.nilai > 0).length;
      const gradedCount = submissions.filter((s: any) => s.tanggal_dinilai || s.nilai > 0).length;

      taskData.stats = {
        total_target_siswa: totalStudents,
        total_mengumpulkan: submittedCount,
        total_dinilai: gradedCount,
        belum_mengumpulkan: Math.max(0, totalStudents - submittedCount),
      };
    }

    return apiSuccess(taskData, 'Detail tugas berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// PUT /api/v1/tugas/[id] (Admin only)
export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json();
    const data = UpdateTugasSchema.parse(body);

    await connectDB();

    const updateFields: any = { ...data };
    if (data.kelas) {
      updateFields.kelas = Array.isArray(data.kelas)
        ? data.kelas
        : typeof data.kelas === 'string' && data.kelas.includes(',')
        ? data.kelas.split(',').map((k: string) => k.trim())
        : [String(data.kelas).trim()];
    }

    if (data.deadline) {
      updateFields.deadline = new Date(data.deadline);
    }

    const updated = await Tugas.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).lean();
    if (!updated) {
      return apiError('Tugas tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: (updated as any)._id.toString(),
      judul: (updated as any).judul,
      deskripsi: (updated as any).deskripsi,
      deadline: (updated as any).deadline,
      kelas: (updated as any).kelas,
      is_active: (updated as any).is_active,
      tipe_pengumpulan: (updated as any).tipe_pengumpulan,
      tipe_tugas: (updated as any).tipe_tugas,
    }, 'Tugas berhasil diperbarui');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);

// DELETE /api/v1/tugas/[id] (Admin only)
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const task = await Tugas.findByIdAndDelete(id);
    if (!task) {
      return apiError('Tugas tidak ditemukan', 'NOT_FOUND', 404);
    }

    // Clean up all related Nilai submissions
    await Nilai.deleteMany({ tugas_id: id });

    return apiSuccess({ id }, 'Tugas dan riwayat pengumpulan berhasil dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
