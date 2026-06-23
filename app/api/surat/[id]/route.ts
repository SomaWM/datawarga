import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// DELETE surat
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    await pool.query('DELETE FROM surat WHERE id = $1', [id]);
    return Response.json({ message: 'Surat berhasil dihapus' });
  } catch (err: any) {
    return serverError(err);
  }
}
