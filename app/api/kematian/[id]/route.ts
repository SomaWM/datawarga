import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// GET detail data kematian by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const result = await pool.query('SELECT * FROM data_kematian WHERE id = $1', [id]);
    if (!result.rows.length) return Response.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT update data kematian
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const {
      nik, no_kk, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat,
      tanggal_meninggal, usia_jenazah, jam_meninggal,
      tempat_meninggal, tempat_meninggal_keterangan,
      penyebab_kematian, penyebab_kematian_keterangan,
      nama_ibu, nama_ayah, lokasi_pemakaman, catatan,
    } = await req.json();

    if (!nama_lengkap || !tanggal_meninggal) {
      return Response.json({ error: 'Nama lengkap dan tanggal meninggal wajib diisi' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE data_kematian SET
         nik = $1, no_kk = $2, nama_lengkap = $3, tempat_lahir = $4,
         tanggal_lahir = $5, jenis_kelamin = $6, alamat = $7,
         tanggal_meninggal = $8, usia_jenazah = $9, jam_meninggal = $10,
         tempat_meninggal = $11, tempat_meninggal_keterangan = $12,
         penyebab_kematian = $13, penyebab_kematian_keterangan = $14,
         nama_ibu = $15, nama_ayah = $16, lokasi_pemakaman = $17,
         catatan = $18, updated_at = NOW()
       WHERE id = $19 RETURNING *`,
      [
        nik || null, no_kk || null, nama_lengkap, tempat_lahir || null,
        tanggal_lahir || null, jenis_kelamin || null, alamat || null,
        tanggal_meninggal, usia_jenazah || null, jam_meninggal || null,
        tempat_meninggal || null, tempat_meninggal_keterangan || null,
        penyebab_kematian || null, penyebab_kematian_keterangan || null,
        nama_ibu || null, nama_ayah || null, lokasi_pemakaman || null,
        catatan || null, id,
      ]
    );
    if (!result.rows.length) return Response.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE hapus data kematian
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    await pool.query('DELETE FROM data_kematian WHERE id = $1', [id]);
    return Response.json({ sukses: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
