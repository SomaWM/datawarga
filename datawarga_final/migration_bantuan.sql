-- Migration: Sistem Bantuan Pemerintah
-- Dukuh Majegan, Pandowoharjo, Sleman, Yogyakarta

-- Tabel Master Jenis Bantuan
CREATE TABLE IF NOT EXISTS jenis_bantuan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(150) NOT NULL,
    penyelenggara VARCHAR(100),         -- Kemensos, Pemda DIY, Pemkab Sleman, dll
    kategori VARCHAR(50),               -- sembako, tunai, kesehatan, pendidikan, dll
    deskripsi TEXT,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Bantuan Warga (penerima bantuan per periode)
CREATE TABLE IF NOT EXISTS bantuan_warga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis_bantuan_id UUID NOT NULL REFERENCES jenis_bantuan(id) ON DELETE RESTRICT,
    nik VARCHAR(16) NOT NULL REFERENCES warga(nik) ON DELETE CASCADE,
    no_kk VARCHAR(20) REFERENCES kepala_keluarga(no_kk),
    -- Periode bantuan
    periode_mulai DATE NOT NULL,
    periode_selesai DATE,
    -- Detail bantuan
    bentuk VARCHAR(20) NOT NULL CHECK (bentuk IN ('uang', 'barang', 'campuran')),
    jumlah_uang NUMERIC(15,2),          -- jika bentuk = uang / campuran
    satuan_uang VARCHAR(20) DEFAULT 'IDR',
    frekuensi VARCHAR(30),              -- bulanan, triwulan, sekali, dst
    deskripsi_barang TEXT,              -- jika bentuk = barang / campuran
    -- Status
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai', 'ditangguhkan', 'tidak_layak')),
    catatan TEXT,
    -- Audit
    dibuat_oleh UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index performa
CREATE INDEX IF NOT EXISTS idx_bantuan_warga_nik ON bantuan_warga(nik);
CREATE INDEX IF NOT EXISTS idx_bantuan_warga_jenis ON bantuan_warga(jenis_bantuan_id);
CREATE INDEX IF NOT EXISTS idx_bantuan_warga_status ON bantuan_warga(status);
CREATE INDEX IF NOT EXISTS idx_bantuan_warga_periode ON bantuan_warga(periode_mulai);

-- ============================================================
-- DATA AWAL: Daftar Bantuan Pemerintah Indonesia
-- ============================================================
INSERT INTO jenis_bantuan (kode, nama, penyelenggara, kategori, deskripsi) VALUES
-- Bantuan Pusat / Kemensos
('PKH',       'Program Keluarga Harapan (PKH)',                'Kemensos RI',          'tunai',      'Bantuan sosial bersyarat untuk keluarga miskin/rentan miskin'),
('BPNT',      'Bantuan Pangan Non-Tunai (BPNT) / Sembako',    'Kemensos RI',          'sembako',    'Bantuan sembako melalui Kartu Sembako senilai Rp200.000/bulan'),
('BST',       'Bantuan Sosial Tunai (BST)',                    'Kemensos RI',          'tunai',      'Bantuan tunai untuk keluarga terdampak'),
('BLT-DD',    'BLT Dana Desa',                                 'Kemendes PDTT',        'tunai',      'Bantuan Langsung Tunai bersumber dari Dana Desa'),
('BLT-BBM',   'BLT Subsidi BBM',                               'Kemensos RI',          'tunai',      'Bantuan tunai kompensasi kenaikan harga BBM'),
('BNPT',      'Bantuan Nelayan Perikanan Tangkap',             'KKP',                  'tunai',      'Bantuan untuk nelayan terdampak'),
('PIP-SD',    'Program Indonesia Pintar – SD',                 'Kemendikbud',          'pendidikan', 'Bantuan tunai pendidikan untuk siswa SD/sederajat'),
('PIP-SMP',   'Program Indonesia Pintar – SMP',                'Kemendikbud',          'pendidikan', 'Bantuan tunai pendidikan untuk siswa SMP/sederajat'),
('PIP-SMA',   'Program Indonesia Pintar – SMA/SMK',            'Kemendikbud',          'pendidikan', 'Bantuan tunai pendidikan untuk siswa SMA/SMK/sederajat'),
('KIP-KULIAH','KIP Kuliah',                                    'Kemendikbud',          'pendidikan', 'Bantuan biaya kuliah dan biaya hidup mahasiswa'),
('JKN-PBI',   'JKN / BPJS Kesehatan PBI',                     'Kemenkes RI',          'kesehatan',  'Jaminan Kesehatan Nasional untuk fakir miskin ditanggung APBN'),
('BPR',       'Bantuan Premi Asuransi Usahatani',              'Kementan',             'pertanian',  'Subsidi premi asuransi untuk petani'),
('AUTP',      'Asuransi Usaha Tani Padi (AUTP)',               'Kementan',             'pertanian',  'Perlindungan kerugian usaha tani padi'),
('KUR',       'Kredit Usaha Rakyat (KUR)',                     'Kemenkeu / Bank',      'modal_usaha','Kredit bersubsidi untuk UMKM dengan bunga rendah'),
('BPUM',      'Bantuan Produktif Usaha Mikro (BPUM)',          'Kemenkop UKM',         'modal_usaha','Bantuan langsung tunai untuk usaha mikro'),
('RUTILAHU',  'Rehabilitasi Rumah Tidak Layak Huni',           'Kemen PUPR',           'perumahan',  'Bantuan perbaikan rumah tidak layak huni'),
('BSPS',      'Bantuan Stimulan Perumahan Swadaya (BSPS)',     'Kemen PUPR',           'perumahan',  'Stimulan perbaikan/pembangunan rumah swadaya'),
-- Bantuan Provinsi DIY
('KPRL-DIY',  'Kartu Pelajar Istimewa (KPI) DIY',             'Pemda DIY',            'pendidikan', 'Bantuan pendidikan dari Pemerintah Provinsi DIY'),
('BPNT-DIY',  'Bantuan Pangan Daerah DIY',                    'Pemda DIY',            'sembako',    'Bantuan pangan tambahan dari APBD Provinsi DIY'),
('JKN-JAMKESDA','Jamkesda / KIS Daerah',                       'Pemda DIY / Pemkab',   'kesehatan',  'Jaminan kesehatan daerah untuk yang belum ter-cover JKN'),
-- Bantuan Kabupaten Sleman
('RTLH-SLM',  'Bantuan RTLH Kabupaten Sleman',                'Pemkab Sleman',        'perumahan',  'Rehabilitasi rumah tidak layak huni dari APBD Sleman'),
('BSM-SLM',   'Bantuan Sosial Masyarakat Sleman',             'Pemkab Sleman',        'tunai',      'Bantuan sosial tunai dari APBD Kabupaten Sleman'),
('BPNT-SLM',  'Bantuan Pangan Kabupaten Sleman',              'Pemkab Sleman',        'sembako',    'Paket sembako dari Dinas Sosial Kabupaten Sleman'),
('LANSIA-SLM','Bantuan Lansia Sleman',                         'Pemkab Sleman',        'tunai',      'Bantuan sosial khusus lanjut usia dari Pemkab Sleman'),
('DISABILITAS','Bantuan Penyandang Disabilitas',               'Pemkab Sleman',        'tunai',      'Bantuan sosial untuk penyandang disabilitas')
ON CONFLICT (kode) DO NOTHING;
