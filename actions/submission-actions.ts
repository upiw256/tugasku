'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Nilai, User } from '@/models';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function submitTaskAction(formData: FormData) {
  try {
    const session = await auth();
    const tugasId = formData.get('tugasId');
    const file = formData.get('file') as File;
    const catatan = formData.get('catatan');

    if (!file || file.size === 0) return { success: false, message: "File kosong" };

    await connectDB();

    // 1. Upload ke Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadRes: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: "tugas_siswa" }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      }).end(buffer);
    });

    // 2. Simpan ke DB
    const user = await User.findOne({ user: session?.user?.email });
    await Nilai.findOneAndUpdate(
      { tugas_id: tugasId, member_id: user.member_id },
      { 
        file_url: uploadRes.secure_url, // URL dari Cloudinary
        catatan_siswa: catatan,
        tanggal_mengumpulkan: new Date()
      },
      { upsert: true }
    );

    revalidatePath('/admin/tugas');
    return { success: true };
  } catch (e) {
    return { success: false, message: "Gagal mengunggah" };
  }
}