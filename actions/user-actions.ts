'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import md5 from 'md5'; // Pastikan sudah install md5
import { revalidatePath } from 'next/cache';

export async function changePasswordAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session) return { success: false, message: 'Unauthorized' };

    await connectDB();

    const oldPass = formData.get('oldPass') as string;
    const newPass = formData.get('newPass') as string;
    const confirmPass = formData.get('confirmPass') as string;

    // 1. Validasi Input Kosong
    if (!oldPass || !newPass || !confirmPass) {
      return { success: false, message: 'Semua kolom wajib diisi.' };
    }

    // 2. Validasi Konfirmasi Password
    if (newPass !== confirmPass) {
      return { success: false, message: 'Password baru dan konfirmasi tidak cocok.' };
    }

    // 3. Cari User di Database
    const currentUser = await User.findOne({ user: session.user.email });
    if (!currentUser) {
      return { success: false, message: 'User tidak ditemukan.' };
    }

    // 4. Cek Password Lama (MD5)
    if (currentUser.password !== md5(oldPass)) {
      return { success: false, message: 'Password lama salah!' };
    }

    // 5. Update Password Baru (MD5)
    currentUser.password = md5(newPass);
    await currentUser.save();

    revalidatePath('/settings');
    return { success: true, message: 'Password berhasil diubah!' };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}