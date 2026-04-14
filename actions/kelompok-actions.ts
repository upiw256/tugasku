'use server'

import { connectDB } from '@/lib/db';
import { Kelompok } from '@/models';
import { revalidatePath } from 'next/cache';

export async function createKelompokAction(formData: FormData) {
  try {
    await connectDB();
    
    const kelas = formData.get('kelas') as string;
    const kelompokDataStr = formData.get('kelompok_data') as string;

    if (!kelas || !kelompokDataStr) {
      return { success: false, message: 'Semua field wajib diisi' };
    }

    const kelompokData = JSON.parse(kelompokDataStr); // Ekspektasi: [{ nama: "Kelompok 1", anggota: ["id1", "id2"] }]

    if (kelompokData.length === 0) {
      return { success: false, message: 'Kamu harus membuat minimal satu kelompok' };
    }

    // Hindari duplikasi jika admin sengaja buat lagi? Atau kita Replace/Delete yang lama?
    // Untuk saat ini kita hapus Kelompok yang lama untuk kelas tersebut biar tidak berlipat ganda
    await Kelompok.deleteMany({ kelas });

    // Buat Kelompok baru
    const kelompokPromises = kelompokData.map(async (k: any) => {
      // Simpan record Kelompok
      return Kelompok.create({
        nama_kelompok: k.nama,
        kelas,
        ketua: k.ketua,
        anggota: k.anggota
      });
    });

    await Promise.all(kelompokPromises);

    revalidatePath('/admin/tugas-kelompok');
    return { success: true, message: 'Kelompok berhasil di-generate dan disimpan!' };
  } catch (error: any) {
    console.error('Create Kelompok Error:', error);
    return { success: false, message: error.message || 'Gagal menyimpan kelompok' };
  }
}
