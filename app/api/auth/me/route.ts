import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, serverError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const result = await pool.query(
      'SELECT id, username, nama_lengkap, role FROM users WHERE id = $1',
      [user.id]
    );
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}
