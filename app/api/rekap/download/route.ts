import { connectDB } from '@/lib/db';
import { Absensi, Member } from '@/models';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kelas = searchParams.get('kelas');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!kelas || !start || !end) {
    return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 });
  }

  await connectDB();

  // 1. Ambil Data Siswa
  const students = await Member.find({ kelas }).sort({ nama_lengkap: 1 }).lean();

  // 2. Ambil Data Absensi
  const startObj = new Date(start);
  const endObj = new Date(end);
  endObj.setHours(23, 59, 59, 999); // Sampai akhir hari

  const logs = await Absensi.find({
    member_id: { $in: students.map((s: any) => s._id) },
    waktu: { $gte: startObj, $lte: endObj }
  }).lean();

  // 3. Setup Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Rekap ${kelas}`);

  // Header
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'NIS', key: 'nis', width: 15 },
    { header: 'Nama Lengkap', key: 'nama', width: 30 },
    { header: 'Hadir', key: 'h', width: 10 },
    { header: 'Sakit', key: 's', width: 10 },
    { header: 'Izin', key: 'i', width: 10 },
    { header: 'Alpha', key: 'a', width: 10 },
    { header: 'Total', key: 'total', width: 10 },
    { header: 'Persentase', key: 'persen', width: 15 },
  ];

  // Styling Header
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  // 4. Loop Data Siswa & Hitung Statistik
  students.forEach((student: any, index: number) => {
    const studentLogs = logs.filter((l: any) => l.member_id.toString() === student._id.toString());
    
    const hadir = studentLogs.filter((l: any) => l.status === 'Hadir').length;
    const sakit = studentLogs.filter((l: any) => l.status === 'Sakit').length;
    const izin = studentLogs.filter((l: any) => l.status === 'Izin').length;
    const alpha = studentLogs.filter((l: any) => l.status === 'Alpha').length;
    
    const total = hadir + sakit + izin + alpha;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

    // Tambah Baris
    const row = sheet.addRow({
      no: index + 1,
      nis: student.nis,
      nama: student.nama_lengkap,
      h: hadir,
      s: sakit,
      i: izin,
      a: alpha,
      total: total,
      persen: `${persentase}%`
    });

    // Warna Warni Persentase (Opsional)
    const cellPersen = row.getCell('persen');
    if (persentase < 50) {
      cellPersen.font = { color: { argb: 'FFFF0000' }, bold: true }; // Merah
    } else if (persentase >= 75) {
      cellPersen.font = { color: { argb: 'FF008000' }, bold: true }; // Hijau
    }
  });

  // 5. Generate Buffer & Download
  const buffer = await workbook.xlsx.writeBuffer();
  
  const fileName = `Rekap_Absensi_${kelas}_${start}_sd_${end}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}