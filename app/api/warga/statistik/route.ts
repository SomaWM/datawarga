import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, serverError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    // Filter status_tinggal: dukuh warga aktif
    // Mendukung format lama ('tetap') dan baru ('domisili_asli', 'sementara')
    const statusFilter = `status_tinggal IN ('domisili_asli', 'sementara', 'tetap')`;

    // Satu query untuk semua count (total, laki, perempuan) menggunakan FILTER clause
    const [counts, agama, pekerjaan, ekonomi, kk] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE jenis_kelamin = 'Laki-laki') AS laki_laki,
          COUNT(*) FILTER (WHERE jenis_kelamin = 'Perempuan') AS perempuan
        FROM warga
        WHERE ${statusFilter}
      `),
      pool.query(`
        SELECT COALESCE(agama, 'Tidak diisi') AS agama, COUNT(*) AS jumlah
        FROM warga
        WHERE ${statusFilter}
        GROUP BY COALESCE(agama, 'Tidak diisi')
        ORDER BY jumlah DESC
      `),
      pool.query(`
        SELECT COALESCE(NULLIF(pekerjaan, ''), 'Tidak diisi') AS pekerjaan, COUNT(*) AS jumlah
        FROM warga
        WHERE ${statusFilter}
        GROUP BY COALESCE(NULLIF(pekerjaan, ''), 'Tidak diisi')
        ORDER BY jumlah DESC LIMIT 8
      `),
      pool.query(`
        SELECT COALESCE(status_ekonomi, 'mampu') AS status_ekonomi, COUNT(*) AS jumlah
        FROM warga
        WHERE ${statusFilter}
        GROUP BY COALESCE(status_ekonomi, 'mampu')
        ORDER BY jumlah DESC
      `),
      pool.query(`SELECT COUNT(*) FROM kepala_keluarga`),
    ]);

    const c = counts.rows[0];
    return Response.json({
      total_warga: parseInt(c.total),
      laki_laki: parseInt(c.laki_laki),
      perempuan: parseInt(c.perempuan),
      jumlah_kk: parseInt(kk.rows[0].count),
      agama: agama.rows,
      pekerjaan: pekerjaan.rows,
      ekonomi: ekonomi.rows,
    });
  } catch (err: any) {
    return serverError(err);
  }
}
