import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Tugas, Nilai } from "@/models";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const kelas = searchParams.get('kelas');
    const member_id = searchParams.get('member_id');

    let stats = { baru: 0, selesai: 0 };

    if (role === 'admin') {
      // Logic Admin: Hitung Total Global
      const totalTugas = await Tugas.countDocuments();
      const totalNilai = await Nilai.countDocuments();
      stats = { baru: totalTugas, selesai: totalNilai };
    } else {
      // Logic Siswa
      if (!kelas || !member_id) {
        return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
      }

      // 1. Ambil ID tugas yang SUDAH dikerjakan siswa
      const mySubmissions = await Nilai.find({ member_id }).select('tugas_id');
      const submittedTaskIds = mySubmissions.map(s => s.tugas_id.toString());

      // 2. Ambil semua Tugas untuk kelas ini
      const tasks = await Tugas.find({
        $or: [
          { kelas: kelas },
          { kelas: { $in: [kelas] } }
        ]
      }).select('_id');

      // 3. Hitung Statistik
      let tugasBaru = 0;
      
      tasks.forEach(task => {
        // Jika ID tugas TIDAK ADA di daftar pengumpulan, berarti tugas baru
        if (!submittedTaskIds.includes(task._id.toString())) {
          tugasBaru++;
        }
      });

      stats = {
        baru: tugasBaru,
        selesai: submittedTaskIds.length
      };
    }

    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    console.error("API Stats Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}