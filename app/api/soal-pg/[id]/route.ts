import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SoalPG, PengerjaanKuis } from '@/models';
import { auth } from '@/lib/auth';

export async function PUT(
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

    // Syarat: Jangan ada yang jawab
    const sudahAdaJawaban = await PengerjaanKuis.exists({ kuis_id: id });
    if (sudahAdaJawaban) {
      return NextResponse.json({ 
        error: 'Kuis tidak dapat diedit karena sudah ada siswa yang mengerjakan.' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { judul, deskripsi, kelas, daftar_soal, waktu_mulai, waktu_selesai, durasi } = body;

    const updatedKuis = await SoalPG.findByIdAndUpdate(id, {
      judul,
      deskripsi,
      kelas,
      daftar_soal,
      waktu_mulai: new Date(waktu_mulai),
      waktu_selesai: new Date(waktu_selesai),
      durasi: durasi || 60
    }, { new: true });

    if (!updatedKuis) {
      return NextResponse.json({ error: 'Kuis tidak ditemukan' }, { status: 404 });
    }

    const { LogKuis } = await import('@/models');
    await LogKuis.create({
      admin_email: session.user.email ?? '',
      kuis_judul: judul,
      aksi: 'UPDATE',
      keterangan: 'Data kuis atau daftar soal diperbarui'
    });

    return NextResponse.json(updatedKuis);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    await connectDB();

    const kuis = await SoalPG.findById(id).lean();
    if (!kuis) {
      return NextResponse.json({ error: 'Kuis tidak ditemukan' }, { status: 404 });
    }

    if (force) {
      // Hapus semua data pengerjaan terkait kuis ini
      await PengerjaanKuis.deleteMany({ kuis_id: id });
    } else {
      const sudahAdaJawaban = await PengerjaanKuis.exists({ kuis_id: id });
      if (sudahAdaJawaban) {
        return NextResponse.json({ 
          error: 'Kuis tidak dapat dihapus karena sudah ada data pengerjaan.' 
        }, { status: 403 });
      }
    }

    await SoalPG.findByIdAndDelete(id);

    const { LogKuis } = await import('@/models');
    await LogKuis.create({
      admin_email: session.user.email ?? '',
      kuis_judul: (kuis as any).judul,
      aksi: 'DELETE',
      keterangan: force ? 'Kuis dihapus paksa beserta seluruh nilai siswa' : 'Kuis dihapus normal'
    });

    return NextResponse.json({ message: 'Kuis berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
