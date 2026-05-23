import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET semua pengumuman
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const result = await pool.query(`
      SELECT p.*, u.nama_lengkap as dibuat_oleh_nama 
      FROM pengumuman p LEFT JOIN users u ON p.dibuat_oleh = u.id 
      ORDER BY p.penting DESC, p.created_at DESC
    `);
    return Response.json(result.rows);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST tambah pengumuman
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { judul, isi, kategori, penting, tanggal_mulai, tanggal_selesai } = await req.json();
    const result = await pool.query(
      `INSERT INTO pengumuman (judul, isi, kategori, penting, tanggal_mulai, tanggal_selesai, dibuat_oleh)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [judul, isi, kategori || 'umum', penting || false, tanggal_mulai, tanggal_selesai, user.id]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
