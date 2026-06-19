-- ============================================================
-- MIGRATION: Data Kematian
-- Dukuh Majegan, Pandowoharjo, Sleman, Yogyakarta
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS data_kematian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identitas Jenazah (diambil dari data warga, tapi disimpan apa adanya
    -- agar riwayat tetap utuh walau data warga diubah/dihapus di kemudian hari)
    nik VARCHAR(16) REFERENCES warga(nik) ON DELETE SET NULL,
    no_kk VARCHAR(20),
    nama_lengkap VARCHAR(100) NOT NULL,
    tempat_lahir VARCHAR(50),
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(15) CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    alamat TEXT,

    -- Data Kematian
    tanggal_meninggal DATE NOT NULL,
    usia_jenazah INTEGER,                 -- usia saat meninggal (tahun)
    jam_meninggal TIME,
    tempat_meninggal VARCHAR(20) CHECK (tempat_meninggal IN ('RS', 'Rumah', 'Lainnya')),
    tempat_meninggal_keterangan VARCHAR(150), -- nama RS / keterangan "lainnya"
    penyebab_kematian VARCHAR(20) CHECK (penyebab_kematian IN ('sakit', 'tua', 'virus', 'kecelakaan', 'lainnya')),
    penyebab_kematian_keterangan VARCHAR(150), -- detail penyebab (mis. nama penyakit)
    nama_ibu VARCHAR(100),
    nama_ayah VARCHAR(100),
    lokasi_pemakaman VARCHAR(150),

    catatan TEXT,

    -- Audit
    dibuat_oleh UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kematian_nik ON data_kematian(nik);
CREATE INDEX IF NOT EXISTS idx_kematian_tanggal ON data_kematian(tanggal_meninggal);
CREATE INDEX IF NOT EXISTS idx_kematian_nama ON data_kematian(nama_lengkap);
