import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError } from '@/lib/auth';

function normalizeStatus(val: string): string {
  const map: Record<string, string> = {
    'tetap': 'domisili_asli',
    'domisili_asli': 'domisili_asli',
    'non_ktp': 'non_ktp',
    'sementara': 'sementara',
    'penduduk sementara': 'sementara',
    'non_domisili': 'non_domisili',
    'pindah': 'non_domisili',
    'meninggal': 'non_domisili',
  };
  return map[val?.toLowerCase()?.trim()] || 'domisili_asli';
}

function normalizeEkonomi(val: string): string {
  const map: Record<string, string> = {
    'mampu': 'mampu',
    'kaya': 'mampu',
    'rentan miskin': 'rentan_miskin',
    'rentan_miskin': 'rentan_miskin',
    'hampir miskin': 'rentan_miskin',
    'tidak mampu': 'miskin',
    'tidak_mampu': 'miskin',
    'miskin': 'miskin',
    'sangat miskin': 'miskin',
    'sangat_miskin': 'miskin',
    'fakir miskin': 'miskin',
  };
  return map[val?.toLowerCase()?.trim()] || 'mampu';
}

function str(val: any): string | null {
  if (val === undefined || val === null || val === '') return null;
  return String(val).trim();
}

function parseDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return null;
}

