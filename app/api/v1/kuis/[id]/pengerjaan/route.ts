import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { SoalPG, PengerjaanKuis, Member } from '@/models';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

// GET /api/v1/kuis/[id]/pengerjaan
export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    await connectDB();

    const memberId = ctx.user?.member_id;
    if (!memberId) {
      return apiError('Profil siswa tidak terhubung', 'FORBIDDEN', 403);
    }

    const pengerjaan = await PengerjaanKuis.findOne({
      kuis_id: id,
      member_id: memberId,
    }).lean();

    if (!pengerjaan) {
      return apiSuccess({
        status: 'NOT_STARTED',
        jawaban: {},
      }, 'Belum mulai mengerjakan');
    }

    return apiSuccess({
      status: (pengerjaan as any).status,
      jawaban: (pengerjaan as any).jawaban || {},
      nilai: (pengerjaan as any).status === 'SUBMITTED' ? (pengerjaan as any).nilai : null,
      benar: (pengerjaan as any).status === 'SUBMITTED' ? (pengerjaan as any).benar : null,
      salah: (pengerjaan as any).status === 'SUBMITTED' ? (pengerjaan as any).salah : null,
      mulai_mengerjakan: (pengerjaan as any).mulai_mengerjakan,
      selesai_mengerjakan: (pengerjaan as any).selesai_mengerjakan || null,
    }, 'Progress pengerjaan kuis berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['siswa'],
  }
);

// POST /api/v1/kuis/[id]/pengerjaan
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const { id } = ctx.params;
    const body = await req.json();
    const { jawaban = {}, submit = false } = body;

    await connectDB();

    const memberId = ctx.user?.member_id;
    if (!memberId) {
      return apiError('Profil siswa tidak terhubung', 'FORBIDDEN', 403);
    }

    const kuis = await SoalPG.findById(id).lean();
    if (!kuis) {
      return apiError('Kuis tidak ditemukan', 'NOT_FOUND', 404);
    }

    // Check if already submitted
    const existing = await PengerjaanKuis.findOne({ kuis_id: id, member_id: memberId });
    if (existing && existing.status === 'SUBMITTED') {
      return apiError('Anda sudah menyelesaikan kuis ini dan tidak dapat mengubah jawaban lagi', 'FORBIDDEN', 403);
    }

    // Check availability
    const now = new Date();
    const startTime = new Date((kuis as any).waktu_mulai);
    const endTime = new Date((kuis as any).waktu_selesai);
    let isAvailable = false;

    if ((kuis as any).status_manual === 'OPEN') isAvailable = true;
    else if ((kuis as any).status_manual === 'CLOSED') isAvailable = false;
    else isAvailable = now >= startTime && now <= endTime;

    if (!isAvailable) {
      return apiError('Maaf, kuis ini telah ditutup atau waktu pengerjaan telah berakhir', 'TASK_CLOSED', 403);
    }

    // If saving draft
    if (!submit) {
      const draft = await PengerjaanKuis.findOneAndUpdate(
        { kuis_id: id, member_id: memberId },
        {
          jawaban,
          status: 'DRAFT',
          mulai_mengerjakan: existing?.mulai_mengerjakan || new Date(),
        },
        { upsert: true, new: true }
      );

      return apiSuccess({
        id: draft._id.toString(),
        status: 'DRAFT',
        jawaban_terekam: Object.keys(jawaban).length,
      }, 'Draft jawaban kuis berhasil disimpan');
    }

    // If final submit: calculate score
    let benar = 0;
    const daftarSoal = (kuis as any).daftar_soal || [];

    daftarSoal.forEach((soal: any) => {
      const qId = soal.id || soal._id?.toString();
      const jawabanSiswa = jawaban[qId];
      if (jawabanSiswa && jawabanSiswa === soal.jawaban_benar) {
        benar++;
      }
    });

    const totalSoal = daftarSoal.length;
    const nilai = totalSoal > 0 ? Math.round((benar / totalSoal) * 100) : 0;
    const salah = totalSoal - benar;

    const submitted = await PengerjaanKuis.findOneAndUpdate(
      { kuis_id: id, member_id: memberId },
      {
        jawaban,
        nilai,
        benar,
        salah,
        status: 'SUBMITTED',
        selesai_mengerjakan: new Date(),
      },
      { upsert: true, new: true }
    );

    // Award +10 activity points for submitting quiz
    await Member.findByIdAndUpdate(memberId, { $inc: { poin_keaktifan: 10 } });

    // Activity log
    const member = await Member.findById(memberId).lean();
    if (member) {
      await logAktivitasSiswa({
        nama_siswa: (member as any).nama_lengkap,
        kelas: (member as any).kelas,
        aksi: `Menyelesaikan kuis: ${(kuis as any).judul} (Nilai: ${nilai})`,
        tipe: 'success',
      }).catch(() => {});
    }

    return apiSuccess({
      id: submitted._id.toString(),
      status: 'SUBMITTED',
      nilai,
      benar,
      salah,
      total_soal: totalSoal,
      selesai_mengerjakan: submitted.selesai_mengerjakan,
    }, 'Kuis berhasil disubmit!');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['siswa'],
  }
);
