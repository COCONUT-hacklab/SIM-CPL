import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Ambil Cookie 'simcpl_token'
  const token = request.cookies.get('simcpl_token')?.value

  // 2. Cek apakah user mencoba akses rute '/dashboard'
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    
    // 3. Jika Token TIDAK ADA -> Tendang ke Login
    if (!token) {
      // Redirect ke login
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 4. Jika token ada, atau bukan rute dashboard, izinkan lewat
  return NextResponse.next()
}

// Konfigurasi: Middleware ini hanya aktif di rute /dashboard dan sub-rutenya
export const config = {
  matcher: ['/dashboard/:path*'],
}