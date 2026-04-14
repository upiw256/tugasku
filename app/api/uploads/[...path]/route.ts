import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Tunggu params (aturan baru Next.js)
  const { path: pathArray } = await params;
  
  // Cari jalan menuju gambar di komputermu
  const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathArray);

  try {
    // Kalau gambarnya nggak ada, kasih tahu error
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Gambarnya tidak ditemukan', { status: 404 });
    }

    // Kalau ada, baca gambarnya
    const fileBuffer = fs.readFileSync(filePath);

    // Cek ini tipe filenya apa (JPG, PNG, atau PDF)
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.pdf') contentType = 'application/pdf';

    // Kirim gambarnya ke layar!
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=0, must-revalidate' // Biar selalu update!
      },
    });
  } catch (error) {
    return new NextResponse('Ups, ada yang salah', { status: 500 });
  }
}