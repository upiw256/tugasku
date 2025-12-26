import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Absensi, Member, Nilai, Tugas, User } from '@/models';
import { NextResponse } from 'next/server';
import { encryptData } from '@/lib/crypto'; // Import helper

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const backupData = {
    timestamp: new Date().toISOString(),
    members: await Member.find({}).lean(),
    tugas: await Tugas.find({}).lean(),
    nilai: await Nilai.find({}).lean(),
    absensi: await Absensi.find({}).lean(),
    users: await User.find({}).lean(),
  };

  // 1. Ubah JSON Object jadi String
  const jsonString = JSON.stringify(backupData);

  // 2. ENKRIPSI String tersebut
  const encryptedBuffer = encryptData(jsonString);

  // 3. Return sebagai file download dengan ekstensi .school
  // Kita kirim sebagai 'application/octet-stream' (binary file)
  return new NextResponse(encryptedBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="backup_data_${Date.now()}.school"`,
    },
  });
}