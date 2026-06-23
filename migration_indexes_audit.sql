-- ============================================================
-- MIGRATION: Performance Indexes + Audit Log Table
-- FASE 3.1 - Dukuh Majegan
-- Jalankan di Supabase SQL Editor (aman, idempoten - IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- BAGIAN 1: INDEXES UNTUK PERFORMA QUERY
-- ============================================================

-- --- Tabel Warga ---
-- Index gabungan untuk filter RT/RW (sangat sering dipakai di dashboard & filter)
CREATE INDEX IF NOT EXISTS idx_warga_jenis_kelamin ON warga(jenis_kelamin);
CREATE INDEX IF NOT EXISTS idx_warga_agama ON warga(agama);
CREATE INDEX IF NOT EXISTS idx_warga_status_perkawinan ON warga(status_perkawinan);
CREATE INDEX IF NOT EXISTS idx_warga_status_tinggal ON warga(status_tinggal);
CREATE INDEX IF NOT EXISTS idx_warga_tanggal_lahir ON warga(tanggal_lahir);
CREATE INDEX IF NOT EXISTS idx_warga_pekerjaan ON warga(pekerjaan);
CREATE INDEX IF NOT EXISTS idx_warga_pendidikan ON warga(pendidikan);
CREATE INDEX IF NOT EXISTS idx_warga_status_hubungan ON warga(status_hubungan);

-- Composite index: no_kk + status_hubungan (untuk query "anggota KK aktif")
CREATE INDEX IF NOT EXISTS idx_warga_kk_hubungan ON warga(no_kk, status_hubungan);

-- Composite index: no_kk + status_tinggal (untuk query anggota KK di KK list route)
CREATE INDEX IF NOT EXISTS idx_warga_kk_status_tinggal ON warga(no_kk, status_tinggal);

-- --- Tabel Kepala Keluarga ---
CREATE INDEX IF NOT EXISTS idx_kk_rt ON kepala_keluarga(rt);
CREATE INDEX IF NOT EXISTS idx_kk_rw ON kepala_keluarga(rw);
CREATE INDEX IF NOT EXISTS idx_kk_rt_rw ON kepala_keluarga(rt, rw);
CREATE INDEX IF NOT EXISTS idx_kk_dusun ON kepala_keluarga(dusun);
CREATE INDEX IF NOT EXISTS idx_kk_nama_kepala ON kepala_keluarga(nama_kepala);

-- --- Tabel Surat ---
CREATE INDEX IF NOT EXISTS idx_surat_jenis ON surat(jenis_surat);
CREATE INDEX IF NOT EXISTS idx_surat_tanggal_pengajuan ON surat(tanggal_pengajuan);
CREATE INDEX IF NOT EXISTS idx_surat_tanggal_selesai ON surat(tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_surat_dibuat_oleh ON surat(dibuat_oleh);
-- Composite index: status + tanggal (untuk dashboard "surat pending bulan ini")
CREATE INDEX IF NOT EXISTS idx_surat_status_tanggal ON surat(status, tanggal_pengajuan);
-- Composite index: cek duplikat pengajuan surat (pemohon_nik + jenis_surat + status)
CREATE INDEX IF NOT EXISTS idx_surat_pemohon_jenis_status ON surat(pemohon_nik, jenis_surat, status);
-- Index untuk ORDER BY created_at DESC di list surat
CREATE INDEX IF NOT EXISTS idx_surat_created_at ON surat(created_at DESC);

-- --- Tabel Pengumuman (sebelumnya TIDAK PUNYA index sama sekali) ---
CREATE INDEX IF NOT EXISTS idx_pengumuman_created_at ON pengumuman(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pengumuman_kategori ON pengumuman(kategori);
CREATE INDEX IF NOT EXISTS idx_pengumuman_penting ON pengumuman(penting);
CREATE INDEX IF NOT EXISTS idx_pengumuman_tanggal_aktif ON pengumuman(tanggal_mulai, tanggal_selesai);

-- --- Tabel Kegiatan ---
CREATE INDEX IF NOT EXISTS idx_kegiatan_status ON kegiatan(status);
CREATE INDEX IF NOT EXISTS idx_kegiatan_tanggal ON kegiatan(tanggal);
CREATE INDEX IF NOT EXISTS idx_kegiatan_nama ON kegiatan(nama_kegiatan);

-- --- Tabel Jenis Bantuan ---
CREATE INDEX IF NOT EXISTS idx_jenis_bantuan_kategori ON jenis_bantuan(kategori);
CREATE INDEX IF NOT EXISTS idx_jenis_bantuan_aktif ON jenis_bantuan(aktif);
CREATE INDEX IF NOT EXISTS idx_jenis_bantuan_penyelenggara ON jenis_bantuan(penyelenggara);

-- --- Tabel Bantuan Warga (tambah composite untuk laporan) ---
CREATE INDEX IF NOT EXISTS idx_bantuan_warga_periode_selesai ON bantuan_warga(periode_selesai);
CREATE INDEX IF NOT EXISTS idx_bantuan_warga_nik_status ON bantuan_warga(nik, status);
CREATE INDEX IF NOT EXISTS idx_bantuan_warga_dibuat_oleh ON bantuan_warga(dibuat_oleh);
-- Index untuk ORDER BY created_at DESC di list bantuan warga
CREATE INDEX IF NOT EXISTS idx_bantuan_warga_created_at ON bantuan_warga(created_at DESC);

-- --- Tabel Data Kelahiran (tambah composite) ---
CREATE INDEX IF NOT EXISTS idx_kelahiran_tanggal_jenis_kelamin ON data_kelahiran(tanggal_lahir, jenis_kelamin);
CREATE INDEX IF NOT EXISTS idx_kelahiran_dibuat_oleh ON data_kelahiran(dibuat_oleh);

-- --- Tabel Data Kematian (tambah composite) ---
CREATE INDEX IF NOT EXISTS idx_kematian_tanggal_penyebab ON data_kematian(tanggal_meninggal, penyebab_kematian);
CREATE INDEX IF NOT EXISTS idx_kematian_no_kk ON data_kematian(no_kk);
CREATE INDEX IF NOT EXISTS idx_kematian_dibuat_oleh ON data_kematian(dibuat_oleh);

-- --- Tabel Users ---
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- BAGIAN 2: TABEL AUDIT LOG
-- Mencatat semua aksi tulis (INSERT/UPDATE/DELETE) yang sensitif
-- Hanya INSERT, tidak pernah UPDATE/DELETE (immutable log)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Siapa yang melakukan aksi
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),                    -- snapshot username (jaga-jaga user dihapus)
    role VARCHAR(20),                        -- snapshot role saat aksi
    -- Apa yang dilakukan
    aksi VARCHAR(20) NOT NULL CHECK (aksi IN ('create', 'update', 'delete', 'login', 'logout', 'login_failed', 'status_change')),
    entitas VARCHAR(50) NOT NULL,            -- nama tabel/entitas: 'warga', 'surat', 'users', dll
    entitas_id VARCHAR(100),                 -- ID record yang diubah (UUID atau NIK)
    -- Detail perubahan
    deskripsi TEXT,                          -- ringkasan aksi yang dibaca manusia
    nilai_lama JSONB,                        -- snapshot data sebelum perubahan (untuk update/delete)
    nilai_baru JSONB,                        -- snapshot data setelah perubahan (untuk create/update)
    ip_address VARCHAR(45),                  -- IPv4 atau IPv6
    user_agent TEXT,                         -- browser/OS info
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index untuk audit log (queries yang sering dipakai)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entitas ON audit_log(entitas);
CREATE INDEX IF NOT EXISTS idx_audit_log_entitas_id ON audit_log(entitas_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_aksi ON audit_log(aksi);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Comment untuk dokumentasi
COMMENT ON TABLE audit_log IS 'Log immutable semua aksi tulis sensitif. Jangan pernah UPDATE/DELETE baris di tabel ini.';
COMMENT ON COLUMN audit_log.nilai_lama IS 'Snapshot JSON data sebelum perubahan (untuk update/delete)';
COMMENT ON COLUMN audit_log.nilai_baru IS 'Snapshot JSON data setelah perubahan (untuk create/update)';

-- ============================================================
-- BAGIAN 3: FIX DATA — Perbaiki status_tinggal 'tetap' → 'domisili_asli'
-- Jalankan HANYA sekali. Aman karena idempoten (WHERE status_tinggal = 'tetap').
-- ============================================================
UPDATE warga SET status_tinggal = 'domisili_asli'
WHERE status_tinggal = 'tetap'
AND NOT EXISTS (
    SELECT 1 FROM warga w2
    WHERE w2.nik = warga.nik AND w2.status_tinggal = 'domisili_asli'
);

-- ============================================================
-- VERIFIKASI
-- ============================================================
-- Cek total index sekarang
SELECT
    schemaname AS schema,
    tablename AS tabel,
    COUNT(*) AS jumlah_index
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tabel, jumlah_index DESC;
