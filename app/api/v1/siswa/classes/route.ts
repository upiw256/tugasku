import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiSuccess } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';

// GET /api/v1/siswa/classes
export const GET = createApiHandler(
  async (_req: NextRequest) => {
    await connectDB();
    const rawClasses = await Member.distinct('kelas');
    const classes = rawClasses.filter(Boolean).sort();

    return apiSuccess({ classes }, 'Daftar kelas berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
