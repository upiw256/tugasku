import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { SoalPG, PengerjaanKuis } from '@/models';

// GET /api/v1/kuis/[id]
export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const kuis = await SoalPG.findById(id).lean();
    if (!kuis) {
      return apiError('Kuis tidak ditemukan', 'NOT_FOUND', 404);
    }

    const now = new Date();
    const startTime = new Date((kuis as any).waktu_mulai);
    const endTime = new Date((kuis as any).waktu_selesai);
    let isAvailable = false;

    if ((kuis as any).status_manual === 'OPEN') isAvailable = true;
    else if ((kuis as any).status_manual === 'CLOSED') isAvailable = false;
    else isAvailable = now >= startTime && now <= endTime;

    const isStudent = ctx.user?.role === 'siswa';

    // Sanitize questions: strip 'jawaban_benar' for students!
    const sanitizedSoal = ((kuis as any).daftar_soal || []).map((soal: any) => {
      const item: any = {
        id: soal.id || soal._id?.toString(),
        pertanyaan: soal.pertanyaan,
        opsi: soal.opsi,
        gambar_url: soal.gambar_url || null,
      };

      if (!isStudent) {
        item.jawaban_benar = soal.jawaban_benar;
      }

      return item;
    });

    const result: any = {
      id: (kuis as any)._id.toString(),
      judul: (kuis as any).judul,
      deskripsi: (kuis as any).deskripsi || '',
      kelas: Array.isArray((kuis as any).kelas) ? (kuis as any).kelas : [(kuis as any).kelas],
      total_soal: sanitizedSoal.length,
      durasi: (kuis as any).durasi || 60,
      waktu_mulai: (kuis as any).waktu_mulai,
      waktu_selesai: (kuis as any).waktu_selesai,
      status_manual: (kuis as any).status_manual || 'AUTO',
      is_available: isAvailable,
      daftar_soal: sanitizedSoal,
    };

    // If student, attach their progress/status
    if (isStudent && ctx.user?.member_id) {
      const pengerjaan = await PengerjaanKuis.findOne({
        kuis_id: id,
        member_id: ctx.user.member_id,
      }).lean();

      result.my_progress = pengerjaan ? {
        status: (pengerjaan as any).status,
        jawaban: (pengerjaan as any).jawaban || {},
        nilai: (pengerjaan as any).status === 'SUBMITTED' ? (pengerjaan as any).nilai : null,
        benar: (pengerjaan as any).status === 'SUBMITTED' ? (pengerjaan as any).benar : null,
        salah: (pengerjaan as any).status === 'SUBMITTED' ? (pengerjaan as any).salah : null,
        mulai_mengerjakan: (pengerjaan as any).mulai_mengerjakan,
        selesai_mengerjakan: (pengerjaan as any).selesai_mengerjakan || null,
      } : null;
    }

    // If admin, attach summary statistics
    if (!isStudent) {
      const submissions = await PengerjaanKuis.find({ kuis_id: id }).lean();
      const submitted = submissions.filter((s: any) => s.status === 'SUBMITTED');
      const totalScore = submitted.reduce((acc: number, cur: any) => acc + (cur.nilai || 0), 0);
      const avgScore = submitted.length > 0 ? Math.round(totalScore / submitted.length) : 0;

      result.stats = {
        total_pengerjaan: submissions.length,
        total_selesai: submitted.length,
        rata_rata_nilai: avgScore,
      };
    }

    return apiSuccess(result, 'Detail kuis berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// PUT /api/v1/kuis/[id] (Admin only)
export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json();

    await connectDB();
    const updateData: any = { ...body };

    if (body.waktu_mulai) updateData.waktu_mulai = new Date(body.waktu_mulai);
    if (body.waktu_selesai) updateData.waktu_selesai = new Date(body.waktu_selesai);
    if (body.kelas) {
      updateData.kelas = Array.isArray(body.kelas) ? body.kelas : [body.kelas];
    }

    const updated = await SoalPG.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    if (!updated) {
      return apiError('Kuis tidak ditemukan', 'NOT_FOUND', 404);
    }

    return apiSuccess({
      id: (updated as any)._id.toString(),
      judul: (updated as any).judul,
      deskripsi: (updated as any).deskripsi,
      kelas: (updated as any).kelas,
      durasi: (updated as any).durasi,
      status_manual: (updated as any).status_manual,
    }, 'Kuis berhasil diperbarui');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);

// DELETE /api/v1/kuis/[id] (Admin only)
export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const deleted = await SoalPG.findByIdAndDelete(id);
    if (!deleted) {
      return apiError('Kuis tidak ditemukan', 'NOT_FOUND', 404);
    }

    // Clean up student answers for this quiz
    await PengerjaanKuis.deleteMany({ kuis_id: id });

    return apiSuccess({ id }, 'Kuis dan data pengerjaan berhasil dihapus');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
