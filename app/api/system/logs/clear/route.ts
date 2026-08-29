import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { LogAktivitasSiswa } from '@/models';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    // Hapus semua data log dari database
    await LogAktivitasSiswa.deleteMany({});
    
    // Trigger pusher ke channel admin-logs dengan event 'clear-logs'
    await pusherServer.trigger('admin-logs', 'clear-logs', { success: true });
    
    return NextResponse.json({ success: true, message: 'Semua log berhasil dihapus' });
  } catch (error: any) {
    console.error('Gagal menghapus log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
