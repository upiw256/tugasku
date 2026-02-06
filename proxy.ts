import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ⚠️ PERUBAHAN PENTING:
// Nama fungsi harus 'proxy' (bukan middleware) karena versi Next.js Anda memintanya.
export async function proxy(req: NextRequest) {
  
  // 1. Ambil Token (Fix Token Null/Looping)
  // Kita wajib sebutkan 'cookieName' agar dia membaca cookie 'next-auth.session-token'
  // yang sudah kita set "secure: false" di lib/auth.ts
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'next-auth.session-token' 
  });
  
  const { pathname } = req.nextUrl;
  console.log(`[Proxy] Akses ke: ${pathname} | User: ${token?.email || 'Guest'}`);

  // 2. Proteksi Halaman Login (Redirect jika user SUDAH login)
  if (token && pathname === '/login') {
    if (token.role === 'admin') return NextResponse.redirect(new URL('/admin/siswa', req.url));
    if (token.role === 'siswa') return NextResponse.redirect(new URL('/siswa', req.url));
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (pathname.startsWith('/uploads')) {
    const response = NextResponse.next();
    // Tambahkan Header Anti-Cache agar file baru langsung terdeteksi
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  }
  // 3. Proteksi Halaman Private (Redirect jika user BELUM login)
  if (!token) {
    // Izinkan akses ke Login & API auth agar tidak error
    if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    // Selain itu, tendang ke login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. Proteksi Halaman Admin (Hanya untuk role 'admin')
  if (pathname.startsWith('/admin') && token.role !== 'admin') {
    return NextResponse.redirect(new URL('/siswa', req.url));
  }

  // 5. Proteksi Halaman Siswa (Hanya untuk role 'siswa')
  if (pathname.startsWith('/siswa') && token.role !== 'siswa') {
    return NextResponse.redirect(new URL('/admin/siswa', req.url));
  }

  return NextResponse.next();
}

// Config Matcher: Menentukan halaman mana yang dijaga
export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/siswa/:path*', '/uploads/:path*'],
};