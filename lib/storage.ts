import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const BUCKET = 'dokumen-warga';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL dan SUPABASE_SERVICE_KEY belum diset di .env.local. ' +
      'Lihat migration_dokumen.sql untuk cara setupnya.'
    );
  }

  _supabase = createClient(url, key);
  return _supabase;
}
