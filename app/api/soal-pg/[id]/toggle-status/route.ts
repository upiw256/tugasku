import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SoalPG } from '@/models';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['AUTO', 'OPEN', 'CLOSED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await connectDB();
    const updated = await SoalPG.findByIdAndUpdate(id, {
      status_manual: status
    }, { new: true });

    if (updated) {
      const { LogKuis } = await import('@/models');
      await LogKuis.create({
        admin_email: session.user.email ?? '',
        kuis_judul: updated.judul,
        aksi: 'TOGGLE_STATUS',
        keterangan: `Status manual diubah menjadi: ${status}`
      });
    }

    // Paksa update tampilan
    revalidatePath('/admin/kuis');
    revalidatePath('/siswa/kuis');

    return NextResponse.json(updated);
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/soal-pg/[id]/toggle-status/route.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
