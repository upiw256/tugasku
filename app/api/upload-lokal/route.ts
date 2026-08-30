import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';

// Route Segment Config untuk App Router - naikkan limit body
export const maxDuration = 60; // timeout 60 detik untuk upload besar
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`📁 Upload dimulai: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pastikan folder public/uploads ada
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    console.log(`📂 Upload directory: ${uploadDir}`);
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err: any) {
      // Folder mungkin sudah ada, tapi log kalau benar-benar error
      if (err.code !== 'EEXIST') {
        console.error('❌ Gagal buat folder uploads:', err.message);
        await logAktivitasSiswa({ aksi: `System Error (upload-lokal): mkdir gagal: ${err.message}`, tipe: 'error' }).catch(() => {});
      }
    }

    // Nama file unik
    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, uniqueName);

    console.log(`💾 Menulis file ke: ${filePath}`);
    await writeFile(filePath, buffer);
    console.log(`✅ File berhasil ditulis: ${filePath}`);

    const fileUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error('❌ Upload error:', error.message, error.stack);
    await logAktivitasSiswa({ aksi: `System Error (upload-lokal): ${error.message}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: `Upload gagal: ${error.message}` }, { status: 500 });
  }
}
