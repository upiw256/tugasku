import { connectDB } from '@/lib/db';
import { Nilai, Tugas, Kelompok } from '@/models';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


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
    const body = await request.json();
    const { nilai, memberId, tugasId } = body;

    let targetTugasId = tugasId;
    let targetMemberId = memberId;

    if (id.startsWith('temp-')) {
      // Jika record baru, kita butuh memberId dan tugasId dari body
      if (!memberId || !tugasId) {
        return NextResponse.json({ error: 'Missing data for new record' }, { status: 400 });
      }
    } else {
      // Ambil dokumen asli untuk referensi
      const documentNilaiAsli = await Nilai.findById(id);
      if (!documentNilaiAsli) {
        return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
      }
      targetTugasId = documentNilaiAsli.tugas_id;
      targetMemberId = documentNilaiAsli.member_id;
    }

    // 3. Cek apakah ini tugas kelompok
    const tugas = await Tugas.findById(targetTugasId);
    let targetAnggotaIds: any[] = [targetMemberId];

    if (tugas && tugas.tipe_tugas === 'kelompok') {
      const kelompok = await Kelompok.findOne({ anggota: targetMemberId });
      if (kelompok) {
        targetAnggotaIds = kelompok.anggota; // Target seluruh anggota kelompok
      }
    }

    // 4. Update Nilai ke seluruh target anggota (bisa individu bisa rombongan)
    // Gunakan updateMany dengan upsert: true agar record baru tercipta jika belum ada
    await Nilai.updateMany(
      { tugas_id: targetTugasId, member_id: { $in: targetAnggotaIds } },
      { $set: { nilai: Number(Number(nilai).toFixed(2)) } },
      { upsert: true }
    );

    // Kirim feedback sukses (bisa kembalikan salah satu data saja sebagai representasi frontend)
    const updatedNilai = await Nilai.findOne({ 
      tugas_id: targetTugasId, 
      member_id: targetMemberId 
    });

    return NextResponse.json({ success: true, data: updatedNilai });
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/nilai/[id]/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    console.error("API Error:", error);
    return NextResponse.json({ error: 'Gagal update nilai' }, { status: 500 });
  }
}