import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// PUT update data bantuan warga
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const {
      jenis_bantuan_id, nik, no_kk, periode_mulai, periode_selesai,
      bentuk, jumlah_uang, satuan_uang, frekuensi, deskripsi_barang, status, catatan,
    } = await req.json();

    const result = await pool.query(
      `UPDATE bantuan_warga SET
         jenis_bantuan_id = $1, nik = $2, no_kk = $3,
         periode_mulai = $4, periode_selesai = $5,
         bentuk = $6, jumlah_uang = $7, satuan_uang = $8,
         frekuensi = $9, deskripsi_barang = $10,
         status = $11, catatan = $12, updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [
        jenis_bantuan_id, nik, no_kk || null,
        periode_mulai, periode_selesai || null,
        bentuk, jumlah_uang || null, satuan_uang || 'IDR',
        frekuensi || null, deskripsi_barang || null,
        status || 'aktif', catatan || null, id,
      ]
    );
    if (!result.rows.length) return Response.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE hapus penerima bantuan
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    await pool.query('DELETE FROM bantuan_warga WHERE id = $1', [id]);
    return Response.json({ sukses: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
