import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllJadwal, getJadwalKelas, getJadwalHari, getJadwalGuru, getGuruList } from '@/lib/jadwal-api';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const hari = searchParams.get('hari');
    const guru = searchParams.get('guru');
    const type = searchParams.get('type');

    if (type === 'guru_list') {
      const guruMap = await getGuruList();
      return NextResponse.json({ success: true, data: guruMap });
    }

    if (guru) {
      const data = await getJadwalGuru(guru);
      return NextResponse.json({ success: true, data });
    }

    if (kelas) {
      const data = await getJadwalKelas(kelas);
      return NextResponse.json({ success: true, data });
    }

    if (hari) {
      const data = await getJadwalHari(hari);
      return NextResponse.json({ success: true, data });
    }

    const data = await getAllJadwal();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in /api/jadwal proxy:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
