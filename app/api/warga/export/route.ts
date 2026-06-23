import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { exportToExcel, sendExcelResponse } from '@/lib/excel';
import { hitungUmur } from '@/lib/utils';

/**
 * GET /api/warga/export
 *
 * Export data warga ke Excel (.xlsx).
 * Mendukung filter yang sama dengan GET /api/warga (search, status, jenis_kelamin, agama, RT/RW, usia).
 * Akses: staff+ (data warga sensitif).
 *
 * Query params: sama dengan /api/warga, tapi tanpa pagination (export semua yang match).
 */
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const jenisKelamin = searchParams.get('jenis_kelamin');
    const agama = searchParams.get('agama');
    const statusEkonomi = searchParams.get('status_ekonomi');
    const rt = searchParams.get('rt');
    const rw = searchParams.get('rw');
    const usiaMin = searchParams.get('usia_min');
    const usiaMax = searchParams.get('usia_max');

    // Build query dengan filter (tanpa pagination, ambil semua)
    let query = `
      SELECT w.nik, w.no_kk, w.nama_lengkap, w.tempat_lahir, w.tanggal_lahir, w.jenis_kelamin,
             w.agama, w.pendidikan, w.pekerjaan, w.status_perkawinan, w.status_hubungan,
             w.golongan_darah, w.telepon, w.email, w.status_tinggal, w.status_ekonomi,
             kk.alamat, kk.rt, kk.rw, kk.dusun
      FROM warga w
      LEFT JOIN kepala_keluarga kk ON w.no_kk = kk.no_kk
      WHERE 1=1
    `;
    const params: any[] = [];
    let i = 1;

    if (search) {
      query += ` AND (w.nama_lengkap ILIKE $${i} OR w.nik ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    if (status) {
      query += ` AND w.status_tinggal = $${i}`;
      params.push(status);
      i++;
    }
    if (jenisKelamin) {
      query += ` AND w.jenis_kelamin = $${i}`;
      params.push(jenisKelamin);
      i++;
    }
    if (agama) {
      query += ` AND w.agama = $${i}`;
      params.push(agama);
      i++;
    }
    if (statusEkonomi) {
      query += ` AND w.status_ekonomi = $${i}`;
      params.push(statusEkonomi);
      i++;
    }
    if (rt) {
      query += ` AND kk.rt = $${i}`;
      params.push(rt);
      i++;
    }
    if (rw) {
      query += ` AND kk.rw = $${i}`;
      params.push(rw);
      i++;
    }
    if (usiaMin) {
      const minUsia = parseInt(usiaMin);
      if (!isNaN(minUsia)) {
        query += ` AND w.tanggal_lahir IS NOT NULL AND EXTRACT(YEAR FROM age(w.tanggal_lahir)) >= $${i}`;
        params.push(minUsia);
        i++;
      }
    }
    if (usiaMax) {
      const maxUsia = parseInt(usiaMax);
      if (!isNaN(maxUsia)) {
        query += ` AND w.tanggal_lahir IS NOT NULL AND EXTRACT(YEAR FROM age(w.tanggal_lahir)) <= $${i}`;
        params.push(maxUsia);
        i++;
      }
    }

    query += ` ORDER BY kk.rt, kk.rw, w.nama_lengkap`;

    const result = await pool.query(query, params);
    const rows = result.rows;

    // Generate Excel
    const buffer = exportToExcel({
      sheetName: 'Data Warga',
      title: `DATA WARGA PADUKUHAN MAJEGAN (${rows.length} warga)`,
      columns: [
        { header: 'No', key: 'nik', width: 5, format: (_v, _r, idx) => idx + 1 },
        { header: 'NIK', key: 'nik', width: 20 },
        { header: 'No. KK', key: 'no_kk', width: 20 },
        { header: 'Nama Lengkap', key: 'nama_lengkap', width: 30 },
        { header: 'Tempat Lahir', key: 'tempat_lahir', width: 15 },
        {
          header: 'Tanggal Lahir',
          key: 'tanggal_lahir',
          width: 14,
          format: (v) => (v ? new Date(v).toLocaleDateString('id-ID') : ''),
        },
        {
          header: 'Usia',
          key: 'tanggal_lahir',
          width: 6,
          format: (v) => (v ? (hitungUmur(v) ?? 0) : ''),
        },
        { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 12 },
        { header: 'Agama', key: 'agama', width: 10 },
        { header: 'Pendidikan', key: 'pendidikan', width: 15 },
        { header: 'Pekerjaan', key: 'pekerjaan', width: 18 },
        { header: 'Status Perkawinan', key: 'status_perkawinan', width: 16 },
        { header: 'Status Hubungan', key: 'status_hubungan', width: 16 },
        { header: 'Gol. Darah', key: 'golongan_darah', width: 10 },
        { header: 'Telepon', key: 'telepon', width: 14 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Status Tinggal', key: 'status_tinggal', width: 14 },
        { header: 'Status Ekonomi', key: 'status_ekonomi', width: 14 },
        { header: 'RT', key: 'rt', width: 5 },
        { header: 'RW', key: 'rw', width: 5 },
        { header: 'Dusun', key: 'dusun', width: 10 },
        { header: 'Alamat', key: 'alamat', width: 40 },
      ],
      rows,
    });

    // Audit: export data — fire-and-forget
    audit(req, user, {
      aksi: 'status_change',
      entitas: 'warga',
      entitas_id: 'export',
      deskripsi: `Export data warga (${rows.length} record) ke Excel`,
    });

    const tanggal = new Date().toISOString().slice(0, 10);
    return sendExcelResponse(buffer, `data-warga-${tanggal}.xlsx`);
  } catch (err: any) {
    return serverError(err);
  }
}
