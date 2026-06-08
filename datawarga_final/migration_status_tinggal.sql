-- ============================================================
-- MIGRATION: Update CHECK constraint status_tinggal
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Hapus constraint lama
ALTER TABLE warga DROP CONSTRAINT warga_status_tinggal_check;

-- 2. Migrasi data lama ke nilai baru
UPDATE warga SET status_tinggal = 'domisili_asli'  WHERE status_tinggal = 'tetap';
UPDATE warga SET status_tinggal = 'sementara'      WHERE status_tinggal = 'sementara'; -- tetap sama
UPDATE warga SET status_tinggal = 'non_domisili'   WHERE status_tinggal = 'pindah';
UPDATE warga SET status_tinggal = 'non_domisili'   WHERE status_tinggal = 'meninggal';

-- 3. Tambah constraint baru dengan nilai-nilai baru
ALTER TABLE warga
  ADD CONSTRAINT warga_status_tinggal_check
  CHECK (status_tinggal IN ('domisili_asli', 'non_ktp', 'sementara', 'non_domisili'));

-- 4. Update default value
ALTER TABLE warga ALTER COLUMN status_tinggal SET DEFAULT 'domisili_asli';

-- Verifikasi
SELECT status_tinggal, COUNT(*) as jumlah
FROM warga
GROUP BY status_tinggal;
