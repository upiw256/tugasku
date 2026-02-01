import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Nilai, Member } from "@/models"; // Pastikan import model benar
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary (Ambil dari .env)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tugasId = formData.get("tugas_id") as string;
    const memberId = formData.get("member_id") as string;

    if (!file || !tugasId || !memberId) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    await connectDB();

    // 1. Validasi: Apakah siswa sudah pernah mengumpulkan?
    const existingSubmission = await Nilai.findOne({ tugas_id: tugasId, member_id: memberId });
    if (existingSubmission) {
        return NextResponse.json({ success: false, message: "Anda sudah mengumpulkan tugas ini." }, { status: 400 });
    }

    // 2. Upload ke Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload menggunakan Promise wrapper
    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "tugasku_submissions" }, // Folder di Cloudinary
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // 3. Simpan ke MongoDB (Collection 'Nilai')
    const newSubmission = await Nilai.create({
      tugas_id: tugasId,
      member_id: memberId,
      nilai: 0, // Nilai awal 0
      file_url: uploadResult.secure_url, // Link gambar dari Cloudinary
      tanggal_mengumpulkan: new Date(),
      komentar: ""
    });

    return NextResponse.json({
      success: true,
      message: "Tugas berhasil dikirim!",
      data: newSubmission
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal upload server" },
      { status: 500 }
    );
  }
}