import { NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { nik } = await req.json();

    if (!nik || nik.trim().length === 0)
      return Response.json({ valid: false, pesan: 'NIK tidak boleh kosong' }, { status: 400 });

    const nikBersih = nik.trim();
    if (!/^\d{16}$/.test(nikBersih))
      return Response.json({ valid: false, pesan: 'NIK harus 16 digit angka' }, { status: 400 });

    const result = await pool.query(
      `SELECT nik, nama_lengkap, status_tinggal FROM warga WHERE nik = $1`,
      [nikBersih]
    );

    if (result.rows.length === 0)
      return Response.json({ valid: false, pesan: 'NIK tidak ditemukan dalam database Dukuh Majegan' });

    const warga = result.rows[0];
    return Response.json({
      valid: true,
      nik: warga.nik,
      nama: warga.nama_lengkap,
      pesan: `Selamat datang, ${warga.nama_lengkap}`,
    });
  } catch {
    return Response.json({ valid: false, pesan: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
