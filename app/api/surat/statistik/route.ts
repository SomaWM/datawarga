import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, serverError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    // Gunakan date range (bukan EXTRACT) supaya bisa pakai index
    const [stats, jenis] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'diproses') as diproses,
          COUNT(*) FILTER (WHERE status = 'selesai') as selesai,
          COUNT(*) FILTER (WHERE status = 'ditolak') as ditolak
        FROM surat
        WHERE created_at >= date_trunc('month', NOW())
          AND created_at < date_trunc('month', NOW()) + interval '1 month'
      `),
      pool.query(`
        SELECT jenis_surat, COUNT(*) as jumlah FROM surat
        GROUP BY jenis_surat ORDER BY jumlah DESC
      `),
    ]);

    return Response.json({ ...stats.rows[0], per_jenis: jenis.rows });
  } catch (err: any) {
    return serverError(err);
  }
}
