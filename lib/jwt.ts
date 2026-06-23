/**
 * Utility JWT yang kompatibel dengan Edge Runtime (untuk middleware).
 *
 * Middleware Next.js berjalan di Edge Runtime yang TIDAK mendukung modul
 * `crypto` Node.js, sehingga library `jsonwebtoken` akan throw error.
 * Solusinya: gunakan `jose` (Web Crypto API based) untuk middleware,
 * dan tetap pakai `jsonwebtoken` di API routes (Node.js server).
 *
 * Kedua library harus menghasilkan token yang kompatibel:
 * - Algoritma: HS256
 * - Secret: process.env.JWT_SECRET
 */
import { jwtVerify, SignJWT } from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'secret';
  return new TextEncoder().encode(secret);
}

export interface EdgeJWTPayload {
  id: string;
  username: string;
  role: string;
}

/**
 * Verifikasi token JWT di Edge Runtime (untuk middleware).
 * Return payload jika valid, null jika tidak.
 */
export async function verifyTokenEdge(token: string): Promise<EdgeJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as EdgeJWTPayload;
  } catch {
    return null;
  }
}
