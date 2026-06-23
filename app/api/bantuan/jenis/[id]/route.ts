import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// PUT update jenis bantuan
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  const { id } = await params;

  try {
    const { kode, nama, penyelenggara, kategori, deskripsi, aktif } = await req.json();

    const result = await pool.query(
      `UPDATE jenis_bantuan SET
         kode = $1, nama = $2, penyelenggara = $3, kategori = $4,
         deskripsi = $5, aktif = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [kode?.toUpperCase().trim(), nama?.trim(), penyelenggara, kategori, deskripsi, aktif, id]
    );
    if (!result.rows.length) return Response.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return Response.json({ error: 'Kode bantuan sudah digunakan' }, { status: 400 });
    return serverError(err);
  }
}

// DELETE jenis bantuan
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  const { id } = await params;

  try {
    const cek = await pool.query('SELECT COUNT(*) FROM bantuan_warga WHERE jenis_bantuan_id = $1', [id]);
    if (parseInt(cek.rows[0].count) > 0) {
      return Response.json(
        { error: 'Tidak dapat dihapus karena sudah ada penerima bantuan. Nonaktifkan saja.' },
        { status: 400 }
      );
    }
    await pool.query('DELETE FROM jenis_bantuan WHERE id = $1', [id]);
    return Response.json({ sukses: true });
  } catch (err: any) {
    return serverError(err);
  }
}
