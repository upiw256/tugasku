import { connectDB } from '@/lib/db';
import { Nilai, Tugas, Kelompok } from '@/models';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Cek Sesi (Hanya Admin yang boleh ubah nilai)
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const { nilai } = await request.json();

    // 2. Ambil dokumen asli sebelum diedit untuk referensi referensi member_id dan tugas_id
    const documentNilaiAsli = await Nilai.findById(id);
    if (!documentNilaiAsli) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    // 3. Cek apakah ini tugas kelompok
    const tugas = await Tugas.findById(documentNilaiAsli.tugas_id);
    let targetAnggotaIds: any[] = [documentNilaiAsli.member_id];

    if (tugas && tugas.tipe_tugas === 'kelompok') {
      const kelompok = await Kelompok.findOne({ anggota: documentNilaiAsli.member_id });
      if (kelompok) {
        targetAnggotaIds = kelompok.anggota; // Target selurus anggota kelompok
      }
    }

    // 4. Update Nilai ke seluruh target anggota (bisa individu bisa rombongan)
    await Nilai.updateMany(
      { tugas_id: documentNilaiAsli.tugas_id, member_id: { $in: targetAnggotaIds } },
      { $set: { nilai: Number(nilai) } }
    );

    // Kirim feedback sukses (bisa kembalikan salah satu data saja sebagai representasi frontend)
    const updatedNilai = await Nilai.findById(id);

    return NextResponse.json({ success: true, data: updatedNilai });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Gagal update nilai' }, { status: 500 });
  }
}