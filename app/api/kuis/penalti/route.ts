import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PengerjaanKuis } from '@/models';
import { auth } from '@/lib/auth';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'siswa') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kuis_id, member_id, penalti_detik = 20 } = await req.json();

    await connectDB();

    // Cari pengerjaan
    const pengerjaan = await PengerjaanKuis.findOne({ kuis_id, member_id });
    if (!pengerjaan) {
      return NextResponse.json({ error: 'Data pengerjaan tidak ditemukan' }, { status: 404 });
    }

    // Geser waktu mulai ke belakang (seolah-olah sudah mulai lebih awal)
    // Ini akan mengurangi sisa waktu pengerjaan
    const currentMulai = pengerjaan.mulai_mengerjakan ? new Date(pengerjaan.mulai_mengerjakan) : new Date();
    pengerjaan.mulai_mengerjakan = new Date(currentMulai.getTime() - (penalti_detik * 1000));
    
    await pengerjaan.save();

    return NextResponse.json({ 
      success: true, 
      message: `Penalti ${penalti_detik} detik diterapkan` 
    });
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/kuis/penalti/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
