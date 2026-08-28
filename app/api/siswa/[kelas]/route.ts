import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function GET(request: Request, { params }: { params: Promise<{ kelas: string }> }) {
  try {
    await connectDB();
    const p = await params;
    const kelas = decodeURIComponent(p.kelas);
    
    // Fetch members of the class, sort them alphabetically
    const siswa = await Member.find({ kelas }).sort({ nama_lengkap: 1 }).select('_id nis nama_lengkap kelas');
    
    return NextResponse.json({ success: true, count: siswa.length, data: siswa });
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/siswa/[kelas]/route.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
