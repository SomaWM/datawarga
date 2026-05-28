import { NextRequest } from 'next/server';
import pool from '@/lib/db';

async function generateNomorSurat(jenis: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const kodeMap: Record<string, string> = {
    'Surat Keterangan Domisili': 'SKD',
    'Surat Keterangan Tidak Mampu': 'SKTM',
    'Surat Keterangan Usaha': 'SKU',
    'Surat Keterangan Kelahiran': 'SKK',
    'Surat Keterangan Kematian': 'SKKm',
    'Surat Izin Keramaian': 'SIK',
    'Surat Pengantar': 'SP',
    'Surat Pemberitahuan': 'SPB',
  };
  const kode = kodeMap[jenis] || 'SK';
  const count = await pool.query(
    `SELECT COUNT(*) FROM surat WHERE jenis_surat = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
    [jenis, year]
  );
  const urutan = String(parseInt(count.rows[0].count) + 1).padStart(3, '0');
  return `${urutan}/${kode}/MAJ/${month}/${year}`;
}

// POST - Pengajuan surat oleh warga (publik, verifikasi NIK)
export async function POST(req: NextRequest) {
  try {
    const { nik, jenis_surat, keperluan } = await req.json();

    // Validasi input
    if (!nik || !jenis_surat || !keperluan) {
      return Response.json(
        { sukses: false, pesan: 'NIK, jenis surat, dan keperluan wajib diisi' },
        { status: 400 }
      );
    }

    const nikBersih = nik.trim();
    if (!/^\d{16}$/.test(nikBersih)) {
      return Response.json({ sukses: false, pesan: 'Format NIK tidak valid' }, { status: 400 });
    }

    // Verifikasi NIK - harus warga tetap
    const wargaResult = await pool.query(
      `SELECT nik, nama_lengkap FROM warga WHERE nik = $1 AND status_tinggal = 'tetap'`,
      [nikBersih]
    );

    if (wargaResult.rows.length === 0) {
      return Response.json(
        { sukses: false, pesan: 'NIK tidak terdaftar sebagai warga tetap Dukuh Majegan' },
        { status: 403 }
      );
    }

    const warga = wargaResult.rows[0];

    // Cek apakah warga sudah punya surat pending dengan jenis yang sama
    const cekDuplikat = await pool.query(
      `SELECT id FROM surat 
       WHERE pemohon_nik = $1 AND jenis_surat = $2 AND status IN ('pending', 'diproses')`,
      [nikBersih, jenis_surat]
    );

    if (cekDuplikat.rows.length > 0) {
      return Response.json(
        {
          sukses: false,
          pesan: `Anda sudah memiliki pengajuan ${jenis_surat} yang sedang diproses. Mohon tunggu hingga selesai.`,
        },
        { status: 409 }
      );
    }

    // Generate nomor surat & simpan
    const nomor_surat = await generateNomorSurat(jenis_surat);
    const perihal = `Permohonan ${jenis_surat} atas nama ${warga.nama_lengkap}`;

    const result = await pool.query(
      `INSERT INTO surat (nomor_surat, jenis_surat, perihal, pemohon_nik, pemohon_nama, keperluan)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nomor_surat, status, tanggal_pengajuan`,
      [nomor_surat, jenis_surat, perihal, nikBersih, warga.nama_lengkap, keperluan.trim()]
    );

    const surat = result.rows[0];
    return Response.json(
      {
        sukses: true,
        pesan: 'Pengajuan surat berhasil dikirim! Silakan tunggu konfirmasi dari petugas dukuh.',
        data: {
          nomor_surat: surat.nomor_surat,
          status: surat.status,
          tanggal: surat.tanggal_pengajuan,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error pengajuan surat:', err);
    return Response.json(
      { sukses: false, pesan: 'Terjadi kesalahan server, coba lagi nanti' },
      { status: 500 }
    );
  }
}

// GET - Cek status surat berdasarkan NIK (publik)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nik = searchParams.get('nik');

    if (!nik || !/^\d{16}$/.test(nik)) {
      return Response.json({ pesan: 'NIK tidak valid' }, { status: 400 });
    }

    // Verifikasi NIK dulu
    const wargaResult = await pool.query(
      `SELECT nama_lengkap FROM warga WHERE nik = $1 AND status_tinggal = 'tetap'`,
      [nik]
    );
    if (wargaResult.rows.length === 0) {
      return Response.json({ pesan: 'NIK tidak terdaftar' }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT nomor_surat, jenis_surat, keperluan, status, catatan, tanggal_pengajuan, tanggal_selesai
       FROM surat WHERE pemohon_nik = $1 ORDER BY tanggal_pengajuan DESC LIMIT 10`,
      [nik]
    );

    return Response.json({
      nama: wargaResult.rows[0].nama_lengkap,
      riwayat: result.rows,
    });
  } catch (err: any) {
    return Response.json({ pesan: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
