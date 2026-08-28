import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PengerjaanKuis, Member } from '@/models';
import { auth } from '@/lib/auth';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const peserta = await PengerjaanKuis.find({ kuis_id: id })
      .populate('member_id', 'nama_lengkap kelas nis')
      .lean();

    return NextResponse.json(peserta);
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/soal-pg/[id]/peserta/route.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
