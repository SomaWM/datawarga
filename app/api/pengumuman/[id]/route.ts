import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// PUT update pengumuman
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const { judul, isi, kategori, penting, tanggal_mulai, tanggal_selesai } = await req.json();
    const result = await pool.query(
      `UPDATE pengumuman SET judul=$1, isi=$2, kategori=$3, penting=$4, tanggal_mulai=$5, tanggal_selesai=$6
       WHERE id=$7 RETURNING *`,
      [judul, isi, kategori, penting, tanggal_mulai, tanggal_selesai, id]
    );
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}

// DELETE pengumuman
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    await pool.query('DELETE FROM pengumuman WHERE id = $1', [id]);
    return Response.json({ message: 'Pengumuman berhasil dihapus' });
  } catch (err: any) {
    return serverError(err);
  }
}
