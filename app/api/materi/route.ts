import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Materi } from '@/models';
import { auth } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const kelas = searchParams.get('kelas');
    
    let query = {};
    if (kelas) {
      query = { kelas: kelas };
    }
    
    const materi = await Materi.find(query).sort({ tanggal_upload: -1 });
    return NextResponse.json(materi);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { judul, deskripsi, file_url, kelas, mapel, guru_id } = body;

    if (!judul || !file_url || !kelas) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newMateri = await Materi.create({
      judul,
      deskripsi,
      file_url,
      kelas,
      mapel,
      guru_id,
      diunggah_oleh: session.user.email, // Menggunakan username/email dari session
      tanggal_upload: new Date()
    });

    // Trigger Pusher
    await pusherServer.trigger('admin-updates', 'new-materi', {
      judul,
      pengunggah: session.user.email,
      waktu: new Date()
    });

    return NextResponse.json(newMateri, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
