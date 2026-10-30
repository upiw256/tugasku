import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiPaginated, apiSuccess } from '@/lib/api/response';
import { CreatePengumumanSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Pengumuman } from '@/models';
import { pusherServer } from '@/lib/pusher';

// GET /api/v1/pengumuman (API Key only is sufficient)
export const GET = createApiHandler(
  async (req: NextRequest) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const prioritas = searchParams.get('prioritas');

    const query: any = {};
    if (prioritas) {
      query.prioritas = prioritas;
    }

    const total = await Pengumuman.countDocuments(query);
    const announcements = await Pengumuman.find(query)
      .sort({ tanggal: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = announcements.map((a: any) => ({
      id: a._id.toString(),
      judul: a.judul,
      konten: a.konten,
      prioritas: a.prioritas,
      dibuat_oleh: a.dibuat_oleh,
      tanggal: a.tanggal,
    }));

    return apiPaginated(formatted, page, limit, total, 'Daftar pengumuman berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: false,
  }
);

// POST /api/v1/pengumuman (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const body = await req.json();
    const data = CreatePengumumanSchema.parse(body);

    await connectDB();

    const newInfo = await Pengumuman.create({
      judul: data.judul.trim(),
      konten: data.konten.trim(),
      prioritas: data.prioritas || 'Info',
      dibuat_oleh: ctx.user?.email || 'admin@sekolah.com',
      tanggal: new Date(),
    });

    // Realtime trigger
    try {
      await pusherServer.trigger('sekolah-channel', 'info-baru', {
        _id: newInfo._id.toString(),
        id: newInfo._id.toString(),
        judul: newInfo.judul,
        konten: newInfo.konten,
        prioritas: newInfo.prioritas,
        dibuat_oleh: newInfo.dibuat_oleh,
        tanggal: newInfo.tanggal,
      });
    } catch (pusherErr) {
      console.warn('[Pusher Warning] Gagal trigger info-baru API:', pusherErr);
    }

    return apiSuccess({
      id: newInfo._id.toString(),
      judul: newInfo.judul,
      konten: newInfo.konten,
      prioritas: newInfo.prioritas,
      dibuat_oleh: newInfo.dibuat_oleh,
      tanggal: newInfo.tanggal,
    }, 'Pengumuman berhasil diposting', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
