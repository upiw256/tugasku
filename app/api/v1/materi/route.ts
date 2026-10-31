import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiPaginated, apiSuccess } from '@/lib/api/response';
import { CreateMateriSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Materi } from '@/models';
import { pusherServer } from '@/lib/pusher';
import { sendNewItemPush } from '@/lib/push-notifications';

// GET /api/v1/materi
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const kelasParam = searchParams.get('kelas');
    const search = searchParams.get('search');

    const query: any = {};

    const targetKelas = ctx.user?.role === 'siswa' ? ctx.user.kelas : kelasParam;
    if (targetKelas && targetKelas !== '-') {
      query.$or = [
        { kelas: targetKelas },
        { kelas: { $in: [targetKelas] } },
      ];
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [{ judul: searchRegex }, { deskripsi: searchRegex }] },
        ];
        delete query.$or;
      } else {
        query.$or = [{ judul: searchRegex }, { deskripsi: searchRegex }];
      }
    }

    const total = await Materi.countDocuments(query);
    const materials = await Materi.find(query)
      .sort({ tanggal_upload: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = materials.map((m: any) => ({
      id: m._id.toString(),
      judul: m.judul,
      deskripsi: m.deskripsi || '',
      file_url: m.file_url,
      kelas: Array.isArray(m.kelas) ? m.kelas : [m.kelas],
      diunggah_oleh: m.diunggah_oleh,
      tanggal_upload: m.tanggal_upload,
      total_downloads: (m.downloads || []).length,
    }));

    return apiPaginated(formatted, page, limit, total, 'Daftar materi berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// POST /api/v1/materi (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const body = await req.json();
    const data = CreateMateriSchema.parse(body);

    await connectDB();

    const listKelas = Array.isArray(data.kelas)
      ? data.kelas
      : typeof data.kelas === 'string' && data.kelas.includes(',')
      ? data.kelas.split(',').map((k: string) => k.trim())
      : [String(data.kelas).trim()];

    const newMateri = await Materi.create({
      judul: data.judul.trim(),
      deskripsi: data.deskripsi || '',
      file_url: data.file_url.trim(),
      kelas: listKelas,
      diunggah_oleh: ctx.user?.email || 'admin@sekolah.com',
      tanggal_upload: new Date(),
      downloads: [],
    });

    await sendNewItemPush({
      id: newMateri._id.toString(),
      type: 'materi',
      title: newMateri.judul,
      classes: listKelas,
    });

    try {
      await pusherServer.trigger('admin-updates', 'new-materi', {
        id: newMateri._id,
        judul: newMateri.judul,
        pengunggah: newMateri.diunggah_oleh,
        waktu: newMateri.tanggal_upload,
      });
    } catch {
      // Pusher failure non-fatal
    }

    return apiSuccess({
      id: newMateri._id.toString(),
      judul: newMateri.judul,
      deskripsi: newMateri.deskripsi,
      file_url: newMateri.file_url,
      kelas: newMateri.kelas,
      diunggah_oleh: newMateri.diunggah_oleh,
      tanggal_upload: newMateri.tanggal_upload,
    }, 'Materi belajar berhasil diunggah', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
