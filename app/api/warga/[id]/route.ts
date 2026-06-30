import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';
import { audit } from '@/lib/audit';

// GET warga by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT w.*, kk.alamat, kk.rt, kk.rw, kk.dusun 
       FROM warga w LEFT JOIN kepala_keluarga kk ON w.no_kk = kk.no_kk 
       WHERE w.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return Response.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return serverError(err);
  }
}

// PUT update warga
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const {
      nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
      pendidikan, pekerjaan, status_perkawinan, status_hubungan, golongan_darah,
      telepon, email, status_tinggal, status_ekonomi, alamat_ktp, alamat_domisili,
    } = await req.json();

    // Ambil data lama untuk audit (sebelum update)
    const oldData = await pool.query(
      'SELECT nama_lengkap, nik, status_tinggal, status_ekonomi FROM warga WHERE id = $1',
      [id]
    );
    const nilaiLama = oldData.rows[0] || null;

    const result = await pool.query(
      `UPDATE warga SET nama_lengkap=$1, tempat_lahir=$2, tanggal_lahir=$3, jenis_kelamin=$4,
        agama=$5, pendidikan=$6, pekerjaan=$7, status_perkawinan=$8, status_hubungan=$9,
        golongan_darah=$10, telepon=$11, email=$12, status_tinggal=$13, status_ekonomi=$14,
        alamat_ktp=$15, alamat_domisili=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pendidikan,
        pekerjaan, status_perkawinan, status_hubungan, golongan_darah, telepon, email,
        status_tinggal, status_ekonomi || 'mampu',
        alamat_ktp || null, alamat_domisili || null, id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    }

    const updated = result.rows[0];
    // Audit: update warga — fire-and-forget
    audit(req, user, {
      aksi: 'update',
      entitas: 'warga',
      entitas_id: id,
      deskripsi: `Update data warga: ${updated.nama_lengkap} (NIK: ${updated.nik})`,
      nilai_lama: nilaiLama,
      nilai_baru: { nama_lengkap, status_tinggal, status_ekonomi },
    });

    return Response.json(updated);
  } catch (err: any) {
    return serverError(err);
  }
}

// DELETE warga
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  // Hanya dukuh yang bisa hapus data warga
  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    // Ambil data lama untuk audit (sebelum delete)
    const oldData = await pool.query(
      'SELECT nama_lengkap, nik FROM warga WHERE id = $1',
      [id]
    );
    if (oldData.rows.length === 0) {
      return Response.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    }
    const nilaiLama = oldData.rows[0];

    await pool.query('DELETE FROM warga WHERE id = $1', [id]);

    // Audit: delete warga — fire-and-forget
    audit(req, user, {
      aksi: 'delete',
      entitas: 'warga',
      entitas_id: id,
      deskripsi: `Hapus data warga: ${nilaiLama.nama_lengkap} (NIK: ${nilaiLama.nik})`,
      nilai_lama: nilaiLama,
    });

    return Response.json({ message: 'Data warga berhasil dihapus' });
  } catch (err: any) {
    return serverError(err);
  }
}
