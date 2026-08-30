import { NextResponse } from 'next/server';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, currentUrl, tipe } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action' }, { status: 400 });
    }

    // Validate tipe, default to 'error' for backwards compatibility
    const validTipe = ['success', 'warning', 'error'].includes(tipe) ? tipe : 'error';

    const labelMap: Record<string, string> = {
      success: 'CLIENT_LOG',
      warning: 'CLIENT_WARN',
      error: 'CLIENT_ERROR',
    };

    const maxLen = 400;
    const trimMsg = action.length > maxLen ? action.substring(0, maxLen) + '...' : action;

    await logAktivitasSiswa({
      kategori: 'Client',
      aksi: `[${labelMap[validTipe]} on ${currentUrl}] ${trimMsg}`,
      tipe: validTipe
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
