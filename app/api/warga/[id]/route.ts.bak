import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET warga by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT w.*, kk.alamat, kk.rt, kk.rw, kk.dusun 
       FROM warga w LEFT JOIN kepala_keluarga kk ON w.no_kk = kk.no_kk 
       WHERE w.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return Response.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT update warga
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const {
      nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
      pendidikan, pekerjaan, status_perkawinan, status_hubungan, golongan_darah,
      telepon, email, status_tinggal,
    } = await req.json();

    const result = await pool.query(
      `UPDATE warga SET nama_lengkap=$1, tempat_lahir=$2, tanggal_lahir=$3, jenis_kelamin=$4,
        agama=$5, pendidikan=$6, pekerjaan=$7, status_perkawinan=$8, status_hubungan=$9,
        golongan_darah=$10, telepon=$11, email=$12, status_tinggal=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pendidikan,
        pekerjaan, status_perkawinan, status_hubungan, golongan_darah, telepon, email,
        status_tinggal, id]
    );
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE warga
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    await pool.query('DELETE FROM warga WHERE id = $1', [id]);
    return Response.json({ message: 'Data warga berhasil dihapus' });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
