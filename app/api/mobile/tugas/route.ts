import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Tugas } from "@/models";

export async function GET(req: Request) {
  try {
    await connectDB();

    // 1. Ambil Parameter dari URL Mobile
    const { searchParams } = new URL(req.url);
    const kelasSiswa = searchParams.get('kelas'); // Contoh: "XII-RPL-1"
    const role = searchParams.get('role'); // Contoh: "siswa" atau "admin"

    // Validasi sederhana
    if (!role) {
      return NextResponse.json({ success: false, message: "Role diperlukan" }, { status: 400 });
    }

    let query = {};

    // 2. Logic Filter (MIRIP WEB)
    if (role === 'admin') {
      // Admin melihat semua tugas
      query = {}; 
    } else {
      // Siswa hanya melihat tugas kelasnya
      if (!kelasSiswa) {
        return NextResponse.json({ success: false, message: "Kelas siswa tidak terdeteksi" }, { status: 400 });
      }

      // 👇 INI LOGIC YANG ANDA INGINKAN (Support String & Array) 👇
      query = {
        $or: [
          { kelas: kelasSiswa },          // Jika di DB tertulis string: "XII-RPL-1"
          { kelas: { $in: [kelasSiswa] } } // Jika di DB tertulis array: ["XII-RPL-1", "XII-TKJ-1"]
        ]
      };
    }

    // 3. Eksekusi Query
    const tasks = await Tugas.find(query)
      .sort({ deadline: 1 }) // Urutkan dari deadline terdekat
      .select('judul mapel deadline deskripsi kelas tipe_pengumpulan') // Ambil field yg perlu saja
      .lean();

    return NextResponse.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error("API Tugas Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data tugas" },
      { status: 500 }
    );
  }
}