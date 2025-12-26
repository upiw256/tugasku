import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Template Tugas');

  // Header
  sheet.columns = [
    { header: 'Judul Tugas (Wajib)', key: 'judul', width: 30 },
    { header: 'Deskripsi', key: 'desc', width: 40 },
    { header: 'Deadline (YYYY-MM-DD)', key: 'date', width: 15 },
    { header: 'Kelas (Pisahkan Koma)', key: 'kelas', width: 20 },
  ];

  // Styling Header
  sheet.getRow(1).font = { bold: true };

  // Contoh Data 1 (Satu Kelas)
  sheet.addRow({ 
    judul: 'Tugas Matematika Bab 1', 
    desc: 'Kerjakan halaman 5-10 di buku paket', 
    date: new Date(new Date().setDate(new Date().getDate() + 7)), // Deadline 7 hari lagi
    kelas: 'X 12'
  });

  // Contoh Data 2 (Banyak Kelas)
  sheet.addRow({ 
    judul: 'Tugas Sejarah Kemerdekaan', 
    desc: 'Buat rangkuman video', 
    date: new Date(new Date().setDate(new Date().getDate() + 3)), 
    kelas: 'XI 3, XI 4' // Fitur multi kelas
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_import_tugas.xlsx"'
    }
  });
}