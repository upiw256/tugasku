'use server'

import { connectDB } from '@/lib/db';
import { Nilai } from '@/models';
import { revalidatePath } from 'next/cache';

export async function submitGradeAction(formData: FormData) {
  try {
    await connectDB();

    const memberId = formData.get('member_id') as string;
    const tugasId = formData.get('tugas_id') as string;
    const nilaiAngka = Number(formData.get('nilai'));

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