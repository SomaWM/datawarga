import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

// PUT update status surat
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const { status, catatan } = await req.json();
    const tanggal_selesai = status === 'selesai' ? 'NOW()' : 'NULL';

    const result = await pool.query(
      `UPDATE surat SET status=$1, catatan=$2, tanggal_selesai=${tanggal_selesai} WHERE id=$3 RETURNING *`,
      [status, catatan, id]
    );
    return Response.json(result.rows[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE surat
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    await pool.query('DELETE FROM surat WHERE id = $1', [id]);
    return Response.json({ message: 'Surat berhasil dihapus' });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
