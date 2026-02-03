'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Nilai, User, Tugas, Member } from '@/models';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

export async function submitTaskAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "Sesi habis" };

    const tugasId = formData.get('tugasId');
    const file = formData.get('file') as File;
    const catatan = formData.get('catatan');

    if (!file || file.size === 0) return { success: false, message: "File kosong" };

    await connectDB();

    // 1. Ambil info Siswa dan Tugas untuk penamaan folder/file
    const user = await User.findOne({ user: session.user.email }).populate('member_id');
    const tugas = await Tugas.findById(tugasId);
    
    if (!user || !tugas) return { success: false, message: "Data tidak ditemukan" };

    const siswa = user.member_id;
    // Bersihkan nama tugas dari karakter ilegal untuk folder
    const folderName = tugas.judul.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const extension = file.type === 'application/pdf' ? 'pdf' : 'jpg';
    const fileName = `${siswa.nama_lengkap.replace(/\s+/g, '_')}_${siswa.nis}.${extension}`;

    // 2. Siapkan Folder Tujuan
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folderName);
    await fs.mkdir(uploadDir, { recursive: true });

    // 3. Simpan File (Otomatis menimpa jika nama file sama)
    const filePath = path.join(uploadDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // URL yang akan disimpan di DB (relatif terhadap folder public)
    const fileUrl = `/uploads/${folderName}/${fileName}`;

    // 4. Simpan/Update ke DB
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
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Gagal mengunggah file ke server" };
  }
}