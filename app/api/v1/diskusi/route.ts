import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { CreateDiskusiSchema } from '@/lib/api/validation';
import { connectDB } from '@/lib/db';
import { MateriComment, Materi, Member } from '@/models';
import { pusherServer } from '@/lib/pusher';

// GET /api/v1/diskusi?materi_id=...
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const searchParams = req.nextUrl.searchParams;
    const materiId = searchParams.get('materi_id');

    if (!materiId) {
      return apiError('Parameter materi_id wajib diisi', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const query: any = { materi_id: materiId };

    // If student, filter comments so they see admin comments and classmates' comments
    if (ctx.user?.role === 'siswa' && ctx.user.kelas && ctx.user.kelas !== '-') {
      query.$or = [
        { role_pengirim: 'admin' },
        { role_pengirim: 'guru' },
        { kelas_siswa: ctx.user.kelas },
      ];
    }

    const comments = await MateriComment.find(query).sort({ dibuat_pada: 1 }).lean();

    const formatted = comments.map((c: any) => ({
      id: c._id.toString(),
      materi_id: c.materi_id.toString(),
      nama_pengirim: c.nama_pengirim,
      role_pengirim: c.role_pengirim,
      kelas_siswa: c.kelas_siswa || null,
      komentar: c.komentar,
      dibuat_pada: c.dibuat_pada,
    }));

    return apiSuccess(formatted, 'Diskusi berhasil diambil');
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);

// POST /api/v1/diskusi
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const body = await req.json();
    const data = CreateDiskusiSchema.parse(body);

    await connectDB();

    const materi = await Materi.findById(data.materi_id);
    if (!materi) {
      return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);
    }

    const role = ctx.user!.role;
    const email = ctx.user!.email;
    let senderName = ctx.user!.nama || (role === 'admin' ? 'Admin' : 'Siswa');
    let studentClass = ctx.user!.kelas || '';

    if (role === 'siswa' && ctx.user!.member_id) {
      const student = await Member.findById(ctx.user!.member_id).lean();
      if (student) {
        senderName = (student as any).nama_lengkap || senderName;
        studentClass = (student as any).kelas || studentClass;
      }
    }

    const comment = await MateriComment.create({
      materi_id: data.materi_id,
      user_email: email,
      nama_pengirim: senderName,
      role_pengirim: role,
      kelas_siswa: studentClass,
      komentar: data.komentar.trim(),
      dibuat_pada: new Date(),
    });

    const commentPayload = {
      id: comment._id.toString(),
      materi_id: comment.materi_id.toString(),
      nama_pengirim: comment.nama_pengirim,
      role_pengirim: comment.role_pengirim,
      kelas_siswa: comment.kelas_siswa,
      komentar: comment.komentar,
      dibuat_pada: comment.dibuat_pada,
    };

    // Pusher realtime broadcast
    try {
      await pusherServer.trigger(`materi-${data.materi_id}`, 'new-comment', commentPayload);
    } catch {
      // Pusher broadcast non-fatal
    }

    return apiSuccess(commentPayload, 'Komentar berhasil dikirim', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
