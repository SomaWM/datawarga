import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { audit } from '@/lib/audit';

// ── Rate Limiting (in-memory) ──────────────────────────────────────
// Max 5 attempts per IP per 15 menit
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

function isRateLimited(ip: string): boolean {
  const record = loginAttempts.get(ip);
  if (!record) return false;

  const elapsed = Date.now() - record.firstAttempt;
  if (elapsed > WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const record = loginAttempts.get(ip);
  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    record.count++;
  }
}

function recordSuccess(ip: string): void {
  loginAttempts.delete(ip);
}

// ── Login Handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return Response.json(
        { error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.' },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      recordFailedAttempt(ip);
      // Audit: login gagal (fire-and-forget — jangan await)
      audit(req, null, {
        aksi: 'login_failed',
        entitas: 'users',
        entitas_id: username,
        deskripsi: `Percobaan login gagal untuk username "${username}" - user tidak ditemukan`,
      });
      return Response.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      recordFailedAttempt(ip);
      // Audit: login gagal (fire-and-forget)
      audit(req, null, {
        aksi: 'login_failed',
        entitas: 'users',
        entitas_id: user.id,
        deskripsi: `Percobaan login gagal untuk username "${username}" - password salah`,
      });
      return Response.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Reset rate limit on success
    recordSuccess(ip);

    // Audit: login sukses (fire-and-forget — jangan await, langsung return response)
    audit(req, { id: user.id, username: user.username, role: user.role }, {
      aksi: 'login',
      entitas: 'users',
      entitas_id: user.id,
      deskripsi: `Login berhasil: ${user.username} (${user.role})`,
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    return Response.json({
      token,
      user: { id: user.id, username: user.username, nama: user.nama_lengkap, role: user.role },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return Response.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
