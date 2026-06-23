import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

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

// GET semua surat
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const jenis = searchParams.get('jenis');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `SELECT s.*, u.nama_lengkap as dibuat_oleh_nama FROM surat s LEFT JOIN users u ON s.dibuat_oleh = u.id WHERE 1=1`;
    const params: any[] = [];
    let i = 1;

    if (status) { query += ` AND s.status = $${i++}`; params.push(status); }
    if (jenis) { query += ` AND s.jenis_surat = $${i++}`; params.push(jenis); }
    if (search) { query += ` AND (s.pemohon_nama ILIKE $${i} OR s.nomor_surat ILIKE $${i})`; params.push(`%${search}%`); i++; }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) t`, params);
    query += ` ORDER BY s.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return Response.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
    });
  } catch (err: any) {
    return serverError(err);
  }
}

// POST buat surat baru
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const { jenis_surat, pemohon_nik, pemohon_nama, keperluan, perihal } = await req.json();
    const nomor_surat = await generateNomorSurat(jenis_surat);

    const result = await pool.query(
      `INSERT INTO surat (nomor_surat, jenis_surat, perihal, pemohon_nik, pemohon_nama, keperluan, dibuat_oleh)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nomor_surat, jenis_surat, perihal, pemohon_nik, pemohon_nama, keperluan, user.id]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return serverError(err);
  }
}
