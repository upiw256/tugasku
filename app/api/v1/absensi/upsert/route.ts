import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { AbsensiUpsertSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Absensi, Member } from '@/models';

// PUT /api/v1/absensi/upsert (Admin only)
export const PUT = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const data = AbsensiUpsertSchema.parse(body);

    await connectDB();

    const member = await Member.findById(data.member_id);
    if (!member) {
      return apiError('Data siswa tidak ditemukan', 'NOT_FOUND', 404);
    }

    const dateObj = new Date(data.tanggal);
    dateObj.setHours(0, 0, 0, 0);

    const record = await Absensi.findOneAndUpdate(
      { member_id: data.member_id, tanggal: dateObj },
      {
        status: data.status,
        waktu: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return apiSuccess({
      id: record._id.toString(),
      member_id: data.member_id,
      tanggal: record.tanggal,
      status: record.status,
      waktu: record.waktu,
    }, 'Status absensi berhasil disimpan');
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
