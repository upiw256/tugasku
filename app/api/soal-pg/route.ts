import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SoalPG } from '@/models';
import { auth } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const kelas = searchParams.get('kelas');
    
    let query = {};
    if (kelas) {
      query = { kelas: kelas };
    }
    
    const kuis = await SoalPG.find(query).sort({ tanggal_dibuat: -1 });
    return NextResponse.json(kuis);
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/soal-pg/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

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
    const { judul, deskripsi, kelas, daftar_soal, waktu_mulai, waktu_selesai, durasi } = body;

    if (!judul || !kelas || !daftar_soal || !waktu_mulai || !waktu_selesai) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newKuis = await SoalPG.create({
      judul,
      deskripsi,
      kelas,
      daftar_soal,
      waktu_mulai: new Date(waktu_mulai),
      waktu_selesai: new Date(waktu_selesai),
      durasi: durasi || 60,
      dibuat_oleh: session.user.email ?? '',
      tanggal_dibuat: new Date()
    });

    const { LogKuis } = await import('@/models');
    await LogKuis.create({
      admin_email: session.user.email ?? '',
      kuis_judul: judul,
      aksi: 'CREATE',
      keterangan: `Kuis baru dibuat untuk kelas: ${Array.isArray(kelas) ? kelas.join(', ') : kelas}`
    });

    // Trigger Pusher
    await pusherServer.trigger('admin-updates', 'new-soal-pg', {
      judul,
      pembuat: session.user.email ?? '',
      waktu: new Date()
    });

    return NextResponse.json(newKuis, { status: 201 });
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/soal-pg/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
