-- ============================================================
-- MIGRATION: Tambah kolom status_ekonomi ke tabel warga
-- Hanya 3 nilai: mampu, rentan_miskin, miskin
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom (jika belum ada)
ALTER TABLE warga
  ADD COLUMN IF NOT EXISTS status_ekonomi VARCHAR(20) DEFAULT 'mampu';

-- 2. Migrasi nilai lama ke 3 nilai baru
UPDATE warga SET status_ekonomi = 'miskin'       WHERE status_ekonomi IN ('tidak_mampu', 'sangat_miskin');
UPDATE warga SET status_ekonomi = 'mampu'        WHERE status_ekonomi IS NULL OR status_ekonomi = '';

-- 3. Drop constraint lama (jika ada), pasang yang baru
ALTER TABLE warga DROP CONSTRAINT IF EXISTS warga_status_ekonomi_check;
ALTER TABLE warga
  ADD CONSTRAINT warga_status_ekonomi_check
  CHECK (status_ekonomi IN ('mampu', 'rentan_miskin', 'miskin'));

-- 4. Index untuk filter/laporan
CREATE INDEX IF NOT EXISTS idx_warga_status_ekonomi ON warga(status_ekonomi);

-- Verifikasi
SELECT status_ekonomi, COUNT(*) AS jumlah
FROM warga
GROUP BY status_ekonomi
ORDER BY jumlah DESC;
