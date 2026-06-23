import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// GET detail data kelahiran by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const result = await pool.query('SELECT * FROM data_kelahiran WHERE id = $1', [id]);
    if (!result.rows.length) return Response.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}

// PUT update data kelahiran
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  const { id } = await params;

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
      `UPDATE data_kelahiran SET
         no_kk = $1, nama_ibu = $2, nik_ibu = $3, nama_ayah = $4, nik_ayah = $5, alamat = $6,
         nama_bayi = $7, tanggal_lahir = $8, jam_lahir = $9, jenis_kelamin = $10,
         berat_lahir = $11, tinggi_lahir = $12, tempat_lahir = $13, tempat_lahir_keterangan = $14,
         catatan = $15, updated_at = NOW()
       WHERE id = $16 RETURNING *`,
      [
        no_kk || null, nama_ibu || null, nik_ibu || null, nama_ayah || null, nik_ayah || null, alamat || null,
        nama_bayi, tanggal_lahir, jam_lahir || null, jenis_kelamin || null,
        berat_lahir || null, tinggi_lahir || null, tempat_lahir || null, tempat_lahir_keterangan || null,
        catatan || null, id,
      ]
    );
    if (!result.rows.length) return Response.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}

// DELETE hapus data kelahiran
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  const { id } = await params;

  try {
    await pool.query('DELETE FROM data_kelahiran WHERE id = $1', [id]);
    return Response.json({ sukses: true });
  } catch (err: any) {
    return serverError(err);
  }
}
