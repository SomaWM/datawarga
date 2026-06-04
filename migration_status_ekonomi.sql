-- ============================================================
-- MIGRATION: Tambah kolom status_ekonomi ke tabel warga
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom status_ekonomi (jika belum ada)
ALTER TABLE warga
  ADD COLUMN IF NOT EXISTS status_ekonomi VARCHAR(20) DEFAULT 'mampu';

-- 2. Tambah CHECK constraint
ALTER TABLE warga
  DROP CONSTRAINT IF EXISTS warga_status_ekonomi_check;

ALTER TABLE warga
  ADD CONSTRAINT warga_status_ekonomi_check
  CHECK (status_ekonomi IN ('mampu', 'rentan_miskin', 'tidak_mampu', 'miskin', 'sangat_miskin'));

-- 3. Set nilai default untuk data lama yang NULL
UPDATE warga
  SET status_ekonomi = 'mampu'
  WHERE status_ekonomi IS NULL;

-- 4. Tambah index untuk performa filter/laporan
CREATE INDEX IF NOT EXISTS idx_warga_status_ekonomi ON warga(status_ekonomi);

-- Verifikasi
SELECT status_ekonomi, COUNT(*) AS jumlah
FROM warga
GROUP BY status_ekonomi
ORDER BY jumlah DESC;
