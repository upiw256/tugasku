import { connectDB } from '@/lib/db';
import { Member, Nilai, Tugas } from '@/models';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kelas = searchParams.get('kelas');

  if (!kelas) {
    return NextResponse.json({ error: 'Parameter kelas wajib diisi' }, { status: 400 });
  }

  await connectDB();

  // 1. Ambil Siswa di Kelas Tersebut
  const students = await Member.find({ kelas }).sort({ nama_lengkap: 1 }).lean();

  // 2. Ambil Daftar Tugas Khusus Kelas Tersebut
  // Logic: Tugas yang kelasnya string persis "X 1" ATAU array mengandung "X 1"
  const tasks = await Tugas.find({
    $or: [
      { kelas: kelas },
      { kelas: { $in: [kelas] } }
    ]
  }).sort({ createdAt: 1 }).lean(); // Urutkan berdasarkan tanggal buat

  // 3. Ambil Semua Nilai dari siswa-siswa tersebut
  const studentIds = students.map((s: any) => s._id);
  const grades = await Nilai.find({ member_id: { $in: studentIds } }).lean();

  // 4. Setup Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Nilai ${kelas}`);

  // --- HEADER DINAMIS ---
  const columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'NIS', key: 'nis', width: 15 },
    { header: 'Nama Lengkap', key: 'nama', width: 30 },
  ];

  // Tambahkan kolom untuk setiap Tugas
  tasks.forEach((task: any, index: number) => {
    columns.push({ header: task.judul, key: `tugas_${task._id}`, width: 15 });
  });

  // Tambahkan kolom Rata-rata
  columns.push({ header: 'Rata-rata', key: 'rata', width: 15 });

  sheet.columns = columns;

  // Styling Header
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  // 5. Loop Data Siswa & Isi Baris
  students.forEach((student: any, index: number) => {
    const rowData: any = {
      no: index + 1,
      nis: student.nis,
      nama: student.nama_lengkap,
    };

    let totalNilai = 0;
    let jumlahTugasDinilai = 0;

    // Loop setiap tugas untuk mengisi nilai siswa ini
    tasks.forEach((task: any) => {
      // Cari nilai siswa ini untuk tugas ini
      const gradeRecord = grades.find((g: any) => 
        g.member_id.toString() === student._id.toString() && 
        g.tugas_id.toString() === task._id.toString()
      );

      const nilai = gradeRecord ? gradeRecord.nilai : 0;
      rowData[`tugas_${task._id}`] = gradeRecord ? nilai : '-'; // Isi '-' jika belum dinilai

      if (gradeRecord) {
        totalNilai += nilai;
        jumlahTugasDinilai++;
      }
    });

    // Hitung Rata-rata (Berdasarkan tugas yang sudah dinilai saja, atau bagi total tugas? 
    // Di sini kita bagi dengan TOTAL tugas yang ada agar fair)
    const rataRata = tasks.length > 0 ? (totalNilai / tasks.length).toFixed(1) : 0;
    
    rowData['rata'] = rataRata;

    const row = sheet.addRow(rowData);

    // Styling: Warna Merah jika rata-rata < 60
    if (Number(rataRata) < 60) {
      row.getCell('rata').font = { color: { argb: 'FFFF0000' }, bold: true };
    }
  });

  // 6. Generate Buffer & Download
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Rekap_Nilai_${kelas}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}