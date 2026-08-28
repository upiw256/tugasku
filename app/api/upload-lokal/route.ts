import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pastikan folder public/uploads ada
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/upload-lokal/route.ts'}): ${(err as any)?.message || String(err)}`, tipe: 'error' }).catch(() => {});

      // Folder mungkin sudah ada
    }

    // Nama file unik (tanpa uuid)
    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/upload-lokal/route.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
