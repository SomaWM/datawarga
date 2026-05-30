import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getSupabase, BUCKET } from '@/lib/storage';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const formData = await req.formData();
    const nik = formData.get('nik') as string;
    const tipe = formData.get('tipe') as string;
    const file = formData.get('file') as File;

    if (!nik || !tipe || !file)
      return Response.json({ error: 'NIK, tipe, dan file wajib diisi' }, { status: 400 });

    if (!['ktp', 'kk'].includes(tipe))
      return Response.json({ error: 'Tipe harus ktp atau kk' }, { status: 400 });

    const cekWarga = await pool.query('SELECT id, nama_lengkap FROM warga WHERE nik = $1', [nik]);
    if (cekWarga.rows.length === 0)
      return Response.json({ error: 'NIK tidak ditemukan' }, { status: 404 });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type))
      return Response.json({ error: 'Format file harus JPG, PNG, WEBP, atau PDF' }, { status: 400 });

    if (file.size > 5 * 1024 * 1024)
      return Response.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const path = `${nik}/foto_${tipe}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const kolom = tipe === 'ktp' ? 'foto_ktp' : 'foto_kk';
    await pool.query(`UPDATE warga SET ${kolom} = $1, updated_at = NOW() WHERE nik = $2`, [path, nik]);

    return Response.json({
      sukses: true,
      pesan: `Foto ${tipe.toUpperCase()} berhasil diupload`,
      path,
      nama: cekWarga.rows[0].nama_lengkap,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return Response.json({ error: err.message || 'Gagal upload file' }, { status: 500 });
  }
}
