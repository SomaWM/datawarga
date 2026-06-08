# 🏛️ Sistem Administrasi Dukuh Majegan
### Pandowoharjo, Sleman, D.I. Yogyakarta

Aplikasi web untuk pengelolaan administrasi dukuh, meliputi data warga, kartu keluarga, surat-menyurat, pengumuman, dan kegiatan dukuh.

---

## 📋 Fitur

- **Dashboard** — Statistik warga, KK, dan surat
- **Kartu Keluarga** — Kelola data KK (tambah, edit, hapus)
- **Data Warga** — Pendataan warga lengkap (NIK, biodata, dll)
- **Surat & Izin** — Buat & kelola surat (SKD, SKTM, SKU, dll)
- **Pengumuman** — Buat pengumuman untuk warga
- **Kegiatan** — Jadwal kegiatan dukuh
- **Cetak Surat** — Preview & cetak surat langsung dari browser

---

## 🚀 Cara Instalasi

### 1. Persiapkan PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib

# Buat database
sudo -u postgres psql
CREATE DATABASE desa_majegan;
CREATE USER desa_user WITH PASSWORD 'password_anda';
GRANT ALL PRIVILEGES ON DATABASE desa_majegan TO desa_user;
\q

# Jalankan schema
psql -U desa_user -d desa_majegan -f backend/schema.sql
```

### 2. Konfigurasi Environment

```bash
cd backend
cp .env.example .env
# Edit .env sesuai konfigurasi database Anda:
nano .env
```

Isi `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=desa_majegan
DB_USER=desa_user
DB_PASSWORD=password_anda
JWT_SECRET=ganti_dengan_kode_rahasia_anda
PORT=3000
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Jalankan Server

```bash
npm start
```

Buka browser: **http://localhost:3000**

---

## 🔐 Login Default

| Field | Nilai |
|-------|-------|
| Username | `dukuh` |
| Password | `password` |

> ⚠️ **Ganti password setelah pertama kali login!**

---

## 📁 Struktur Folder

```
desa-majegan/
├── backend/
│   ├── routes/
│   │   ├── auth.js       # Login & autentikasi
│   │   ├── warga.js      # CRUD data warga
│   │   ├── kk.js         # CRUD kartu keluarga
│   │   ├── surat.js      # Manajemen surat
│   │   └── info.js       # Pengumuman & kegiatan
│   ├── middleware/
│   │   └── auth.js       # JWT middleware
│   ├── db.js             # Koneksi PostgreSQL
│   ├── server.js         # Entry point Express
│   ├── schema.sql        # Schema database
│   └── .env.example      # Template konfigurasi
└── frontend/
    └── index.html        # Aplikasi frontend (SPA)
```

---

## 📄 Jenis Surat yang Didukung

- Surat Keterangan Domisili (SKD)
- Surat Keterangan Tidak Mampu (SKTM)
- Surat Keterangan Usaha (SKU)
- Surat Keterangan Kelahiran (SKK)
- Surat Keterangan Kematian
- Surat Izin Keramaian (SIK)
- Surat Pengantar (SP)
- Surat Pemberitahuan (SPB)

Nomor surat dibuat **otomatis** dengan format: `001/SKD/MAJ/05/2025`

---

## 🛠️ Teknologi

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Auth**: JWT (JSON Web Token)
- **Frontend**: HTML/CSS/JavaScript (Vanilla, tanpa framework)

---

## 📞 Dukungan

Dibuat untuk Dukuh Majegan, Pandowoharjo, Sleman, DIY.
