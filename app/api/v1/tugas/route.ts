import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiPaginated, apiSuccess } from '@/lib/api/response';
import { CreateTugasSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { Tugas, Kelompok, Nilai } from '@/models';
import { sendNewItemPush } from '@/lib/push-notifications';

// GET /api/v1/tugas
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const kelasParam = searchParams.get('kelas');
    const isActiveParam = searchParams.get('is_active');
    const tipePengumpulan = searchParams.get('tipe_pengumpulan');
    const tipeTugas = searchParams.get('tipe_tugas');
    const search = searchParams.get('search');

    const query: any = {};

    // Filter by class
    const targetKelas = ctx.user?.role === 'siswa' ? ctx.user.kelas : kelasParam;
    if (targetKelas && targetKelas !== '-') {
      query.$or = [
        { kelas: targetKelas },
        { kelas: { $in: [targetKelas] } },
      ];
    }

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      query.is_active = isActiveParam === 'true' || isActiveParam === '1';
    }

    if (tipePengumpulan) {
      query.tipe_pengumpulan = tipePengumpulan;
    }

    if (tipeTugas) {
      query.tipe_tugas = tipeTugas;
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

    const total = await Tugas.countDocuments(query);
    const tasks = await Tugas.find(query)
      .sort({ dibuat_pada: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = tasks.map((t: any) => ({
      id: t._id.toString(),
      judul: t.judul,
      deskripsi: t.deskripsi || '',
      deadline: t.deadline,
      kelas: Array.isArray(t.kelas) ? t.kelas : [t.kelas],
      is_active: t.is_active !== false,
      tipe_pengumpulan: t.tipe_pengumpulan || 'online',
      tipe_tugas: t.tipe_tugas || 'individu',
      dibuat_pada: t.dibuat_pada,
    }));

    return apiPaginated(formatted, page, limit, total, 'Daftar tugas berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// POST /api/v1/tugas (Admin only)
export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const data = CreateTugasSchema.parse(body);

    await connectDB();

    const listKelas = Array.isArray(data.kelas)
      ? data.kelas
      : typeof data.kelas === 'string' && data.kelas.includes(',')
      ? data.kelas.split(',').map((k: string) => k.trim())
      : [String(data.kelas).trim()];

    const newTask = await Tugas.create({
      judul: data.judul.trim(),
      deskripsi: data.deskripsi || '',
      deadline: new Date(data.deadline),
      kelas: listKelas,
      is_active: data.is_active !== undefined ? data.is_active : true,
      tipe_pengumpulan: data.tipe_pengumpulan || 'online',
      tipe_tugas: data.tipe_tugas || 'individu',
      dibuat_pada: new Date(),
    });

    await sendNewItemPush({
      id: newTask._id.toString(),
      type: 'tugas',
      title: newTask.judul,
      classes: listKelas,
    });

    // If group task, auto-populate Nilai placeholders for members of existing groups
    if (data.tipe_tugas === 'kelompok') {
      const groups = await Kelompok.find({ kelas: { $in: listKelas } });
      if (groups.length > 0) {
        const nilaiInserts: any[] = [];
        for (const g of groups) {
          if (Array.isArray(g.anggota)) {
            for (const memberId of g.anggota) {
              nilaiInserts.push({
                member_id: memberId,
                tugas_id: newTask._id,
                nilai: 0,
              });
            }
          }
        }
        if (nilaiInserts.length > 0) {
          await Nilai.insertMany(nilaiInserts, { ordered: false }).catch(() => {});
        }
      }
    }

    return apiSuccess({
      id: newTask._id.toString(),
      judul: newTask.judul,
      deskripsi: newTask.deskripsi,
      deadline: newTask.deadline,
      kelas: newTask.kelas,
      is_active: newTask.is_active,
      tipe_pengumpulan: newTask.tipe_pengumpulan,
      tipe_tugas: newTask.tipe_tugas,
      dibuat_pada: newTask.dibuat_pada,
    }, 'Tugas berhasil dibuat', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin'],
  }
);
