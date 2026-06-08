import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ nik: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { nik } = await params;

    const result = await pool.query(
      `SELECT w.nik, w.nama_lengkap, w.foto_ktp, w.foto_kk,
              w.status_tinggal, w.status_hubungan, w.jenis_kelamin,
              w.tanggal_lahir, w.no_kk, kk.nama_kepala, kk.alamat, kk.rt, kk.rw
       FROM warga w
       LEFT JOIN kepala_keluarga kk ON w.no_kk = kk.no_kk
       WHERE w.nik = $1`,
      [nik]
    );

    if (result.rows.length === 0)
      return Response.json({ error: 'NIK tidak ditemukan' }, { status: 404 });

    return Response.json(result.rows[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE hapus dokumen
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ nik: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { nik } = await params;
    const { searchParams } = new URL(req.url);
    const tipe = searchParams.get('tipe'); // 'ktp' | 'kk'

    if (!tipe || !['ktp', 'kk'].includes(tipe))
      return Response.json({ error: 'Tipe harus ktp atau kk' }, { status: 400 });

    const kolom = tipe === 'ktp' ? 'foto_ktp' : 'foto_kk';
    await pool.query(`UPDATE warga SET ${kolom} = NULL, updated_at = NOW() WHERE nik = $1`, [nik]);

    return Response.json({ sukses: true, pesan: `Foto ${tipe.toUpperCase()} berhasil dihapus` });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
