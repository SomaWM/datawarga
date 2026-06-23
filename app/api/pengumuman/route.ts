import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// GET semua pengumuman
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await pool.query(`
      SELECT p.*, u.nama_lengkap as dibuat_oleh_nama
      FROM pengumuman p LEFT JOIN users u ON p.dibuat_oleh = u.id
      ORDER BY p.penting DESC, p.created_at DESC
      LIMIT $1
    `, [limit]);
    return Response.json(result.rows);
  } catch (err: any) {
    return serverError(err);
  }
}

// POST tambah pengumuman
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  // Hanya dukuh yang bisa buat pengumuman
  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  try {
    const { judul, isi, kategori, penting, tanggal_mulai, tanggal_selesai } = await req.json();
    const result = await pool.query(
      `INSERT INTO pengumuman (judul, isi, kategori, penting, tanggal_mulai, tanggal_selesai, dibuat_oleh)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [judul, isi, kategori || 'umum', penting || false, tanggal_mulai, tanggal_selesai, user.id]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return serverError(err);
  }
}
