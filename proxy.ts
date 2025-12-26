import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req: NextRequest) {
  // Ambil token sesi user
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Jika user belum login dan mencoba akses halaman admin/siswa
  if (!token) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/siswa')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // 2. Proteksi Halaman Admin (Hanya untuk role 'admin')
  if (pathname.startsWith('/admin') && token.role !== 'admin') {
    // Jika siswa nyasar ke admin, balikin ke dashboard siswa
    return NextResponse.redirect(new URL('/siswa', req.url));
  }

  // 3. Proteksi Halaman Siswa (Hanya untuk role 'siswa')
  if (pathname.startsWith('/siswa') && token.role !== 'siswa') {
    // Jika admin iseng ke halaman siswa, balikin ke admin
    return NextResponse.redirect(new URL('/admin/tugas', req.url));
  }

  return NextResponse.next();
}

// Tentukan halaman mana saja yang dijaga satpam
export const config = {
  matcher: ['/admin/:path*', '/siswa/:path*'],
};