/**
 * Audit Log Helper
 *
 * Mencatat semua aksi sensitif ke tabel audit_log.
 * Fire-and-forget: tidak blocking response utama, error di-silent
 * (jangan sampai audit log gagal mengganggu operasi user).
 *
 * Cara pakai di API route:
 *   import { audit } from '@/lib/audit';
 *   await audit(req, user, { aksi: 'create', entitas: 'warga', ... });
 */

import { NextRequest } from 'next/server';
import type { JWTPayload } from '@/lib/auth';
import pool from '@/lib/db';

export type AksiAudit =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'status_change';

export interface AuditInput {
  aksi: AksiAudit;
  entitas: string; // 'warga', 'surat', 'users', 'kk', 'bantuan_warga', dll
  entitas_id?: string | number | null;
  deskripsi?: string;
  nilai_lama?: Record<string, any> | null;
  nilai_baru?: Record<string, any> | null;
}

/**
 * Catat audit log ke database.
 *
 * @param req NextRequest (untuk ambil IP & user-agent)
 * @param user Payload JWT user yang melakukan aksi (bisa null untuk aksi publik)
 * @param input Detail aksi yang akan dicatat
 *
 * Fire-and-forget: return void, error di-log tapi tidak di-throw.
 * Aman dipanggil setelah response utama dikirim.
 */
export async function audit(
  req: NextRequest | null,
  user: JWTPayload | null,
  input: AuditInput
): Promise<void> {
  try {
    // Ambil IP address (support x-forwarded-for dari Vercel/proxy)
    const forwarded = req?.headers.get('x-forwarded-for');
    const realIp = req?.headers.get('x-real-ip');
    const ip =
      forwarded?.split(',')[0]?.trim() ||
      realIp ||
      req?.headers.get('x-client-ip') ||
      null;

    const userAgent = req?.headers.get('user-agent') || null;

    await pool.query(
      `INSERT INTO audit_log
        (user_id, username, role, aksi, entitas, entitas_id,
         deskripsi, nilai_lama, nilai_baru, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        user?.id || null,
        user?.username || null,
        user?.role || null,
        input.aksi,
        input.entitas,
        input.entitas_id ? String(input.entitas_id) : null,
        input.deskripsi || null,
        input.nilai_lama ? JSON.stringify(input.nilai_lama) : null,
        input.nilai_baru ? JSON.stringify(input.nilai_baru) : null,
        ip,
        userAgent,
      ]
    );
  } catch (err) {
    // Silent fail: jangan sampai error audit mengganggu operasi utama
    console.error('[AUDIT LOG ERROR]', err);
  }
}

/**
 * Variasi audit tanpa request object (untuk konteks non-request, mis. cron/job).
 */
export async function auditSystem(input: AuditInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log
        (user_id, username, role, aksi, entitas, entitas_id,
         deskripsi, nilai_lama, nilai_baru, ip_address, user_agent)
       VALUES (NULL, 'system', 'system', $1, $2, $3, $4, $5, $6, NULL, NULL)`,
      [
        input.aksi,
        input.entitas,
        input.entitas_id ? String(input.entitas_id) : null,
        input.deskripsi || null,
        input.nilai_lama ? JSON.stringify(input.nilai_lama) : null,
        input.nilai_baru ? JSON.stringify(input.nilai_baru) : null,
      ]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
}
