import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Materi, Member, User } from '@/models';
import { pusherServer } from '@/lib/pusher';

const normalizeClass = (value: unknown) =>
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await request.formData();
    const socketId = String(form.get('socket_id') ?? '');
    const channelName = String(form.get('channel_name') ?? '');
    const match = channelName.match(/^presence-materi-([a-f\d]{24})$/i);
    if (!/^\d+\.\d+$/.test(socketId) || !match) {
      return NextResponse.json({ error: 'Parameter Pusher tidak valid' }, { status: 400 });
    }

    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET || !(process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY)) {
      return NextResponse.json({ error: 'Konfigurasi Pusher belum lengkap' }, { status: 503 });
    }

    await connectDB();
    const materiId = match[1];
    if (!mongoose.isValidObjectId(materiId)) {
      return NextResponse.json({ error: 'Materi tidak ditemukan' }, { status: 404 });
    }
    const materi = await Materi.findById(materiId).lean();
    if (!materi) return NextResponse.json({ error: 'Materi tidak ditemukan' }, { status: 404 });

    const dbUser = await User.findOne({ user: session.user.email }).lean();
    const role = String((session.user as { role?: string }).role ?? dbUser?.role ?? 'siswa');
    if (!dbUser || !['admin', 'siswa'].includes(role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    let displayName = session.user.name || (role === 'admin' ? 'Admin' : 'Siswa');
    let kelas = '';
    if (role === 'siswa') {
      const member = dbUser.member_id ? await Member.findById(dbUser.member_id).lean() : null;
      kelas = member?.kelas ?? '';
      displayName = member?.nama_lengkap || displayName;
      const materialClasses = Array.isArray(materi.kelas) ? materi.kelas : [materi.kelas];
      if (!kelas || !materialClasses.some((item: unknown) => normalizeClass(item) === normalizeClass(kelas))) {
        return NextResponse.json({ error: 'Tidak memiliki akses ke materi ini' }, { status: 403 });
      }
    }

    const authorization = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: String(dbUser._id),
      user_info: { nama: displayName, nama_lengkap: displayName, role, kelas },
    });
    return NextResponse.json(authorization);
  } catch (error) {
    console.error('[Pusher presence auth]', error);
    return NextResponse.json({ error: 'Gagal mengotorisasi channel Pusher' }, { status: 500 });
  }
}
