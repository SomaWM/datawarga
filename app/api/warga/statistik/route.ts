import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const total = await pool.query("SELECT COUNT(*) FROM warga WHERE status_tinggal = 'tetap'");
    const laki = await pool.query("SELECT COUNT(*) FROM warga WHERE jenis_kelamin = 'Laki-laki' AND status_tinggal = 'tetap'");
    const perempuan = await pool.query("SELECT COUNT(*) FROM warga WHERE jenis_kelamin = 'Perempuan' AND status_tinggal = 'tetap'");
    const kk = await pool.query("SELECT COUNT(*) FROM kepala_keluarga");
    const agama = await pool.query("SELECT agama, COUNT(*) as jumlah FROM warga WHERE status_tinggal = 'tetap' GROUP BY agama");
    const pekerjaan = await pool.query("SELECT pekerjaan, COUNT(*) as jumlah FROM warga WHERE status_tinggal = 'tetap' AND pekerjaan IS NOT NULL GROUP BY pekerjaan ORDER BY jumlah DESC LIMIT 5");

    return Response.json({
      total_warga: parseInt(total.rows[0].count),
      laki_laki: parseInt(laki.rows[0].count),
      perempuan: parseInt(perempuan.rows[0].count),
      jumlah_kk: parseInt(kk.rows[0].count),
      agama: agama.rows,
      pekerjaan: pekerjaan.rows,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
