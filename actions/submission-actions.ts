'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Nilai, User, Tugas } from '@/models';
import { revalidatePath } from 'next/cache';
import { uploadQueue } from '@/lib/queue'; // Import antrian yang sudah dibuat
import path from 'path';

export async function submitTaskAction(formData: FormData) {
  try {
    // 1. Validasi Sesi & Form
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "Sesi habis" };

    const tugasId = formData.get('tugasId');
    const file = formData.get('file') as File;
    const catatan = formData.get('catatan');

    if (!file || file.size === 0) return { success: false, message: "File kosong" };

    await connectDB();

    // 2. Ambil Data Pendukung
    const user = await User.findOne({ user: session.user.email }).populate('member_id');
    const tugas = await Tugas.findById(tugasId);
    
    if (!user || !tugas) return { success: false, message: "Data tidak ditemukan" };

    const siswa = user.member_id;
    
    // 3. Konfigurasi Path & Nama File
    const folderName = tugas.judul.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const isImage = file.type.startsWith('image/');
    const extension = isImage ? 'webp' : 'pdf';
    const fileName = `${siswa.nama_lengkap.replace(/\s+/g, '_')}_${siswa.nis.trim().replace(/\s+/g, '')}.${extension}`;

    const baseUploadPath = path.join(process.cwd(), 'public', 'uploads');
    const uploadDir = path.join(baseUploadPath, folderName);
    const filePath = path.join(uploadDir, fileName);

    // 4. KIRIM TUGAS KE ANTRIAN REDIS (Background Process)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadQueue.add('proses-file', {
      buffer: buffer, // BullMQ akan menyimpan buffer ini di Redis
      filePath: filePath,
      uploadDir: uploadDir,
      isImage: isImage,
      fileName: fileName
    });

    // 5. UPDATE MONGODB LANGSUNG
    const fileUrl = `/uploads/${folderName}/${fileName}`;

    await Nilai.findOneAndUpdate(
      { tugas_id: tugasId, member_id: siswa._id },
      { 
        file_url: fileUrl,
        catatan_siswa: catatan,
        tanggal_mengumpulkan: new Date()
      },
      { upsert: true }
    );

    revalidatePath('/admin/tugas');
    // Pesan sukses dikirim tanpa menunggu Sharp selesai
    return { success: true, message: "Tugas berhasil dikirim dan sedang diproses!" };

  } catch (e) {
    console.error("❌ Gagal memproses antrian upload:", e);
    return { success: false, message: "Gagal mengirim tugas, coba lagi nanti" };
  }
}