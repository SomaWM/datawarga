import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET KK beserta anggota — id bisa berupa UUID (pk) atau no_kk (16 digit)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;

    // Coba cocokkan berdasarkan no_kk dulu, fallback ke id (UUID)
    const kk = await pool.query(
      'SELECT * FROM kepala_keluarga WHERE no_kk = $1 OR id::text = $1',
      [id]
    );

    if (kk.rows.length === 0) {
      return Response.json({ error: 'KK tidak ditemukan' }, { status: 404 });
    }

    const no_kk = kk.rows[0].no_kk;
    const anggota = await pool.query(
      'SELECT * FROM warga WHERE no_kk = $1 ORDER BY status_hubungan',
      [no_kk]
    );

    return Response.json({ kk: kk.rows[0], anggota: anggota.rows });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
