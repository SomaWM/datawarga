import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';
import { audit } from '@/lib/audit';

// PUT update status surat
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  // Hanya staff dan dukuh yang bisa update status surat
  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const { status, catatan } = await req.json();

    // Ambil data lama untuk audit
    const oldData = await pool.query(
      'SELECT nomor_surat, jenis_surat, status, pemohon_nama FROM surat WHERE id = $1',
      [id]
    );
    if (oldData.rows.length === 0) {
      return Response.json({ error: 'Surat tidak ditemukan' }, { status: 404 });
    }
    const nilaiLama = oldData.rows[0];

    // Gunakan parameterized query yang benar (tidak interpolate string)
    const tanggal_selesai = status === 'selesai' ? new Date() : null;

    const result = await pool.query(
      `UPDATE surat SET status=$1, catatan=$2, tanggal_selesai=$3 WHERE id=$4 RETURNING *`,
      [status, catatan, tanggal_selesai, id]
    );

    // Audit: status surat berubah — fire-and-forget
    audit(req, user, {
      aksi: 'status_change',
      entitas: 'surat',
      entitas_id: id,
      deskripsi: `Status surat ${nilaiLama.nomor_surat} (${nilaiLama.jenis_surat}): "${nilaiLama.status}" → "${status}"`,
      nilai_lama: { status: nilaiLama.status },
      nilai_baru: { status, catatan },
    });

    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}
