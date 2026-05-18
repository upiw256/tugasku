import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { 
  Absensi, 
  Member, 
  Nilai, 
  Tugas, 
  User, 
  Guru, 
  Materi, 
  SoalPG, 
  PengerjaanKuis, 
  Kelompok, 
  Pengumuman, 
  LogKuis, 
  LogTugas 
} from '@/models';
import { NextResponse } from 'next/server';
import { encryptData } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const backupData = {
    timestamp: new Date().toISOString(),
    version: "2.1", // Tambahkan versi untuk penanganan restore ke depan
    members: await Member.find({}).lean(),
    gurus: await Guru.find({}).lean(),
    tugas: await Tugas.find({}).lean(),
    nilai: await Nilai.find({}).lean(),
    absensi: await Absensi.find({}).lean(),
    materi: await Materi.find({}).lean(),
    soal_pg: await SoalPG.find({}).lean(),
    pengerjaan_kuis: await PengerjaanKuis.find({}).lean(),
    kelompok: await Kelompok.find({}).lean(),
    pengumuman: await Pengumuman.find({}).lean(),
    log_kuis: await LogKuis.find({}).lean(),
    log_tugas: await LogTugas.find({}).lean(),
    users: await User.find({}).lean(),
  };

  // 1. Ubah JSON Object jadi String
  const jsonString = JSON.stringify(backupData);

  // 2. ENKRIPSI String tersebut
  const encryptedBuffer = encryptData(jsonString);

  // 3. Return sebagai file download dengan ekstensi .school
  // Kita kirim sebagai 'application/octet-stream' (binary file)
  return new NextResponse(encryptedBuffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="backup_full_${Date.now()}.school"`,
    },
  });
}