-- ============================================================
-- MIGRATION: Tambah Alamat KTP & Alamat Domisili di tabel warga
-- Dukuh Majegan, Pandowoharjo, Sleman
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE warga
  ADD COLUMN IF NOT EXISTS alamat_ktp TEXT,
  ADD COLUMN IF NOT EXISTS alamat_domisili TEXT;

COMMENT ON COLUMN warga.alamat_ktp IS 'Alamat sesuai KTP (bisa beda dengan domisili nyata)';
COMMENT ON COLUMN warga.alamat_domisili IS 'Alamat domisili aktual (isi bila beda dengan alamat KTP)';
