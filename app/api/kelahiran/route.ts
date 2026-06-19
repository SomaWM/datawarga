import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET daftar data kelahiran (dengan filter & pagination)
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    let query = `
      SELECT dl.*
      FROM data_kelahiran dl
      WHERE 1=1
    `;
    const params: any[] = [];
    let i = 1;

    if (search) {
      query += ` AND (dl.nama_bayi ILIKE $${i} OR dl.nama_ibu ILIKE $${i} OR dl.nama_ayah ILIKE $${i} OR dl.nik_ibu ILIKE $${i} OR dl.nik_ayah ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) t`, params);
    query += ` ORDER BY dl.tanggal_lahir DESC, dl.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return Response.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST tambah data kelahiran
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const {
      no_kk, nama_ibu, nik_ibu, nama_ayah, nik_ayah, alamat,
      nama_bayi, tanggal_lahir, jam_lahir, jenis_kelamin,
      berat_lahir, tinggi_lahir, tempat_lahir, tempat_lahir_keterangan, catatan,
    } = await req.json();

    if (!nama_bayi || !tanggal_lahir) {
      return Response.json({ error: 'Nama bayi dan tanggal lahir wajib diisi' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO data_kelahiran
         (no_kk, nama_ibu, nik_ibu, nama_ayah, nik_ayah, alamat,
          nama_bayi, tanggal_lahir, jam_lahir, jenis_kelamin,
          berat_lahir, tinggi_lahir, tempat_lahir, tempat_lahir_keterangan, catatan, dibuat_oleh)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        no_kk || null, nama_ibu || null, nik_ibu || null, nama_ayah || null, nik_ayah || null, alamat || null,
        nama_bayi, tanggal_lahir, jam_lahir || null, jenis_kelamin || null,
        berat_lahir || null, tinggi_lahir || null, tempat_lahir || null, tempat_lahir_keterangan || null,
        catatan || null, user.id,
      ]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
