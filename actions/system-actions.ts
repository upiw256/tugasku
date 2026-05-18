'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { 
  Absensi, 
  Member, 
  Nilai, 
  Tugas, 
  User, 
  Guru, 
  Materi, 
  SoalPG, 
  PengerjaanKuis, 
  Kelompok, 
  Pengumuman, 
  LogKuis, 
  LogTugas 
} from '@/models';
import { revalidatePath } from 'next/cache';
import { decryptData } from '@/lib/crypto';
import crypto from 'crypto';

// --- HELPER: Membuat Hash dari Object Data ---
function createDataHash(data: any) {
  // Kita urutkan data rekursif untuk hash yang konsisten meskipun urutan di DB berbeda
  const stringified = JSON.stringify(data, (key, value) => {
    if (Array.isArray(value)) {
        return value.sort((a, b) => {
            const idA = a._id?.toString() || JSON.stringify(a);
            const idB = b._id?.toString() || JSON.stringify(b);
            return idA > idB ? 1 : -1;
        });
    }
    return value;
  });
  
  return crypto.createHash('md5').update(stringified).digest('hex');
}

export async function resetDatabaseAction() {
    try {
      const session = await auth();
      if (!session || session.user.role !== 'admin') {
        return { success: false, message: 'Akses ditolak!' };
      }
  
      await connectDB();
  
      // Hapus SEMUA data transaksional & master kecuali User Admin
      await Promise.all([
        Absensi.deleteMany({}),
        Nilai.deleteMany({}),
        Tugas.deleteMany({}),
        Member.deleteMany({}),
        Guru.deleteMany({}),
        Materi.deleteMany({}),
        SoalPG.deleteMany({}),
        PengerjaanKuis.deleteMany({}),
        Kelompok.deleteMany({}),
        Pengumuman.deleteMany({}),
        LogKuis.deleteMany({}),
        LogTugas.deleteMany({}),
        User.deleteMany({ role: { $ne: 'admin' } })
      ]);
  
      revalidatePath('/');
      return { success: true, message: 'Database telah dibersihkan sepenuhnya!' };
  
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Gagal melakukan reset.' };
    }
}

export async function restoreDatabaseAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return { success: false, message: 'Akses ditolak!' };
    }

    const file = formData.get('backupFile') as File;
    if (!file) return { success: false, message: 'File backup tidak ditemukan.' };

    // 1. BACA & DEKRIPSI FILE
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let backupData: any;
    try {
      const decryptedString = decryptData(buffer);
      backupData = JSON.parse(decryptedString);
    } catch (err) {
      return { success: false, message: 'Gagal membuka file. File rusak atau kunci enkripsi salah.' };
    }

    // Validasi struktur minimal
    if (!backupData.members || !backupData.users) {
        return { success: false, message: 'Format data backup tidak valid atau terlalu tua.' };
    }

    await connectDB();

    // ================= VALIDASI PERUBAHAN (Hash) =================
    // Ambil data state sekarang
    const currentState = {
        members: await Member.find({}).lean(),
        gurus: await Guru.find({}).lean(),
        tugas: await Tugas.find({}).lean(),
        nilai: await Nilai.find({}).lean(),
        absensi: await Absensi.find({}).lean(),
        materi: await Materi.find({}).lean(),
        soal_pg: await SoalPG.find({}).lean(),
        pengerjaan_kuis: await PengerjaanKuis.find({}).lean(),
        kelompok: await Kelompok.find({}).lean(),
        pengumuman: await Pengumuman.find({}).lean(),
        users: await User.find({ role: { $ne: 'admin' } }).lean(),
    };

    // Siapkan data backup (tanpa admin)
    const backupSiswaUsers = backupData.users.filter((u: any) => u.role !== 'admin');
    const backupState = {
        members: backupData.members || [],
        gurus: backupData.gurus || [],
        tugas: backupData.tugas || [],
        nilai: backupData.nilai || [],
        absensi: backupData.absensi || [],
        materi: backupData.materi || [],
        soal_pg: backupData.soal_pg || [],
        pengerjaan_kuis: backupData.pengerjaan_kuis || [],
        kelompok: backupData.kelompok || [],
        pengumuman: backupData.pengumuman || [],
        users: backupSiswaUsers
    };

    if (createDataHash(currentState) === createDataHash(backupState)) {
        return { success: false, message: '⚠️ Data backup SAMA PERSIS dengan database saat ini.' };
    }

    // --- EKSEKUSI RESTORE ---
    // 1. Bersihkan koleksi target
    await Promise.all([
        Absensi.deleteMany({}),
        Nilai.deleteMany({}),
        Tugas.deleteMany({}),
        Member.deleteMany({}),
        Guru.deleteMany({}),
        Materi.deleteMany({}),
        SoalPG.deleteMany({}),
        PengerjaanKuis.deleteMany({}),
        Kelompok.deleteMany({}),
        Pengumuman.deleteMany({}),
        LogKuis.deleteMany({}),
        LogTugas.deleteMany({}),
        User.deleteMany({ role: { $ne: 'admin' } })
    ]);

    // 2. Masukkan data dari backup
    const insertJobs = [];
    if (backupState.members.length) insertJobs.push(Member.insertMany(backupState.members));
    if (backupState.gurus.length) insertJobs.push(Guru.insertMany(backupState.gurus));
    if (backupState.tugas.length) insertJobs.push(Tugas.insertMany(backupState.tugas));
    if (backupState.nilai.length) insertJobs.push(Nilai.insertMany(backupState.nilai));
    if (backupState.absensi.length) insertJobs.push(Absensi.insertMany(backupState.absensi));
    if (backupState.materi.length) insertJobs.push(Materi.insertMany(backupState.materi));
    if (backupState.soal_pg.length) insertJobs.push(SoalPG.insertMany(backupState.soal_pg));
    if (backupState.pengerjaan_kuis.length) insertJobs.push(PengerjaanKuis.insertMany(backupState.pengerjaan_kuis));
    if (backupState.kelompok.length) insertJobs.push(Kelompok.insertMany(backupState.kelompok));
    if (backupState.pengumuman.length) insertJobs.push(Pengumuman.insertMany(backupState.pengumuman));
    if (backupState.users.length) insertJobs.push(User.insertMany(backupState.users));
    
    // Log juga di-restore jika ada
    if (backupData.log_kuis?.length) insertJobs.push(LogKuis.insertMany(backupData.log_kuis));
    if (backupData.log_tugas?.length) insertJobs.push(LogTugas.insertMany(backupData.log_tugas));

    await Promise.all(insertJobs);

    revalidatePath('/');
    return { success: true, message: 'Seluruh data aplikasi berhasil dipulihkan!' };

  } catch (error) {
    console.error("Restore Error:", error);
    return { success: false, message: 'Terjadi kesalahan sistem saat restore data.' };
  }
}