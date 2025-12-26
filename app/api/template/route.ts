import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Format Import Siswa');

  // Bikin Header Kolom
  sheet.columns = [
    { header: 'NIS (Wajib)', key: 'nis', width: 15 },
    { header: 'Nama Lengkap (Wajib)', key: 'nama', width: 30 },
    { header: 'Kelas', key: 'kelas', width: 10 },
    { header: 'Email (Opsional)', key: 'email', width: 25 },
    { header: 'Password (Opsional)', key: 'pass', width: 15 },
  ];

  // Kasih contoh data dummy biar admin paham
  sheet.addRow({ 
    nis: '1001', 
    nama: 'Contoh Siswa', 
    kelas: 'X 12', 
    email: 'siswa@sekolah.com', 
    pass: 'rahasia123' 
  });

  // Tulis jadi file buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Kirim ke browser sebagai file download
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="format_import_siswa.xlsx"'
    }
  });
}