import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PengerjaanKuis, SoalPG } from '@/models';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'siswa') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { kuis_id, member_id, jawaban } = await req.json();

    const kuis = await SoalPG.findById(kuis_id).lean();
    if (!kuis) {
      return NextResponse.json({ error: 'Kuis tidak ditemukan' }, { status: 404 });
    }

    // CEK STATUS MANUAL & WAKTU (Keamanan Tambahan)
    const now = new Date();
    const startTime = new Date(kuis.waktu_mulai);
    const endTime = new Date(kuis.waktu_selesai);
    
    let isAvailable = false;
    if (kuis.status_manual === 'OPEN') isAvailable = true;
    else if (kuis.status_manual === 'CLOSED') isAvailable = false;
    else {
      isAvailable = now >= startTime && now <= endTime;
    }

    if (!isAvailable) {
      return NextResponse.json({ 
        error: 'Maaf, kuis ini sudah ditutup oleh admin atau waktu pengerjaan telah habis.' 
      }, { status: 403 });
    }

    // HITUNG NILAI
    let benar = 0;
    const daftarSoal = kuis.daftar_soal;
    
    daftarSoal.forEach((soal: any) => {
      const jawabanSiswa = jawaban[soal.id] || jawaban[soal._id?.toString()];
      if (jawabanSiswa === soal.jawaban_benar) {
        benar++;
      }
    });

    const totalSoal = daftarSoal.length;
    const nilai = Math.round((benar / totalSoal) * 100);

    // Update pengerjaan kuis ke status SUBMITTED
    const updated = await PengerjaanKuis.findOneAndUpdate(
      { kuis_id, member_id },
      { 
        jawaban, 
        nilai,
        benar,
        salah: totalSoal - benar,
        status: 'SUBMITTED',
        selesai_mengerjakan: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, nilai, benar, status: 'SUBMITTED' });
  } catch (error: any) {
    console.error('Submit kuis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
