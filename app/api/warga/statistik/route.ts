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
    const [counts, agama, pekerjaan, ekonomi, kk, usia] = await Promise.all([
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
      // Kelompok usia (piramida penduduk), dipecah per jenis kelamin.
      // Kelompok 5 tahunan dari 0-4 s/d 70+, dihitung dari tanggal_lahir.
      pool.query(`
        SELECT
          CASE
            WHEN umur BETWEEN 0 AND 4 THEN '0-4'
            WHEN umur BETWEEN 5 AND 9 THEN '5-9'
            WHEN umur BETWEEN 10 AND 14 THEN '10-14'
            WHEN umur BETWEEN 15 AND 19 THEN '15-19'
            WHEN umur BETWEEN 20 AND 24 THEN '20-24'
            WHEN umur BETWEEN 25 AND 29 THEN '25-29'
            WHEN umur BETWEEN 30 AND 34 THEN '30-34'
            WHEN umur BETWEEN 35 AND 39 THEN '35-39'
            WHEN umur BETWEEN 40 AND 44 THEN '40-44'
            WHEN umur BETWEEN 45 AND 49 THEN '45-49'
            WHEN umur BETWEEN 50 AND 54 THEN '50-54'
            WHEN umur BETWEEN 55 AND 59 THEN '55-59'
            WHEN umur BETWEEN 60 AND 64 THEN '60-64'
            WHEN umur BETWEEN 65 AND 69 THEN '65-69'
            ELSE '70+'
          END AS kelompok_usia,
          COUNT(*) FILTER (WHERE jenis_kelamin = 'Laki-laki') AS laki_laki,
          COUNT(*) FILTER (WHERE jenis_kelamin = 'Perempuan') AS perempuan
        FROM (
          SELECT jenis_kelamin, DATE_PART('year', AGE(NOW(), tanggal_lahir))::int AS umur
          FROM warga
          WHERE ${statusFilter} AND tanggal_lahir IS NOT NULL
        ) sub
        GROUP BY kelompok_usia
      `),
    ]);

    const c = counts.rows[0];

    // Urutan kelompok usia tetap & isi 0 untuk kelompok yang tidak ada datanya
    const URUTAN_USIA = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34',
      '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70+',
    ];
    const usiaMap = new Map(usia.rows.map((r) => [r.kelompok_usia, r]));
    const kelompokUsia = URUTAN_USIA.map((kelompok) => {
      const row = usiaMap.get(kelompok);
      return {
        kelompok_usia: kelompok,
        laki_laki: row ? parseInt(row.laki_laki) : 0,
        perempuan: row ? parseInt(row.perempuan) : 0,
      };
    });

    return Response.json({
      total_warga: parseInt(c.total),
      laki_laki: parseInt(c.laki_laki),
      perempuan: parseInt(c.perempuan),
      jumlah_kk: parseInt(kk.rows[0].count),
      // COUNT(*) dari PostgreSQL dikembalikan sebagai string — harus di-parse ke number,
      // kalau tidak, PieChart (Distribusi Agama & Status Ekonomi) gagal menghitung
      // total/proporsi karena "3"+"5" jadi "35" (concat string), bukan 8 (jumlah angka)
      agama: agama.rows.map((r) => ({ ...r, jumlah: parseInt(r.jumlah) })),
      pekerjaan: pekerjaan.rows.map((r) => ({ ...r, jumlah: parseInt(r.jumlah) })),
      ekonomi: ekonomi.rows.map((r) => ({ ...r, jumlah: parseInt(r.jumlah) })),
      kelompok_usia: kelompokUsia,
    });
  } catch (err: any) {
    return serverError(err);
  }
}
