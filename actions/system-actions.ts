'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Absensi, Member, Nilai, Tugas, User, SystemSetting } from '@/models';
import { revalidatePath } from 'next/cache';
import { decryptData } from '@/lib/crypto';
import crypto from 'crypto';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


// --- HELPER: Membuat Hash dari Object Data ---
// Digunakan untuk membandingkan apakah dua kumpulan data identik
function createDataHash(data: any) {
  // 1. Urutkan array agar urutan data tidak mempengaruhi hash
  // Kita urutkan berdasarkan _id
  const sortedData = Array.isArray(data) 
    ? data.sort((a: any, b: any) => (a._id?.toString() > b._id?.toString() ? 1 : -1)) 
    : data;

  // 2. Ubah ke JSON String
  const jsonString = JSON.stringify(sortedData);
  
  // 3. Buat MD5 Hash
  return crypto.createHash('md5').update(jsonString).digest('hex');
}

// ... (resetDatabaseAction TETAP SAMA seperti sebelumnya) ...
export async function resetDatabaseAction() {
    try {
      const session = await auth();
      if (!session || session.user.role !== 'admin') {
        return { success: false, message: 'Akses ditolak!' };
      }
  
      await connectDB();
  
      // Hapus Data Transaksional & Master (Kecuali User Admin)
      await Absensi.deleteMany({});
      await Nilai.deleteMany({});
      await Tugas.deleteMany({});
      await Member.deleteMany({}); // Data detail siswa
      
      // Hapus User Siswa (Role bukan admin)
      await User.deleteMany({ role: { $ne: 'admin' } });
  
      revalidatePath('/');
      return { success: true, message: 'Database berhasil di-reset bersih!' };
  
    } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/system-actions.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});


      console.error(error);
      return { success: false, message: 'Gagal melakukan reset.' };
    }
}


// --- UPDATE: RESTORE DENGAN VALIDASI DUPLIKASI ---
export async function restoreDatabaseAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return { success: false, message: 'Akses ditolak!' };
    }

    const file = formData.get('backupFile') as File;
    if (!file) return { success: false, message: 'File backup tidak ditemukan.' };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let backupData;
    try {
      const decryptedString = decryptData(buffer);
      backupData = JSON.parse(decryptedString);
    } catch (err) {
      await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/system-actions.ts'}): ${(err as any)?.message || String(err)}`, tipe: 'error' }).catch(() => {});
      return { success: false, message: 'Gagal membuka file. File rusak atau kunci enkripsi salah.' };
    }

    if (!backupData.members || !backupData.users) {
        return { success: false, message: 'Format data backup tidak valid.' };
    }

    await connectDB();

    const currentMembers = await Member.find({}).lean();
    const currentTugas = await Tugas.find({}).lean();
    const currentNilai = await Nilai.find({}).lean();
    const currentAbsensi = await Absensi.find({}).lean();
    const currentSiswaUsers = await User.find({ role: { $ne: 'admin' } }).lean();

    const backupSiswaUsers = backupData.users.filter((u: any) => u.role !== 'admin');

    const currentHash = createDataHash({
        m: currentMembers,
        t: currentTugas,
        n: currentNilai,
        a: currentAbsensi,
        u: currentSiswaUsers
    });

    const backupHash = createDataHash({
        m: backupData.members,
        t: backupData.tugas,
        n: backupData.nilai,
        a: backupData.absensi,
        u: backupSiswaUsers
    });

    if (currentHash === backupHash) {
        return { 
            success: false,
            message: '⚠️ Data backup SAMA PERSIS dengan database saat ini. Tidak ada perubahan yang dilakukan.' 
        };
    }

    await Absensi.deleteMany({});
    await Nilai.deleteMany({});
    await Tugas.deleteMany({});
    await Member.deleteMany({});
    await User.deleteMany({ role: { $ne: 'admin' } });

    if (backupData.members.length) await Member.insertMany(backupData.members);
    if (backupData.tugas.length) await Tugas.insertMany(backupData.tugas);
    if (backupData.nilai.length) await Nilai.insertMany(backupData.nilai);
    if (backupData.absensi.length) await Absensi.insertMany(backupData.absensi);
    if (backupSiswaUsers.length) await User.insertMany(backupSiswaUsers);

    revalidatePath('/');
    return { success: true, message: 'Data berhasil dipulihkan dari file backup!' };

  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/system-actions.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});
    return { success: false, message: 'Terjadi kesalahan sistem saat restore.' };
  }
}

// --- AI MODEL SETTINGS ---
export async function getAIModelSettings() {
  try {
    await connectDB();
    const textModelSetting = await SystemSetting.findOne({ key: 'ai_text_model' }).lean() as any;
    const visionModelSetting = await SystemSetting.findOne({ key: 'ai_vision_model' }).lean() as any;
    
    return {
      success: true,
      data: {
        ai_text_model: textModelSetting?.value || 'groq/compound',
        ai_vision_model: visionModelSetting?.value || 'llama-3.2-11b-vision-preview'
      }
    };
  } catch (error) {
    console.error("Error getting AI model settings:", error);
    return { success: false, data: { ai_text_model: 'groq/compound', ai_vision_model: 'llama-3.2-11b-vision-preview' } };
  }
}

export async function updateAIModelSettings(textModel: string, visionModel: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return { success: false, message: 'Akses ditolak!' };
    }

    await connectDB();
    
    await SystemSetting.findOneAndUpdate(
      { key: 'ai_text_model' },
      { value: textModel || 'groq/compound', updated_at: new Date() },
      { upsert: true, new: true }
    );

    await SystemSetting.findOneAndUpdate(
      { key: 'ai_vision_model' },
      { value: visionModel || 'llama-3.2-11b-vision-preview', updated_at: new Date() },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/settings'); // Or wherever settings is
    return { success: true, message: 'Pengaturan Model AI berhasil disimpan!' };
  } catch (error) {
    console.error("Error updating AI model settings:", error);
    return { success: false, message: 'Gagal menyimpan pengaturan Model AI.' };
  }
}