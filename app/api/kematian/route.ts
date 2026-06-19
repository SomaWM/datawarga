import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET daftar data kematian (dengan filter & pagination)
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
      SELECT dk.*
      FROM data_kematian dk
      WHERE 1=1
    `;
    const params: any[] = [];
    let i = 1;

    if (search) {
      query += ` AND (dk.nama_lengkap ILIKE $${i} OR dk.nik ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) t`, params);
    query += ` ORDER BY dk.tanggal_meninggal DESC, dk.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
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

// POST tambah data kematian
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const {
      nik, no_kk, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat,
      tanggal_meninggal, usia_jenazah, jam_meninggal,
      tempat_meninggal, tempat_meninggal_keterangan,
      penyebab_kematian, penyebab_kematian_keterangan,
      nama_ibu, nama_ayah, lokasi_pemakaman, catatan,
    } = await req.json();

    if (!nama_lengkap || !tanggal_meninggal) {
      return Response.json({ error: 'Nama lengkap dan tanggal meninggal wajib diisi' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO data_kematian
         (nik, no_kk, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat,
          tanggal_meninggal, usia_jenazah, jam_meninggal,
          tempat_meninggal, tempat_meninggal_keterangan,
          penyebab_kematian, penyebab_kematian_keterangan,
          nama_ibu, nama_ayah, lokasi_pemakaman, catatan, dibuat_oleh)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [
        nik || null, no_kk || null, nama_lengkap, tempat_lahir || null,
        tanggal_lahir || null, jenis_kelamin || null, alamat || null,
        tanggal_meninggal, usia_jenazah || null, jam_meninggal || null,
        tempat_meninggal || null, tempat_meninggal_keterangan || null,
        penyebab_kematian || null, penyebab_kematian_keterangan || null,
        nama_ibu || null, nama_ayah || null, lokasi_pemakaman || null,
        catatan || null, user.id,
      ]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
