import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import md5 from "md5";

export async function POST(req: Request) {
  try {
    // 1. Baca data yang dikirim dari HP
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan Password wajib diisi" },
        { status: 400 }
      );
    }

    // 2. Koneksi DB
    await connectDB();

    // 3. Cari User (Samakan logic dengan auth.ts)
    const user = await User.findOne({ user: username });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 401 }
      );
    }

    // 4. Cek Password MD5
    const inputHash = md5(password);
    if (user.password !== inputHash) {
      return NextResponse.json(
        { success: false, message: "Password salah" },
        { status: 401 }
      );
    }

    // 5. Login Sukses! Kirim data user balik ke HP
    return NextResponse.json({
      success: true,
      message: "Login Berhasil",
      data: {
        id: user._id,
        nama: user.nama_lengkap,
        role: user.role,
        kelas: user.kelas || "-",
        user: user.user
      }
    });

  } catch (error) {
    console.error("Mobile Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}