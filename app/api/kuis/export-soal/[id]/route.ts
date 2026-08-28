import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SoalPG, PengerjaanKuis } from '@/models';
import { auth } from '@/lib/auth';
import ExcelJS from 'exceljs';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const kuis = await SoalPG.findById(id).lean();
    if (!kuis) {
      return NextResponse.json({ error: 'Kuis tidak ditemukan' }, { status: 404 });
    }

    // Ambil semua data pengerjaan untuk dihitung statistiknya
    const pengerjaans = await PengerjaanKuis.find({ kuis_id: id }).lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Naskah Soal & Analisis');

    // Header Naskah
    worksheet.mergeCells('A1:I1');
    worksheet.getCell('A1').value = `NASKAH SOAL & ANALISIS BUTIR: ${kuis.judul.toUpperCase()}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:I2');
    worksheet.getCell('A2').value = `Kelas: ${Array.isArray(kuis.kelas) ? kuis.kelas.join(', ') : kuis.kelas} | Total Pengerjaan: ${pengerjaans.length} Siswa`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]); // Blank row

    // Table Header
    worksheet.getRow(4).values = ['No', 'Pertanyaan', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Pilihan E', 'Kunci', 'Jumlah Benar'];
    worksheet.columns = [
      { key: 'no', width: 5 },
      { key: 'pertanyaan', width: 45 },
      { key: 'a', width: 12 },
      { key: 'b', width: 12 },
      { key: 'c', width: 12 },
      { key: 'd', width: 12 },
      { key: 'e', width: 12 },
      { key: 'kunci', width: 7 },
      { key: 'total_benar', width: 12 },
    ];

    kuis.daftar_soal.forEach((s: any, index: number) => {
      // Hitung jumlah siswa yang menjawab benar untuk soal ini
      const totalBenar = pengerjaans.filter((p: any) => {
        const jawabanSiswa = p.jawaban?.[s.id] || p.jawaban?.[s._id?.toString()];
        return jawabanSiswa === s.jawaban_benar;
      }).length;

      worksheet.addRow({
        no: index + 1,
        pertanyaan: s.pertanyaan,
        a: s.opsi.A,
        b: s.opsi.B,
        c: s.opsi.C,
        d: s.opsi.D,
        e: s.opsi.E,
        kunci: s.jawaban_benar,
        total_benar: `${totalBenar} Siswa`
      });
    });

    // Formatting
    worksheet.getRow(4).font = { bold: true };
    worksheet.getRow(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Wrap text untuk pertanyaan
    worksheet.getColumn('pertanyaan').alignment = { wrapText: true, vertical: 'top' };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Naskah-Soal-${kuis.judul.replace(/\s+/g, '-')}.xlsx`,
      },
    });
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/kuis/export-soal/[id]/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    console.error('Export Soal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
