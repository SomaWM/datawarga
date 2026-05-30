import { NextRequest } from 'next/server';
import { supabase, BUCKET } from '@/lib/storage';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path)
      return Response.json({ error: 'Path file wajib diisi' }, { status: 400 });

    // Generate signed URL berlaku 60 menit
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600);

    if (error) throw error;

    return Response.json({ url: data.signedUrl });
  } catch (err: any) {
    return Response.json({ error: 'File tidak ditemukan atau gagal diakses' }, { status: 404 });
  }
}
