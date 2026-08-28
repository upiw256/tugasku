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

    await connectDB();
    const { kuis_id, member_id, jawaban } = await req.json();

    if (!kuis_id || !member_id) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // CEK STATUS KUIS
    const { SoalPG } = await import('@/models');
    const kuis = await SoalPG.findById(kuis_id).lean();
    if (kuis?.status_manual === 'CLOSED') {
       return NextResponse.json({ error: 'Closed' }, { status: 403 });
    }

    // Upsert pengerjaan kuis
    const updated = await PengerjaanKuis.findOneAndUpdate(
      { kuis_id, member_id },
      { 
        jawaban, 
        last_updated: new Date(),
        status: 'DRAFT' 
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/kuis/save-progress/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
