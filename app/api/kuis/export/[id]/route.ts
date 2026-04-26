import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SoalPG, PengerjaanKuis, Member } from '@/models';
import { auth } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
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

    const pengerjaans = await PengerjaanKuis.find({ kuis_id: id })
      .populate('member_id', 'nama_lengkap kelas')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hasil Kuis');

    // Header Excel
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'nama', width: 30 },
      { header: 'Kelas', key: 'kelas', width: 15 },
      { header: 'Jawaban Benar', key: 'benar', width: 15 },
      { header: 'Jawaban Salah', key: 'salah', width: 15 },
      { header: 'Skor Total', key: 'skor', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    pengerjaans.forEach((p: any, index: number) => {
      let benar = 0;
      let salah = 0;
      const totalSoal = kuis.daftar_soal.length;

      kuis.daftar_soal.forEach((soal: any) => {
        const jawabanSiswa = p.jawaban?.[soal.id] || p.jawaban?.[soal._id?.toString()];
        if (jawabanSiswa === soal.jawaban_benar) {
          benar++;
        } else {
          salah++;
        }
      });

      worksheet.addRow({
        no: index + 1,
        nama: p.member_id?.nama_lengkap || 'Tidak Diketahui',
        kelas: p.member_id?.kelas || '-',
        benar: benar,
        salah: salah,
        skor: p.nilai || Math.round((benar / totalSoal) * 100),
        status: p.status
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=hasil-kuis-${kuis.judul.replace(/\s+/g, '-')}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
