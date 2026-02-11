'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Nilai, User, Tugas } from '@/models';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import fs from 'fs/promises';
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

    // Fix Path untuk Docker Standalone
    const isStandalone = process.env.NODE_ENV === 'production';
    const baseUploadPath = isStandalone 
      ? path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads')
      : path.join(process.cwd(), 'public', 'uploads');

    const uploadDir = path.join(baseUploadPath, folderName);
    const filePath = path.join(uploadDir, fileName);

    // 4. PROSES SIMPAN FILE KE DISK (DULUAN)
    // Pastikan folder tersedia
    await fs.mkdir(uploadDir, { recursive: true });
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isImage) {
      // Jika Sharp gagal (misal file korup), ia akan melempar error ke blok catch
      await sharp(buffer)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filePath);
      console.log(`✅ Gambar berhasil dikompres: ${fileName}`);
    } else {
      await fs.writeFile(filePath, buffer);
      console.log(`✅ PDF berhasil disimpan: ${fileName}`);
    }

    // 5. UPDATE MONGODB (Hanya jalan jika proses file di atas sukses)
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
    return { success: true, message: "Tugas berhasil diunggah!" };

  } catch (e) {
    // Jika error terjadi di Sharp atau fs.writeFile, MongoDB tidak akan terupdate
    console.error("❌ Gagal memproses upload:", e);
    return { success: false, message: "Gagal menyimpan file ke server" };
  }
}