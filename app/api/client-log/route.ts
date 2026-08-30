import { NextResponse } from 'next/server';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, currentUrl, tipe, kategori } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action' }, { status: 400 });
    }

    // Validate tipe, default to 'error' for backwards compatibility
    const validTipe = ['success', 'warning', 'error'].includes(tipe) ? tipe : 'error';
    
    // Ensure kategori is valid (default Client)
    const validKategori = ['Siswa', 'Sistem', 'Console', 'Client', 'Database'].includes(kategori) ? kategori : 'Client';

    const maxLen = 400;
    const trimMsg = action.length > maxLen ? action.substring(0, maxLen) + '...' : action;

    // Formatting aksi based on kategori
    let finalAksi = '';
    if (validKategori === 'Client') {
      const labelMap: Record<string, string> = { success: 'CLIENT_LOG', warning: 'CLIENT_WARN', error: 'CLIENT_ERROR' };
      finalAksi = `[${labelMap[validTipe]} on ${currentUrl}] ${trimMsg}`;
    } else {
      finalAksi = trimMsg;
    }

    await logAktivitasSiswa({
      kategori: validKategori as any,
      aksi: finalAksi,
      tipe: validTipe
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
