import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

/**
 * GET /api/audit
 *
 * Melihat audit log (hanya DUKUH yang berhak).
 *
 * Filter yang didukung:
 *   entitas   : filter by nama entitas (warga, surat, users, dll)
 *   aksi      : filter by aksi (create, update, delete, login, dll)
 *   user_id   : filter by user tertentu
 *   dari      : tanggal mulai (ISO, mis. 2026-06-01)
 *   sampai    : tanggal akhir (ISO)
 *   page, limit: pagination
 */
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  // Hanya DUKUH yang boleh melihat audit log
  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = new URL(req.url);
    const entitas = searchParams.get('entitas');
    const aksi = searchParams.get('aksi');
    const userId = searchParams.get('user_id');
    const dari = searchParams.get('dari');
    const sampai = searchParams.get('sampai');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200); // max 200
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM audit_log WHERE 1=1`;
    const params: any[] = [];
    let i = 1;

    if (entitas) {
      query += ` AND entitas = $${i}`;
      params.push(entitas);
      i++;
    }
    if (aksi) {
      query += ` AND aksi = $${i}`;
      params.push(aksi);
      i++;
    }
    if (userId) {
      query += ` AND user_id = $${i}`;
      params.push(userId);
      i++;
    }
    if (dari) {
      query += ` AND created_at >= $${i}`;
      params.push(dari);
      i++;
    }
    if (sampai) {
      query += ` AND created_at <= $${i}`;
      params.push(`${sampai}T23:59:59`);
      i++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) t`, params);
    query += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
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
