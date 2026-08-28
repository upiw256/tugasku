import { connectDB } from "@/lib/db";
import { Member, User } from "@/models";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


// Kita buat interface sederhana agar TypeScript tidak protes soal tipe data 'm' dan 'u'
interface MemberData {
  _id: any; // Menggunakan any agar aman untuk ObjectId Mongoose
  nama_lengkap: string;
}

interface UserData {
  user: string;
  member_id: any;
  nama?: string;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    // Gunakan optional chaining (?.) untuk menghindari error jika session null
    if (session?.user?.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get("kelas");

    if (!kelas) {
      return new NextResponse("Pilih kelas terlebih dahulu!", { status: 400 });
    }

    await connectDB();

    // 1. AMBIL DATA MEMBER
    const members = await Member.find({ kelas: kelas })
      .select('_id nama_lengkap jenis_kelamin')
      .lean();

    if (!members || members.length === 0) {
      return new NextResponse(`Data siswa kosong di kelas ${kelas}`, { status: 404 });
    }

    // 2. BUAT MAP & KUMPULKAN ID
    const memberMap = new Map<string, { nama: string, jk: string }>();
    
    // PERBAIKAN DI SINI:
    // Tambahkan ': any[]' agar TypeScript tahu ini array yang menampung apa saja (ObjectId)
    const memberIds: any[] = []; 

    // Kita definisikan 'm' sebagai MemberData atau any agar tidak implicit any
    members.forEach((m: any) => {
      // Pastikan _id ada sebelum diproses
      if (m._id) {
        const idStr = m._id.toString();
        memberMap.set(idStr, { nama: m.nama_lengkap, jk: m.jenis_kelamin || '' });
        memberIds.push(m._id);
      }
    });

    // 3. AMBIL DATA USER
    const users = await User.find({ 
      member_id: { $in: memberIds }, 
      role: "siswa" 
    })
    .select("user member_id") 
    .lean();

    if (!users || users.length === 0) {
      return new NextResponse("Akun user belum dibuat untuk kelas ini.", { status: 404 });
    }

    // 4. GABUNGKAN DATA
    const finalData = users.map((u: any) => {
      const memberIdStr = u.member_id?.toString();
      const memberInfo = memberMap.get(memberIdStr) || { nama: "Nama Tidak Ditemukan", jk: "" };

      return {
        nama: memberInfo.nama,
        username: u.user,
        kelas: kelas,
        jenis_kelamin: memberInfo.jk
      };
    });

    // Sortir A-Z
    finalData.sort((a, b) => a.nama.localeCompare(b.nama));

    // 5. BUAT EXCEL
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Akun Siswa");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Lengkap", key: "nama", width: 35 },
      { header: "Jenis Kelamin (L/P)", key: "jk", width: 18 },
      { header: "Username", key: "username", width: 15 },
      { header: "Kelas", key: "kelas", width: 10 },
      { header: "Password Default", key: "password", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    finalData.forEach((data, index) => {
      worksheet.addRow({
        no: index + 1,
        nama: data.nama,
        jk: data.jenis_kelamin,
        username: data.username,
        kelas: data.kelas,
        password: "123456"
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Akun_Siswa_${kelas}.xlsx"`,
      },
    });

  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/siswa/export/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    console.error("Export Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}