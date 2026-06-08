-- ============================================================
-- MIGRATION: Tambah kolom foto_ktp dan foto_kk di tabel warga
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom foto (skip jika sudah ada)
ALTER TABLE warga
  ADD COLUMN IF NOT EXISTS foto_ktp VARCHAR(255),
  ADD COLUMN IF NOT EXISTS foto_kk  VARCHAR(255);

-- 2. Verifikasi kolom berhasil ditambah
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'warga'
  AND column_name IN ('foto_ktp', 'foto_kk');


-- ============================================================
-- SETUP SUPABASE STORAGE (lakukan via Supabase Dashboard)
-- ============================================================
-- 1. Buka: Supabase Dashboard → Storage → New Bucket
-- 2. Nama bucket: dokumen-warga
-- 3. Centang: Private bucket (JANGAN public)
-- 4. Klik Create Bucket
--
-- 5. Buka: Settings → API → ambil nilai "service_role" key
-- 6. Tambahkan ke file .env.local:
--    SUPABASE_URL=https://[project-ref].supabase.co
--    SUPABASE_SERVICE_KEY=[service_role_key]
--
-- PENTING: Gunakan service_role key (bukan anon key)
-- agar bisa upload/download file private
-- ============================================================
