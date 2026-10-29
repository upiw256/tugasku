import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiPaginated, apiSuccess } from '@/lib/api/response';
import { CreateKuisSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { SoalPG } from '@/models';

// GET /api/v1/kuis
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

    const total = await SoalPG.countDocuments(query);
    const quizzes = await SoalPG.find(query)
      .sort({ tanggal_dibuat: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const now = new Date();

    const formatted = quizzes.map((k: any) => {
      const startTime = new Date(k.waktu_mulai);
      const endTime = new Date(k.waktu_selesai);
      let isAvailable = false;

      if (k.status_manual === 'OPEN') isAvailable = true;
      else if (k.status_manual === 'CLOSED') isAvailable = false;
      else isAvailable = now >= startTime && now <= endTime;

      return {
        id: k._id.toString(),
        judul: k.judul,
        deskripsi: k.deskripsi || '',
        kelas: Array.isArray(k.kelas) ? k.kelas : [k.kelas],
        total_soal: (k.daftar_soal || []).length,
        durasi: k.durasi || 60,
        waktu_mulai: k.waktu_mulai,
        waktu_selesai: k.waktu_selesai,
        status_manual: k.status_manual || 'AUTO',
        is_available: isAvailable,
        dibuat_oleh: k.dibuat_oleh,
        tanggal_dibuat: k.tanggal_dibuat,
      };
    });

    return apiPaginated(formatted, page, limit, total, 'Daftar kuis berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// POST /api/v1/kuis (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const body = await req.json();
    const data = CreateKuisSchema.parse(body);

    await connectDB();

    const listKelas = Array.isArray(data.kelas)
      ? data.kelas
      : typeof data.kelas === 'string' && data.kelas.includes(',')
      ? data.kelas.split(',').map((k: string) => k.trim())
      : [String(data.kelas).trim()];

    const newKuis = await SoalPG.create({
      judul: data.judul.trim(),
      deskripsi: data.deskripsi || '',
      kelas: listKelas,
      daftar_soal: data.daftar_soal,
      waktu_mulai: new Date(data.waktu_mulai),
      waktu_selesai: new Date(data.waktu_selesai),
      durasi: data.durasi,
      status_manual: data.status_manual || 'AUTO',
      dibuat_oleh: ctx.user?.email || 'admin@sekolah.com',
      tanggal_dibuat: new Date(),
    });

    return apiSuccess({
      id: newKuis._id.toString(),
      judul: newKuis.judul,
      deskripsi: newKuis.deskripsi,
      kelas: newKuis.kelas,
      total_soal: newKuis.daftar_soal.length,
      durasi: newKuis.durasi,
      waktu_mulai: newKuis.waktu_mulai,
      waktu_selesai: newKuis.waktu_selesai,
      status_manual: newKuis.status_manual,
    }, 'Kuis berhasil dibuat', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
