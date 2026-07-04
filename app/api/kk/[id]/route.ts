import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';
import { audit } from '@/lib/audit';

// PUT update KK
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const { nama_kepala, alamat, rt, rw, telepon } = await req.json();
    const result = await pool.query(
      `UPDATE kepala_keluarga SET nama_kepala=$1, alamat=$2, rt=$3, rw=$4, telepon=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [nama_kepala, alamat, rt, rw, telepon, id]
    );
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}

// DELETE KK beserta seluruh warga anggotanya (satu KK = satu no_kk)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  // Hanya dukuh yang bisa hapus KK (sama seperti hapus data warga)
  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  const client = await pool.connect();
  try {
    const { id } = await params;

    await client.query('BEGIN');

    // Ambil data KK dulu (id bisa berupa UUID pk)
    const kkResult = await client.query(
      'SELECT * FROM kepala_keluarga WHERE id = $1',
      [id]
    );
    if (kkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return Response.json({ error: 'KK tidak ditemukan' }, { status: 404 });
    }
    const kk = kkResult.rows[0];

    // Ambil daftar warga yang akan ikut terhapus (untuk audit)
    const wargaResult = await client.query(
      'SELECT id, nama_lengkap, nik FROM warga WHERE no_kk = $1',
      [kk.no_kk]
    );

    // Hapus semua warga dengan no_kk yang sama terlebih dahulu
    await client.query('DELETE FROM warga WHERE no_kk = $1', [kk.no_kk]);

    // Baru hapus KK-nya
    await client.query('DELETE FROM kepala_keluarga WHERE id = $1', [id]);

    await client.query('COMMIT');

    // Audit: delete KK — fire-and-forget
    audit(req, user, {
      aksi: 'delete',
      entitas: 'kk',
      entitas_id: id,
      deskripsi: `Hapus KK: ${kk.nama_kepala} (No. KK: ${kk.no_kk}), beserta ${wargaResult.rows.length} anggota warga`,
      nilai_lama: { kk, anggota: wargaResult.rows },
    });

    return Response.json({
      message: 'KK dan seluruh anggota warga berhasil dihapus',
      jumlah_warga_terhapus: wargaResult.rows.length,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return serverError(err);
  } finally {
    client.release();
  }
}
