'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Nilai, User, Tugas, Kelompok } from '@/models';
import { revalidatePath } from 'next/cache';
import { uploadQueue } from '@/lib/queue'; 
import path from 'path';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

// --- FUNGSI 1: Kirim Tugas (Siswa) ---
export async function submitTaskAction(formData: FormData) {
  let logSiswa = { nama: 'Siswa Unknown', kelas: '-' };
  try {
    // 1. Validasi Sesi
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "Sesi habis" };

    const tugasId = formData.get('tugasId');
    const file = formData.get('file') as File;
    const catatan = formData.get('catatan');

    if (!file || file.size === 0) return { success: false, message: "File kosong" };

    await connectDB();

    // 2. Ambil Data Tugas & Validasi Status Aktif
    const tugas = await Tugas.findById(tugasId);
    if (!tugas) return { success: false, message: "Tugas tidak ditemukan" };

    // --- CEK APAKAH TUGAS DITUTUP ---
    if (tugas.is_active === false) {
      return { success: false, message: "🔒 Maaf, pengumpulan untuk tugas ini sudah ditutup." };
    }

    const user = await User.findOne({ user: session.user.email }).populate('member_id');
    if (!user) return { success: false, message: "Data siswa tidak ditemukan" };

    const siswa = user.member_id;
    logSiswa = { nama: siswa.nama_lengkap, kelas: siswa.kelas };

    // --- CEK LOGIKA KELOMPOK (HANYA KETUA) ---
    let targetAnggotaIds: any[] = [siswa._id]; // Default: hanya dirinya sendiri

    if (tugas.tipe_tugas === 'kelompok') {
      const kelompok = await Kelompok.findOne({ anggota: siswa._id });
      if (!kelompok) {
        await logAktivitasSiswa({ nama_siswa: logSiswa.nama, kelas: logSiswa.kelas, aksi: `Mencoba kirim tugas kelompok tapi tidak punya kelompok`, tipe: 'warning' });
        return { success: false, message: "Kamu belum memiliki kelompok untuk kelas ini!" };
      }
      
      // Cek apakah dia ketua
      if (kelompok.ketua?.toString() !== siswa._id.toString()) {
        await logAktivitasSiswa({ nama_siswa: logSiswa.nama, kelas: logSiswa.kelas, aksi: `Mencoba kirim tugas kelompok (Bukan Ketua)`, tipe: 'warning' });
        return { success: false, message: "❌ Hanya ketua kelas/kelompok yang diizinkan untuk mengumpulkan presentasi/file laporan ini!" };
      }

      // Ambil seluruh ID anggota kelompok untuk diforward nilainya
      targetAnggotaIds = kelompok.anggota;
    }
    
    // 3. Konfigurasi Path & Nama File
    const folderName = tugas.judul.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const isImage = file.type.startsWith('image/');
    const extension = isImage ? 'webp' : 'pdf';
    const fileName = `${siswa.nama_lengkap.replace(/\s+/g, '_')}_${siswa.nis.trim().replace(/\s+/g, '')}.${extension}`;

    const baseUploadPath = path.join(process.cwd(), 'public', 'uploads');
    const uploadDir = path.join(baseUploadPath, folderName);
    const filePath = path.join(uploadDir, fileName);

    // 4. Proses File (Sekarang kita ubah jadi sinkron tanpa Antrian agar tidak gagal diam-diam)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Buat foldernya
    const fs = await import('fs/promises');
    await fs.mkdir(uploadDir, { recursive: true });

    // Tulis ke fisik atau convert dengan Sharp (webp)
    if (isImage) {
      const sharp = (await import('sharp')).default;
      await sharp(buffer)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filePath);
    } else {
      await fs.writeFile(filePath, buffer);
    }

    // 5. Update MongoDB (Forward ke Semua Anggota Jika Kelompok)
    const fileUrl = `/api/uploads/${folderName}/${fileName}`;
    await Nilai.updateMany(
      { tugas_id: tugasId, member_id: { $in: targetAnggotaIds } },
      { 
        $set: {
          file_url: fileUrl,
          catatan_siswa: catatan,
          tanggal_mengumpulkan: new Date()
        }
      },
      { upsert: true }
    );

    revalidatePath('/admin/tugas');
    await logAktivitasSiswa({ nama_siswa: logSiswa.nama, kelas: logSiswa.kelas, aksi: `Berhasil mengumpulkan tugas: ${tugas.judul}`, tipe: 'success' });
    return { success: true, message: "Tugas berhasil dikirim dan tersimpan!" };

  } catch (e: any) {
    console.error("❌ Gagal menyimpan file tugas:", e);
    await logAktivitasSiswa({ nama_siswa: logSiswa.nama, kelas: logSiswa.kelas, aksi: `Error sistem saat menyimpan tugas: ${e.message}`, tipe: 'error' });
    return { success: false, message: "Gagal menyimpan tugas secara fisik: " + e.message };
  }
}

// --- FUNGSI 2: Toggle Status Tugas (Admin) ---
export async function toggleTugasStatus(tugasId: string, currentStatus: boolean) {
  try {
    console.log("--- DEBUG START ---");
    console.log("1. Mencoba Hubungkan Database...");
    await connectDB();

    console.log("2. Mencari ID:", tugasId);
    console.log("3. Status Saat Ini:", currentStatus);

    // Kita paksa ubah status ke kebalikannya
    const targetStatus = !currentStatus;

    // Pakai findOneAndUpdate agar kita bisa kontrol lebih detail
    const updated = await Tugas.findOneAndUpdate(
      { _id: tugasId }, 
      { $set: { is_active: targetStatus } },
      { new: true, runValidators: true } // new: true agar mengembalikan data setelah berubah
    );

    if (!updated) {
      console.log("❌ Gagal: Tugas tidak ditemukan di DB!");
      return { success: false };
    }

    console.log("4. Berhasil Update! Status Baru di DB:", updated.is_active);
    console.log("--- DEBUG END ---");

    revalidatePath('/admin/tugas'); 
    return { success: true };

  } catch (error: any) {
    console.error("❌ ERROR SERVER ACTION:", error.message);
    return { success: false, error: error.message };
  }
}