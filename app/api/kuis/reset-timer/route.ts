import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PengerjaanKuis } from '@/models';
import { auth } from '@/lib/auth';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pengerjaan_id } = await req.json();

    await connectDB();

    const updated = await PengerjaanKuis.findByIdAndUpdate(pengerjaan_id, {
      mulai_mengerjakan: new Date(),
      status: 'DRAFT' // Pastikan statusnya draft agar bisa dikerjakan lagi kalau tadinya sudah selesai
    }, { new: true });

    if (!updated) {
      return NextResponse.json({ error: 'Data pengerjaan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Waktu pengerjaan berhasil direset' });
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/kuis/reset-timer/route.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
