import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiError } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Materi, Member } from '@/models';
import { pusherServer } from '@/lib/pusher';

const normalizeClass = (value: unknown) =>
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const POST = createApiHandler(
  async (request: NextRequest, ctx: ApiContext) => {
    const form = await request.formData();
    const socketId = String(form.get('socket_id') ?? '');
    const channelName = String(form.get('channel_name') ?? '');
    const match = channelName.match(/^presence-materi-([a-f\d]{24})$/i);

    if (!/^\d+\.\d+$/.test(socketId) || !match) {
      return apiError('Parameter otorisasi Pusher tidak valid', 'VALIDATION_ERROR', 400);
    }

    if (
      !process.env.PUSHER_APP_ID ||
      !process.env.PUSHER_SECRET ||
      !(process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY)
    ) {
      return apiError('Konfigurasi Pusher backend belum lengkap', 'PUSHER_NOT_CONFIGURED', 503);
    }

    await connectDB();
    const materiId = match[1];
    if (!mongoose.isValidObjectId(materiId)) {
      return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);
    }

    const materi = await Materi.findById(materiId).lean();
    if (!materi) {
      return apiError('Materi tidak ditemukan', 'NOT_FOUND', 404);
    }

    const user = ctx.user!;
    let displayName = user.nama || (user.role === 'admin' ? 'Admin' : 'Siswa');
    let studentClass = user.kelas || '';

    if (user.role === 'siswa') {
      if (user.member_id) {
        const member = await Member.findById(user.member_id).lean();
        if (member) {
          displayName = member.nama_lengkap || displayName;
          studentClass = member.kelas || studentClass;
        }
      }

      const materialClasses = Array.isArray(materi.kelas) ? materi.kelas : [materi.kelas];
      const allowed = materialClasses.some(
        (kelas: unknown) => normalizeClass(kelas) === normalizeClass(studentClass)
      );
      if (!studentClass || !allowed) {
        return apiError('Anda tidak memiliki akses ke ruang diskusi materi ini', 'FORBIDDEN', 403);
      }
    }

    const authorization = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: String(user.sub),
      user_info: {
        nama: displayName,
        nama_lengkap: displayName,
        role: user.role,
        kelas: studentClass,
      },
    });

    return NextResponse.json(authorization);
  },
  {
    requireApiKey: true,
    authRequired: true,
    roles: ['admin', 'siswa'],
    rateLimit: 120,
  }
);