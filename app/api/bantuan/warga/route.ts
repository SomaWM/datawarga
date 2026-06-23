import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

// GET daftar penerima bantuan
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const jenis_id = searchParams.get('jenis_bantuan_id') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        bw.*,
        w.nama_lengkap, w.nik,
        kk.alamat, kk.rt, kk.rw, kk.dusun,
        jb.nama  AS nama_bantuan,
        jb.kode  AS kode_bantuan,
        jb.kategori,
        jb.penyelenggara
      FROM bantuan_warga bw
      JOIN warga w ON bw.nik = w.nik
      LEFT JOIN kepala_keluarga kk ON bw.no_kk = kk.no_kk
      JOIN jenis_bantuan jb ON bw.jenis_bantuan_id = jb.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let i = 1;

    if (search) {
      query += ` AND (w.nama_lengkap ILIKE $${i} OR w.nik ILIKE $${i} OR jb.nama ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    if (jenis_id) {
      query += ` AND bw.jenis_bantuan_id = $${i}`;
      params.push(jenis_id);
      i++;
    }
    if (status) {
      query += ` AND bw.status = $${i}`;
      params.push(status);
      i++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) t`, params);
    query += ` ORDER BY bw.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return Response.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (err: any) {
    return serverError(err);
  }
}

// POST tambah penerima bantuan
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const {
      jenis_bantuan_id, nik, no_kk, periode_mulai, periode_selesai,
      bentuk, jumlah_uang, satuan_uang, frekuensi, deskripsi_barang, status, catatan,
    } = await req.json();

    if (!jenis_bantuan_id || !nik || !periode_mulai || !bentuk) {
      return Response.json({ error: 'Jenis bantuan, NIK, periode mulai, dan bentuk wajib diisi' }, { status: 400 });
    }

    let kkNo = no_kk;
    if (!kkNo) {
      const wr = await pool.query('SELECT no_kk FROM warga WHERE nik = $1', [nik]);
      kkNo = wr.rows[0]?.no_kk || null;
    }

    const result = await pool.query(
      `INSERT INTO bantuan_warga
         (jenis_bantuan_id, nik, no_kk, periode_mulai, periode_selesai,
          bentuk, jumlah_uang, satuan_uang, frekuensi, deskripsi_barang, status, catatan, dibuat_oleh)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        jenis_bantuan_id, nik, kkNo, periode_mulai, periode_selesai || null,
        bentuk, jumlah_uang || null, satuan_uang || 'IDR',
        frekuensi || null, deskripsi_barang || null,
        status || 'aktif', catatan || null, user.id,
      ]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return serverError(err);
  }
}
