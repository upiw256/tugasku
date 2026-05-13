import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { connectDB } from '@/lib/db';
import { Tugas, Member } from '@/models';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const tugas = await Tugas.findById(id);
    if (!tugas) {
      return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
    }

    const classes = Array.isArray(tugas.kelas) ? tugas.kelas : [tugas.kelas];

    // Ambil semua siswa dari kelas-kelas tersebut
    const students = await Member.find({ kelas: { $in: classes } }).sort({ nama_lengkap: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Input Nilai');

    // 1. Header
    sheet.columns = [
      { header: 'NIS', key: 'nis', width: 15 },
      { header: 'Nama Siswa', key: 'nama', width: 35 },
      { header: 'Nilai (0-100)', key: 'nilai', width: 15 },
    ];

    // Styling Header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Tambahkan data siswa
    students.forEach((student) => {
      sheet.addRow({
        nis: student.nis,
        nama: student.nama_lengkap,
        nilai: '', // Kosongkan biar diisi guru
      });
    });

    // Proteksi kolom NIS dan Nama agar tidak diubah (opsional, tapi ribet di ExcelJS kalau tidak di-lock sheetnya)
    // Untuk saat ini kita kasih pesan peringatan saja di header atau instruksi.
    
    // Tambahkan baris instruksi di paling bawah atau atas. Kita biarkan saja.

    const buffer = await workbook.xlsx.writeBuffer();
    const safeTitle = tugas.judul.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="template_nilai_${safeTitle}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
