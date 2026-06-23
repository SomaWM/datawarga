import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// GET semua KK
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let query = `
      SELECT kk.*, COUNT(w.id) as jumlah_anggota 
      FROM kepala_keluarga kk
      LEFT JOIN warga w ON kk.no_kk = w.no_kk AND w.status_tinggal IN ('domisili_asli', 'sementara')
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (kk.nama_kepala ILIKE $1 OR kk.no_kk ILIKE $1)`;
      params.push(`%${search}%`);
    }
    query += ` GROUP BY kk.id ORDER BY kk.nama_kepala`;

    const result = await pool.query(query, params);
    return Response.json(result.rows);
  } catch (err: any) {
    return serverError(err);
  }
}

// POST tambah KK
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const { no_kk, nama_kepala, alamat, rt, rw, telepon } = await req.json();
    const result = await pool.query(
      `INSERT INTO kepala_keluarga (no_kk, nama_kepala, alamat, rt, rw, telepon)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [no_kk, nama_kepala, alamat, rt, rw, telepon]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') return Response.json({ error: 'No KK sudah terdaftar' }, { status: 400 });
    return serverError(err);
  }
}
