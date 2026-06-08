-- Schema Database Sistem Administrasi Dukuh Majegan
-- Pandowoharjo, Sleman, Yogyakarta

-- Tabel Users (Login)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('dukuh', 'staff', 'warga')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Kepala Keluarga
CREATE TABLE IF NOT EXISTS kepala_keluarga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_kk VARCHAR(20) UNIQUE NOT NULL,
    nama_kepala VARCHAR(100) NOT NULL,
    alamat TEXT NOT NULL,
    rt VARCHAR(5),
    rw VARCHAR(5),
    dusun VARCHAR(50) DEFAULT 'Majegan',
    desa VARCHAR(50) DEFAULT 'Pandowoharjo',
    kecamatan VARCHAR(50) DEFAULT 'Sleman',
    kabupaten VARCHAR(50) DEFAULT 'Sleman',
    provinsi VARCHAR(50) DEFAULT 'Daerah Istimewa Yogyakarta',
    telepon VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Warga (Anggota Keluarga)
CREATE TABLE IF NOT EXISTS warga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik VARCHAR(16) UNIQUE NOT NULL,
    no_kk VARCHAR(20) REFERENCES kepala_keluarga(no_kk),
    nama_lengkap VARCHAR(100) NOT NULL,
    tempat_lahir VARCHAR(50),
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(15) CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    agama VARCHAR(20),
    pendidikan VARCHAR(50),
    pekerjaan VARCHAR(50),
    status_perkawinan VARCHAR(20),
    status_hubungan VARCHAR(30),
    kewarganegaraan VARCHAR(30) DEFAULT 'WNI',
    golongan_darah VARCHAR(5),
    telepon VARCHAR(20),
    email VARCHAR(100),
    foto VARCHAR(255),
    status_tinggal VARCHAR(20) DEFAULT 'tetap' CHECK (status_tinggal IN ('tetap', 'sementara', 'pindah', 'meninggal')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Surat
CREATE TABLE IF NOT EXISTS surat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_surat VARCHAR(50) UNIQUE NOT NULL,
    jenis_surat VARCHAR(50) NOT NULL,
    perihal TEXT,
    pemohon_nik VARCHAR(16) REFERENCES warga(nik),
    pemohon_nama VARCHAR(100),
    keperluan TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'diproses', 'selesai', 'ditolak')),
    catatan TEXT,
    tanggal_pengajuan TIMESTAMP DEFAULT NOW(),
    tanggal_selesai TIMESTAMP,
    dibuat_oleh UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Pengumuman
CREATE TABLE IF NOT EXISTS pengumuman (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul VARCHAR(200) NOT NULL,
    isi TEXT NOT NULL,
    kategori VARCHAR(50) DEFAULT 'umum',
    penting BOOLEAN DEFAULT FALSE,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    dibuat_oleh UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Kegiatan
CREATE TABLE IF NOT EXISTS kegiatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kegiatan VARCHAR(200) NOT NULL,
    deskripsi TEXT,
    tanggal DATE NOT NULL,
    waktu TIME,
    lokasi VARCHAR(200),
    penanggung_jawab VARCHAR(100),
    status VARCHAR(20) DEFAULT 'rencana' CHECK (status IN ('rencana', 'berlangsung', 'selesai', 'batal')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert user default (dukuh)
INSERT INTO users (username, password, nama_lengkap, role) 
VALUES ('dukuh', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kepala Dukuh Majegan', 'dukuh')
ON CONFLICT (username) DO NOTHING;
-- password default: "password"

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_warga_nik ON warga(nik);
CREATE INDEX IF NOT EXISTS idx_warga_kk ON warga(no_kk);
CREATE INDEX IF NOT EXISTS idx_surat_status ON surat(status);
CREATE INDEX IF NOT EXISTS idx_surat_pemohon ON surat(pemohon_nik);
