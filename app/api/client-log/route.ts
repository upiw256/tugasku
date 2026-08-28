import { NextResponse } from 'next/server';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, currentUrl } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action' }, { status: 400 });
    }

    const maxLen = 400;
    const trimMsg = action.length > maxLen ? action.substring(0, maxLen) + '...' : action;

    await logAktivitasSiswa({
      kategori: 'Client',
      aksi: `[CLIENT_ERROR on ${currentUrl}] ${trimMsg}`,
      tipe: 'error'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
