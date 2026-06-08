import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET semua warga (dengan filter & pagination)
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT w.*, kk.alamat, kk.rt, kk.rw 
      FROM warga w
      LEFT JOIN kepala_keluarga kk ON w.no_kk = kk.no_kk
      WHERE 1=1
    `;
    const params: any[] = [];
    let i = 1;

    if (search) {
      query += ` AND (w.nama_lengkap ILIKE $${i} OR w.nik ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    if (status) {
      query += ` AND w.status_tinggal = $${i}`;
      params.push(status);
      i++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) t`, params);
    query += ` ORDER BY w.nama_lengkap LIMIT $${i} OFFSET $${i + 1}`;
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

// POST tambah warga
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const {
      nik, no_kk, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin,
      agama, pendidikan, pekerjaan, status_perkawinan, status_hubungan,
      golongan_darah, telepon, email, status_tinggal,
    } = await req.json();

    const result = await pool.query(
      `INSERT INTO warga (nik, no_kk, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin,
        agama, pendidikan, pekerjaan, status_perkawinan, status_hubungan, golongan_darah,
        telepon, email, status_tinggal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [nik, no_kk, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin,
        agama, pendidikan, pekerjaan, status_perkawinan, status_hubungan, golongan_darah,
        telepon, email, status_tinggal || 'tetap']
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') return Response.json({ error: 'NIK sudah terdaftar' }, { status: 400 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
