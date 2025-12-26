'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Absensi, Member, User } from '@/models'; // Pastikan import Absensi
import { revalidatePath } from 'next/cache';

export async function doAttendanceAction() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'siswa') {
      return { success: false, message: 'Akses ditolak' };
    }

    await connectDB();

    // 1. Cari Data Member berdasarkan User yang login
    const user = await User.findOne({ user: session.user.email }); // Asumsi email = username login
    if (!user || !user.member_id) {
      return { success: false, message: 'Data siswa tidak ditemukan' };
    }

    // 2. Tentukan "Hari Ini" (Jam 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Cek apakah sudah absen hari ini?
    const existingLog = await Absensi.findOne({
      member_id: user.member_id,
      tanggal: today
    });

    if (existingLog) {
      return { success: false, message: 'Anda sudah mengisi absensi hari ini.' };
    }

    // 4. Simpan Absensi Baru
    await Absensi.create({
      member_id: user.member_id,
      tanggal: today,
      waktu: new Date(),
      status: 'Hadir'
    });

    revalidatePath('/siswa');
    return { success: true, message: 'Berhasil Absen Masuk!' };

  } catch (error) {
    console.error("Absen Error:", error);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
}
export async function upsertAttendanceAction(memberId: string, dateStr: string, status: string) {
  try {
    await connectDB();

    // Ubah string tanggal (YYYY-MM-DD) menjadi Date object (Jam 00:00)
    const dateObj = new Date(dateStr);
    dateObj.setHours(0, 0, 0, 0);

    // Cari kalau sudah ada update, kalau belum buat baru (upsert)
    await Absensi.findOneAndUpdate(
      { member_id: memberId, tanggal: dateObj },
      { 
        status: status,
        waktu: new Date(), // Update waktu pencatatan
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath('/admin/absensi');
    return { success: true, message: 'Status berhasil disimpan' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Gagal update absensi' };
  }
}