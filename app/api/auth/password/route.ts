import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { verifyToken, unauthorized, serverError, badRequest } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { passwordChangeSchema, formatZodError } from '@/lib/validations';

// PUT ganti password
export async function PUT(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();

    // Validasi input dengan Zod
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(formatZodError(parsed.error));
    }
    const { old_password, new_password } = parsed.data;

    // Ambil user dari database untuk cek password lama
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [user.id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const valid = await bcrypt.compare(old_password, result.rows[0].password);
    if (!valid) {
      return Response.json({ error: 'Password lama tidak sesuai' }, { status: 400 });
    }

    // Hash password baru dan update
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password = $1, password_changed = true WHERE id = $2',
      [hashedPassword, user.id]
    );

    // Audit: password diubah (sensitif - catat tanpa expose password) — fire-and-forget
    audit(req, user, {
      aksi: 'update',
      entitas: 'users',
      entitas_id: user.id,
      deskripsi: `User "${user.username}" mengubah password-nya`,
    });

    return Response.json({ sukses: true, pesan: 'Password berhasil diubah' });
  } catch (err: any) {
    return serverError(err);
  }
}
