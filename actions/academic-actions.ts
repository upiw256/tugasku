'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Nilai, Tugas } from '@/models'; // Pastikan path import model Anda benar
import { revalidatePath } from 'next/cache';

// --- ACTION 1: BUAT TUGAS BARU ---
export async function createTugasAction(formData: FormData) {
  try {
    const session = await auth();
    // Validasi: Hanya Admin yang boleh
    if (!session || session.user.role !== 'admin') {
        return { success: false, message: 'Unauthorized: Akses ditolak.' };
    }

    const judul = formData.get('judul');
    const deskripsi = formData.get('deskripsi');
    const deadline = formData.get('deadline');
    const kelas = formData.get('kelas');

    if (!judul || !deadline || !kelas) {
      return { success: false, message: 'Data tugas tidak lengkap (Judul, Deadline, Kelas wajib).' };
    }

    await connectDB();

    await Tugas.create({
      judul,
      deskripsi,
      deadline: new Date(deadline as string),
      kelas
    });

    revalidatePath('/admin/tugas'); // Refresh halaman admin
    revalidatePath('/siswa/tugas'); // Refresh halaman siswa juga
    return { success: true, message: 'Tugas berhasil dibuat!' };

  } catch (error) {
    console.error("Error createTugas:", error);
    return { success: false, message: 'Gagal membuat tugas.' };
  }
}

// --- ACTION 2: HAPUS TUGAS ---
export async function deleteTugasAction(tugasId: string) {
    try {
      const session = await auth();
      if (!session || session.user.role !== 'admin') {
        return { success: false, message: 'Unauthorized' };
      }
  
      await connectDB();
      
      // Hapus Tugas
      await Tugas.findByIdAndDelete(tugasId);
      
      // PENTING: Hapus juga nilai siswa yang terkait tugas ini agar DB bersih
      await Nilai.deleteMany({ tugas_id: tugasId });
  
      revalidatePath('/admin/tugas');
      return { success: true, message: 'Tugas berhasil dihapus.' };
    } catch (error) {
      console.error("Error deleteTugas:", error);
      return { success: false, message: 'Gagal menghapus tugas.' };
    }
  }

// --- ACTION 3: INPUT / UPDATE NILAI ---
export async function inputNilaiAction(studentId: string, tugasId: string, nilaiAngka: number) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
        return { success: false, message: 'Unauthorized' };
    }

    await connectDB();

    // Menggunakan teknik "UPSERT" (Update if exists, Insert if new)
    // Kuncinya adalah kombinasi member_id DAN tugas_id harus unik
    await Nilai.findOneAndUpdate(
      { member_id: studentId, tugas_id: tugasId }, 
      { 
        nilai: nilaiAngka,
        tanggal_dinilai: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath('/admin/nilai');
    return { success: true, message: 'Nilai berhasil disimpan!' };

  } catch (error) {
    console.error("Error inputNilai:", error);
    return { success: false, message: 'Gagal menyimpan nilai.' };
  }
}