export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  // Hanya dukuh yang bisa import data
  const roleCheck = requireRole(user, 'dukuh');
  if (roleCheck) return roleCheck;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sheet = (formData.get('sheet') as string) || 'Data Warga';

    if (!file) return Response.json({ error: 'File tidak ditemukan' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });

    if (!wb.SheetNames.includes(sheet)) {
      return Response.json({
        error: `Sheet "${sheet}" tidak ditemukan. Sheet tersedia: ${wb.SheetNames.join(', ')}`
      }, { status: 400 });
    }

    const ws = wb.Sheets[sheet];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', range: 2 });

    if (!rows.length) return Response.json({ error: 'Tidak ada data di sheet' }, { status: 400 });

    const hasil = { berhasil: 0, gagal: 0, dilewati: 0, errors: [] as string[] };

    // ── IMPORT DATA KK ──────────────────────────────────────────
    if (sheet === 'Data KK') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const no_kk = str(r['NO_KK *'] || r['NO_KK'] || r['no_kk']);
        const nama_kepala = str(r['NAMA_KEPALA *'] || r['NAMA_KEPALA'] || r['nama_kepala']);
        const alamat = str(r['ALAMAT *'] || r['ALAMAT'] || r['alamat']);

        if (!no_kk && !nama_kepala) { hasil.dilewati++; continue; }
        if (!no_kk || !/^\d{16}$/.test(no_kk)) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4}: NO_KK "${no_kk}" tidak valid (harus 16 digit)`);
          continue;
        }
        if (!nama_kepala) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4}: NAMA_KEPALA kosong`);
          continue;
        }
        if (!alamat) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4}: ALAMAT kosong`);
          continue;
        }

        try {
          await pool.query(
            `INSERT INTO kepala_keluarga (no_kk, nama_kepala, alamat, rt, rw, dusun, telepon)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (no_kk) DO UPDATE SET
               nama_kepala = EXCLUDED.nama_kepala,
               alamat = EXCLUDED.alamat,
               rt = EXCLUDED.rt,
               rw = EXCLUDED.rw,
               dusun = EXCLUDED.dusun,
               telepon = EXCLUDED.telepon,
               updated_at = NOW()`,
            [no_kk, nama_kepala, alamat,
             str(r['RT'] || r['rt']),
             str(r['RW'] || r['rw']),
             str(r['DUSUN'] || r['dusun']) || 'Majegan',
             str(r['TELEPON'] || r['telepon'])]
          );
          hasil.berhasil++;
        } catch (err: any) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4} (${no_kk}): ${err.message}`);
        }
      }
    }

    // ── IMPORT DATA WARGA ────────────────────────────────────────
    else if (sheet === 'Data Warga') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const nik = str(r['NIK *'] || r['NIK'] || r['nik']);
        const no_kk = str(r['NO_KK *'] || r['NO_KK'] || r['no_kk']);
        const nama = str(r['NAMA_LENGKAP *'] || r['NAMA_LENGKAP'] || r['nama_lengkap']);

        if (!nik && !nama) { hasil.dilewati++; continue; }
        if (!nik || !/^\d{16}$/.test(nik)) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4}: NIK "${nik}" tidak valid (harus 16 digit)`);
          continue;
        }
        if (!no_kk) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4} (${nik}): NO_KK kosong`);
          continue;
        }
        if (!nama) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4} (${nik}): NAMA_LENGKAP kosong`);
          continue;
        }

        const kkCek = await pool.query('SELECT no_kk FROM kepala_keluarga WHERE no_kk = $1', [no_kk]);
        if (!kkCek.rows.length) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4} (${nik}): NO_KK ${no_kk} belum terdaftar di database`);
          continue;
        }

        const tglLahir = parseDate(r['TANGGAL_LAHIR'] || r['tanggal_lahir']);
        const statusTinggal = normalizeStatus(str(r['STATUS_TINGGAL *'] || r['STATUS_TINGGAL'] || r['status_tinggal']) || '');
        const statusEkonomi = normalizeEkonomi(str(r['STATUS_EKONOMI'] || r['status_ekonomi']) || '');

        try {
          await pool.query(
            `INSERT INTO warga (nik, no_kk, nama_lengkap, tempat_lahir, tanggal_lahir,
               jenis_kelamin, agama, pendidikan, pekerjaan, status_perkawinan,
               status_hubungan, golongan_darah, telepon, email, status_tinggal,
               kewarganegaraan, status_ekonomi)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
             ON CONFLICT (nik) DO UPDATE SET
               no_kk = EXCLUDED.no_kk,
               nama_lengkap = EXCLUDED.nama_lengkap,
               tempat_lahir = EXCLUDED.tempat_lahir,
               tanggal_lahir = EXCLUDED.tanggal_lahir,
               jenis_kelamin = EXCLUDED.jenis_kelamin,
               agama = EXCLUDED.agama,
               pendidikan = EXCLUDED.pendidikan,
               pekerjaan = EXCLUDED.pekerjaan,
               status_perkawinan = EXCLUDED.status_perkawinan,
               status_hubungan = EXCLUDED.status_hubungan,
               golongan_darah = EXCLUDED.golongan_darah,
               telepon = EXCLUDED.telepon,
               email = EXCLUDED.email,
               status_tinggal = EXCLUDED.status_tinggal,
               kewarganegaraan = EXCLUDED.kewarganegaraan,
               status_ekonomi = EXCLUDED.status_ekonomi,
               updated_at = NOW()`,
            [nik, no_kk, nama,
             str(r['TEMPAT_LAHIR'] || r['tempat_lahir']),
             tglLahir,
             str(r['JENIS_KELAMIN *'] || r['JENIS_KELAMIN'] || r['jenis_kelamin']),
             str(r['AGAMA'] || r['agama']),
             str(r['PENDIDIKAN'] || r['pendidikan']),
             str(r['PEKERJAAN'] || r['pekerjaan']),
             str(r['STATUS_PERKAWINAN'] || r['status_perkawinan']),
             str(r['STATUS_HUBUNGAN *'] || r['STATUS_HUBUNGAN'] || r['status_hubungan']),
             str(r['GOLONGAN_DARAH'] || r['golongan_darah']),
             str(r['TELEPON'] || r['telepon']),
             str(r['EMAIL'] || r['email']),
             statusTinggal,
             str(r['KEWARGANEGARAAN'] || r['kewarganegaraan']) || 'WNI',
             statusEkonomi]
          );
          hasil.berhasil++;
        } catch (err: any) {
          hasil.gagal++;
          hasil.errors.push(`Baris ${i + 4} (${nik}): ${err.message}`);
        }
      }
    }

    return Response.json({
      sukses: true,
      sheet,
      ...hasil,
      pesan: `Import selesai: ${hasil.berhasil} berhasil, ${hasil.gagal} gagal, ${hasil.dilewati} dilewati`,
    });
  } catch (err: any) {
    console.error('Import error:', err);
    return Response.json({ error: 'Gagal memproses file. Pastikan format file benar.' }, { status: 500 });
  }
}
