import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Template Tugas');

  // 1. Header (TAMBAHKAN KOLOM TIPE)
  sheet.columns = [
    { header: 'Judul Tugas (Wajib)', key: 'judul', width: 30 },
    { header: 'Deskripsi', key: 'desc', width: 40 },
    { header: 'Deadline (YYYY-MM-DD)', key: 'date', width: 15 },
    { header: 'Kelas (Pisahkan Koma)', key: 'kelas', width: 25 }, 
    // 👇 KOLOM BARU
    { header: 'Metode (online/offline)', key: 'tipe', width: 20 }, 
  ];

  // Styling Header (Bold + Center)
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center' };

  // Contoh Data 1 (Satu Kelas & Online)
  sheet.addRow({ 
    judul: 'Tugas Matematika Bab 1', 
    desc: 'Kerjakan halaman 5-10 di buku paket', 
    date: new Date(new Date().setDate(new Date().getDate() + 7)), 
    kelas: 'X 12',
    tipe: 'online' // ☁️
  });

  // Contoh Data 2 (Banyak Kelas & Offline)
  sheet.addRow({ 
    judul: 'Praktik Senam Lantai', 
    desc: 'Ambil nilai praktik di lapangan', 
    date: new Date(new Date().setDate(new Date().getDate() + 3)), 
    kelas: 'XI 3, XI 4', // 🔥 Multi Kelas
    tipe: 'offline' // 🏫
  });

  // --- OPSIONAL: MEMBUAT DROPDOWN DI EXCEL (DATA VALIDATION) ---
  // Agar admin tidak salah ketik "onlen" atau "ofline"
  // Kita pasang validasi di kolom E (Kolom ke-5), baris 2 sampai 100
  for (let i = 2; i <= 100; i++) {
     sheet.getCell(`E${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"online,offline"'] // Pilihan dropdown
     };
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_import_tugas.xlsx"'
    }
  });
}