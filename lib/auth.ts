import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: string;
  username: string;
  role: string;
}

// Hirarki role: dukuh (3) > staff (2) > warga (1)
const ROLE_LEVELS: Record<string, number> = {
  dukuh: 3,
  staff: 2,
  warga: 1,
};

/**
 * Verifikasi token JWT dari request.
 * Middleware sudah memverifikasi token dan menaruh data di header (x-user-id, x-user-role).
 * Fungsi ini membaca data tersebut, tapi tetap bisa fallback ke verify langsung untuk compatibility.
 */
export function verifyToken(req: NextRequest): JWTPayload | null {
  // Prioritas baca dari header yang diset middleware
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');
  const username = req.headers.get('x-user-username');

  if (userId && userRole && username) {
    return { id: userId, username, role: userRole };
  }

  // Fallback: verify token langsung (untuk compatibility)
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Cek apakah user memiliki role yang cukup (minimal minRole).
 * Mengembalikan 403 jika tidak memiliki akses, atau null jika boleh.
 */
export function requireRole(user: JWTPayload, minRole: 'dukuh' | 'staff' | 'warga'): Response | null {
  const userLevel = ROLE_LEVELS[user.role] || 0;
  const requiredLevel = ROLE_LEVELS[minRole] || 0;

  if (userLevel < requiredLevel) {
    return Response.json(
      { error: 'Anda tidak memiliki akses untuk melakukan operasi ini.' },
      { status: 403 }
    );
  }

  return null;
}

export function unauthorized() {
  return Response.json({ error: 'Token tidak valid atau tidak ditemukan' }, { status: 401 });
}

/**
 * Helper untuk pesan error generik (tidak expose detail internal).
 */
export function serverError(err: any) {
  // Log error lengkap di server untuk debugging
  console.error('Server Error:', err);
  // Kembalikan pesan generik ke client
  return Response.json(
    { error: 'Terjadi kesalahan server. Silakan coba lagi nanti.' },
    { status: 500 }
  );
}

/**
 * Helper untuk bad request (400) dengan pesan error.
 */
export function badRequest(message: string, errors?: Record<string, string>) {
  return Response.json(
    { error: message, errors },
    { status: 400 }
  );
}
