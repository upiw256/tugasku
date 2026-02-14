import { connectDB } from '@/lib/db';
import { Nilai } from '@/models';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Cek Sesi (Hanya Admin yang boleh ubah nilai)
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const { nilai } = await request.json();

    // 2. Update Nilai di Database
    const updatedNilai = await Nilai.findByIdAndUpdate(
      id,
      { nilai: Number(nilai) },
      { new: true } // Mengembalikan data yang sudah diupdate
    );

    if (!updatedNilai) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedNilai });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Gagal update nilai' }, { status: 500 });
  }
}