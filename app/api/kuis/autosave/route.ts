import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PengerjaanKuis, SoalPG } from '@/models';
import { auth } from '@/lib/auth';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'siswa') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { kuis_id, jawaban } = body;
    const member_id = session.user.id;

    if (!kuis_id || !jawaban) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Cek apakah kuis masih buka
    const kuis = await SoalPG.findById(kuis_id);
    if (!kuis) {
      return NextResponse.json({ error: 'Kuis tidak ditemukan' }, { status: 404 });
    }

    const now = new Date();
    if (now < new Date(kuis.waktu_mulai)) {
      return NextResponse.json({ error: 'Kuis belum dimulai' }, { status: 403 });
    }
    
    if (now > new Date(kuis.waktu_selesai)) {
      return NextResponse.json({ error: 'Kuis sudah ditutup' }, { status: 403 });
    }

    // Cari pengerjaan kuis yang ada
    let pengerjaan = await PengerjaanKuis.findOne({ kuis_id, member_id });

    if (pengerjaan) {
      if (pengerjaan.status === 'SUBMITTED') {
        return NextResponse.json({ error: 'Kuis sudah dikumpulkan' }, { status: 400 });
      }
      
      // Update jawaban (merge)
      pengerjaan.jawaban = { ...pengerjaan.jawaban, ...jawaban };
      await pengerjaan.save();
    } else {
      // Buat baru
      pengerjaan = await PengerjaanKuis.create({
        kuis_id,
        member_id,
        jawaban,
        status: 'DRAFT',
        mulai_mengerjakan: new Date()
      });
    }

    return NextResponse.json(pengerjaan);
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/kuis/autosave/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
    try {
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      await connectDB();
      const { searchParams } = new URL(req.url);
      const kuis_id = searchParams.get('kuis_id');
      const member_id = session.user.id;
  
      if (!kuis_id) {
        return NextResponse.json({ error: 'Missing kuis_id' }, { status: 400 });
      }
  
      const pengerjaan = await PengerjaanKuis.findOne({ kuis_id, member_id });
      return NextResponse.json(pengerjaan || { jawaban: {} });
    } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/kuis/autosave/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
