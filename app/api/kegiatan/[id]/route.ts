import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// PUT update kegiatan
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const { nama_kegiatan, deskripsi, tanggal, waktu, lokasi, penanggung_jawab, status } = await req.json();
    const result = await pool.query(
      `UPDATE kegiatan SET nama_kegiatan=$1, deskripsi=$2, tanggal=$3, waktu=$4, lokasi=$5, penanggung_jawab=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [nama_kegiatan, deskripsi, tanggal, waktu, lokasi, penanggung_jawab, status, id]
    );
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}

// DELETE kegiatan
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    await pool.query('DELETE FROM kegiatan WHERE id = $1', [id]);
    return Response.json({ message: 'Kegiatan berhasil dihapus' });
  } catch (err: any) {
    return serverError(err);
  }
}
