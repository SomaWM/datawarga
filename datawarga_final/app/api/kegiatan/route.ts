import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET semua kegiatan
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const result = await pool.query('SELECT * FROM kegiatan ORDER BY tanggal DESC');
    return Response.json(result.rows);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST tambah kegiatan
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { nama_kegiatan, deskripsi, tanggal, waktu, lokasi, penanggung_jawab } = await req.json();
    const result = await pool.query(
      `INSERT INTO kegiatan (nama_kegiatan, deskripsi, tanggal, waktu, lokasi, penanggung_jawab)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nama_kegiatan, deskripsi, tanggal, waktu, lokasi, penanggung_jawab]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
