import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { GradeNilaiSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Nilai, Member, Tugas } from '@/models';

// POST /api/v1/nilai/grade (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const data = GradeNilaiSchema.parse(body);

    await connectDB();

    const [member, task] = await Promise.all([
      Member.findById(data.member_id),
      Tugas.findById(data.tugas_id),
    ]);

    if (!member) {
      return apiError('Data siswa tidak ditemukan', 'NOT_FOUND', 404);
    }
    if (!task) {
      return apiError('Data tugas tidak ditemukan', 'NOT_FOUND', 404);
    }

    const updated = await Nilai.findOneAndUpdate(
      { member_id: data.member_id, tugas_id: data.tugas_id },
      {
        nilai: data.nilai,
        catatan_guru: data.catatan,
        tanggal_dinilai: new Date(),
      },
      { upsert: true, new: true }
    );

    return apiSuccess({
      id: updated._id.toString(),
      member_id: data.member_id,
      tugas_id: data.tugas_id,
      nilai: updated.nilai,
      tanggal_dinilai: updated.tanggal_dinilai,
    }, 'Nilai berhasil disimpan');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
