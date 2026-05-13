'use server'

import { connectDB } from '@/lib/db';
import { Nilai, Member } from '@/models';
import { revalidatePath } from 'next/cache';
import ExcelJS from 'exceljs';

export async function submitGradeAction(formData: FormData) {
  try {
    await connectDB();

    const memberId = formData.get('member_id') as string;
    const tugasId = formData.get('tugas_id') as string;
    const nilaiRaw = Number(formData.get('nilai'));
    const nilaiAngka = Number(nilaiRaw.toFixed(2));

    if (!memberId || !tugasId) {
      return { success: false, message: 'Data tidak lengkap' };
    }

    // Cari apakah nilai sudah ada, kalau ada update, kalau belum buat baru (upsert)
    await Nilai.findOneAndUpdate(
      { member_id: memberId, tugas_id: tugasId }, // Kriteria cari
      { nilai: nilaiAngka, tanggal_dinilai: new Date() }, // Data update
      { upsert: true, new: true, setDefaultsOnInsert: true } // Opsi
    );

    // Refresh halaman agar tabel nilai terupdate
    revalidatePath(`/admin/siswa/${memberId}/nilai`);
    
    return { success: true, message: 'Nilai berhasil disimpan!' };
  } catch (error) {
    console.error("Grade error:", error);
    return { success: false, message: 'Gagal menyimpan nilai.' };
  }
}
export async function deleteGradeAction(gradeId: string, memberId: string) {
  try {
    await connectDB();
    
    await Nilai.findByIdAndDelete(gradeId);

    revalidatePath(`/admin/siswa/${memberId}/nilai`);
    return { success: true, message: 'Nilai berhasil dihapus' };
  } catch (error) {
    return { success: false, message: 'Gagal menghapus nilai' };
  }
}

export async function importOfflineGradesAction(tugasId: string, formData: FormData) {
  try {
    await connectDB();
    
    const file = formData.get('file') as File;
    if (!file) return { success: false, message: 'File tidak ditemukan' };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return { success: false, message: 'Sheet excel kosong' };

    let count = 0;
    const promises: Promise<any>[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip Header

      const nis = row.getCell(1).value?.toString() || '';
      const nilaiRaw = row.getCell(3).value;
      const nilaiNum = Number(Number(nilaiRaw).toFixed(2));

      if (nis && !isNaN(nilaiNum)) {
        const processRow = async () => {
          // Cari member_id berdasarkan NIS
          const member = await Member.findOne({ nis });
          if (member) {
            await Nilai.findOneAndUpdate(
              { member_id: member._id, tugas_id: tugasId },
              { nilai: nilaiNum, tanggal_dinilai: new Date() },
              { upsert: true }
            );
            count++;
          }
        };
        promises.push(processRow());
      }
    });

    await Promise.all(promises);

    revalidatePath(`/admin/tugas/${tugasId}/pengumpulan`);
    return { success: true, message: `Sukses! Berhasil mengimpor ${count} nilai.` };
  } catch (error) {
    console.error("Error import nilai:", error);
    return { success: false, message: 'Gagal mengimpor nilai. Cek format file.' };
  }
}