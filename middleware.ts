import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/jwt';

// Public endpoints yang tidak memerlukan autentikasi
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/me',
  '/api/warga/cek-nik',
  '/api/surat/pengajuan',
  '/api/health',
];

// Static asset extensions yang diabaikan
const STATIC_EXT = ['.html', '.css', '.js', '.svg', '.ico', '.png', '.jpg', '.jpeg', '.xlsx', '.woff', '.woff2', '.webp'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hanya proses API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip public endpoints
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip static files dan Next.js internal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    STATIC_EXT.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  // Verifikasi JWT token menggunakan jose (Edge-compatible)
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json(
      { error: 'Token tidak ditemukan. Silakan login terlebih dahulu.' },
      { status: 401 }
    );
  }

  const payload = await verifyTokenEdge(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.' },
      { status: 401 }
    );
  }

  // Inject user info ke header request agar bisa dibaca API routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-username', payload.username);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
