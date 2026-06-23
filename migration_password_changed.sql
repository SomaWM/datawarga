-- Migration: Tambah kolom password_changed ke tabel users
-- Menandai apakah user sudah pernah mengganti password default

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Reset password default jika belum diganti (opsional)
-- UPDATE users SET password_changed = FALSE WHERE password_changed IS NULL;
