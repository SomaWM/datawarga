import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET semua jenis bantuan
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const aktif = searchParams.get('aktif');

    let query = `SELECT * FROM jenis_bantuan WHERE 1=1`;
    const params: any[] = [];
    let i = 1;

    if (aktif !== null) {
      query += ` AND aktif = $${i}`;
      params.push(aktif === 'true');
      i++;
    }
    query += ` ORDER BY kategori, nama`;

    const result = await pool.query(query, params);
    return Response.json(result.rows);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST tambah jenis bantuan
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { kode, nama, penyelenggara, kategori, deskripsi, aktif } = await req.json();

    if (!kode || !nama) {
      return Response.json({ error: 'Kode dan Nama bantuan wajib diisi' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO jenis_bantuan (kode, nama, penyelenggara, kategori, deskripsi, aktif)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [kode.toUpperCase().trim(), nama.trim(), penyelenggara, kategori, deskripsi, aktif !== false]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') return Response.json({ error: 'Kode bantuan sudah digunakan' }, { status: 400 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
