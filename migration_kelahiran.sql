-- ============================================================
-- MIGRATION: Data Kelahiran
-- Dukuh Majegan, Pandowoharjo, Sleman, Yogyakarta
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS data_kelahiran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identitas Orang Tua (diambil dari data warga, disimpan apa adanya
    -- agar riwayat tetap utuh walau data warga diubah/dihapus di kemudian hari)
    no_kk VARCHAR(20),
    nama_ibu VARCHAR(100),
    nik_ibu VARCHAR(16) REFERENCES warga(nik) ON DELETE SET NULL,
    nama_ayah VARCHAR(100),
    nik_ayah VARCHAR(16) REFERENCES warga(nik) ON DELETE SET NULL,
    alamat TEXT,

    -- Data Kelahiran
    nama_bayi VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jam_lahir TIME,
    jenis_kelamin VARCHAR(15) CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    berat_lahir NUMERIC(5,2),             -- kg
    tinggi_lahir NUMERIC(5,2),            -- cm
    tempat_lahir VARCHAR(20) CHECK (tempat_lahir IN ('RS', 'Puskesmas', 'Bidan', 'Lainnya')),
    tempat_lahir_keterangan VARCHAR(150), -- nama RS/Puskesmas/Bidan atau keterangan "lainnya"

    catatan TEXT,

    -- Audit
    dibuat_oleh UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kelahiran_nik_ibu ON data_kelahiran(nik_ibu);
CREATE INDEX IF NOT EXISTS idx_kelahiran_nik_ayah ON data_kelahiran(nik_ayah);
CREATE INDEX IF NOT EXISTS idx_kelahiran_no_kk ON data_kelahiran(no_kk);
CREATE INDEX IF NOT EXISTS idx_kelahiran_tanggal ON data_kelahiran(tanggal_lahir);
CREATE INDEX IF NOT EXISTS idx_kelahiran_nama_bayi ON data_kelahiran(nama_bayi);
