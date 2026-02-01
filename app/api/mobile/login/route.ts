import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Member } from "@/models"; // ✅ Pastikan import Member
import md5 from "md5";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan Password wajib diisi" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Cari User Login
    const user = await User.findOne({ user: username });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 401 }
      );
    }

    // 2. Cek Password
    const inputHash = md5(password);
    if (user.password !== inputHash) {
      return NextResponse.json(
        { success: false, message: "Password salah" },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 👇 LOGIC BARU: AMBIL KELAS DARI TABLE MEMBERS 👇
    // ---------------------------------------------------------
    let kelasSiswa = "-";
    let namaSiswa = user.nama_lengkap;

    // Jika user punya member_id (artinya dia Siswa/Guru yang terdaftar)
    if (user.member_id) {
      const member = await Member.findById(user.member_id);
      
      if (member) {
        // Ambil kelas dari tabel Member
        kelasSiswa = member.kelas || "-";
        
        // Opsional: Gunakan nama dari member jika di user kosong
        if (!namaSiswa) namaSiswa = member.nama_lengkap;
      }
    }

    // 3. Kirim Data Lengkap ke HP
    return NextResponse.json({
      success: true,
      message: "Login Berhasil",
      data: {
        id: user.member_id || user._id, // Prioritaskan member_id untuk relasi tugas
        user_id: user._id,              // ID login asli (opsional)
        nama: namaSiswa,
        role: user.role,
        kelas: kelasSiswa,              // ✅ INI SUDAH BENAR (Dari Member)
        username: user.user
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