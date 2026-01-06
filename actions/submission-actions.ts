'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Nilai, User } from '@/models'; // Pastikan import User
import { revalidatePath } from 'next/cache';

export async function submitTaskAction(formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'siswa') return { success: false, message: 'Unauthorized' };

    const tugasId = formData.get('tugasId');
    const fileUrl = formData.get('fileUrl');
    const catatan = formData.get('catatan');

    if (!tugasId || !fileUrl) {
      return { success: false, message: 'File wajib diupload.' };
    }

    await connectDB();

    // Cari member_id milik user yang login
    const user = await User.findOne({ user: session.user.email });
    if (!user || !user.member_id) return { success: false, message: 'Data siswa tidak ditemukan.' };

    // Simpan ke Collection Nilai (Upsert: Update jika ada, Create jika belum)
    await Nilai.findOneAndUpdate(
      { tugas_id: tugasId, member_id: user.member_id },
      {
        file_url: fileUrl,
        catatan_siswa: catatan,
        tanggal_mengumpulkan: new Date(),
        // Jika sebelumnya sudah ada nilai, jangan di-reset. Jika belum, biarkan 0.
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath('/siswa/tugas'); // Refresh halaman tugas siswa
    return { success: true, message: 'Tugas berhasil dikumpulkan!' };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Gagal mengumpulkan tugas.' };
  }
}