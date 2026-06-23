import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// PUT update KK
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const { nama_kepala, alamat, rt, rw, telepon } = await req.json();
    const result = await pool.query(
      `UPDATE kepala_keluarga SET nama_kepala=$1, alamat=$2, rt=$3, rw=$4, telepon=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [nama_kepala, alamat, rt, rw, telepon, id]
    );
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}
