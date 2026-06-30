/**
 * Shared Zod Validation Schemas
 *
 * Schema-schemValidasi yang dipakai di API routes.
 * Zod v4 — gunakan safeParse() untuk validasi input.
 *
 * Cara pakai:
 *   import { wargaCreateSchema } from '@/lib/validations';
 *   const result = wargaCreateSchema.safeParse(body);
 *   if (!result.success) return badRequest(result.error);
 */

import { z } from 'zod';

// ── Helper: format Zod errors jadi pesan yang mudah dibaca ──
export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return 'Data tidak valid';
  const field = first.path.join('.') || 'Field';
  const msg = first.message;
  return `${field}: ${msg}`;
}

export function zodErrors(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_general';
    map[key] = issue.message;
  }
  return map;
}

// ── Warga ──

export const wargaCreateSchema = z.object({
  nik: z
    .string()
    .regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  no_kk: z.string().optional(),
  no_kk_baru: z.object({
    no_kk: z.string().min(1, 'No. KK wajib diisi').max(20),
    nama_kepala: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  }).optional(),
  nama_lengkap: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  tempat_lahir: z.string().max(50).optional().default(''),
  tanggal_lahir: z.string().optional().default(''), // format YYYY-MM-DD, divalidasi di level DB
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional().default('Laki-laki'),
  agama: z.string().max(20).optional().default('Islam'),
  pendidikan: z.string().max(50).optional().default(''),
  pekerjaan: z.string().max(50).optional().default(''),
  status_perkawinan: z.string().max(20).optional().default(''),
  status_hubungan: z.string().max(30).optional().default(''),
  golongan_darah: z.enum(['A', 'B', 'AB', 'O', '']).optional().default(''),
  telepon: z.string().max(20).optional().default(''),
  email: z.string().email('Format email tidak valid').or(z.literal('')).optional().default(''),
  status_tinggal: z
    .enum(['domisili_asli', 'non_ktp', 'sementara', 'non_domisili'])
    .optional()
    .default('domisili_asli'),
  status_ekonomi: z
    .enum(['mampu', 'rentan_miskin', 'miskin'])
    .optional()
    .default('mampu'),
  alamat_ktp: z.string().max(500).optional().default(''),
  alamat_domisili: z.string().max(500).optional().default(''),
});

export const wargaUpdateSchema = wargaCreateSchema.partial().omit({ nik: true });

// ── Surat ──

export const JENIS_SURAT_LIST = [
  'Surat Keterangan Domisili',
  'Surat Keterangan Tidak Mampu',
  'Surat Keterangan Usaha',
  'Surat Keterangan Kelahiran',
  'Surat Keterangan Kematian',
  'Surat Izin Keramaian',
  'Surat Pengantar',
  'Surat Pemberitahuan',
] as const;

export const suratPengajuanSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  jenis_surat: z.enum(JENIS_SURAT_LIST, { message: 'Jenis surat tidak valid' }),
  keperluan: z.string().min(5, 'Keperluan minimal 5 karakter').max(2000),
});

export const suratStatusSchema = z.object({
  status: z.enum(['pending', 'diproses', 'selesai', 'ditolak'], {
    message: 'Status tidak valid',
  }),
  catatan: z.string().max(2000).optional().default(''),
});

// ── KK (Kepala Keluarga) ──

export const kkCreateSchema = z.object({
  no_kk: z
    .string()
    .min(1, 'No. KK wajib diisi')
    .max(20),
  nama_kepala: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  rt: z.string().max(5).optional().default(''),
  rw: z.string().max(5).optional().default(''),
  dusun: z.string().max(50).optional().default('Majegan'),
  telepon: z.string().max(20).optional().default(''),
});

export const kkUpdateSchema = kkCreateSchema.partial();

// ── Kelahiran ──

export const kelahiranCreateSchema = z.object({
  no_kk: z.string().max(20).optional().default(''),
  nama_ibu: z.string().max(100).optional().default(''),
  nik_ibu: z.string().regex(/^\d{16}$/).optional().default(''),
  nama_ayah: z.string().max(100).optional().default(''),
  nik_ayah: z.string().regex(/^\d{16}$/).optional().default(''),
  alamat: z.string().optional().default(''),
  nama_bayi: z.string().min(2, 'Nama bayi minimal 2 karakter').max(100),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  jam_lahir: z.string().optional().default(''),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional().default('Laki-laki'),
  berat_lahir: z.coerce.number().min(0).max(10).optional().default(0),
  tinggi_lahir: z.coerce.number().min(0).max(100).optional().default(0),
  tempat_lahir: z.enum(['RS', 'Puskesmas', 'Bidan', 'Lainnya']).optional().default('Bidan'),
  tempat_lahir_keterangan: z.string().max(150).optional().default(''),
  catatan: z.string().max(2000).optional().default(''),
});

// ── Kematian ──

export const kematianCreateSchema = z.object({
  nik: z.string().regex(/^\d{16}$/).optional().default(''),
  no_kk: z.string().max(20).optional().default(''),
  nama_lengkap: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  tempat_lahir: z.string().max(50).optional().default(''),
  tanggal_lahir: z.string().optional().default(''),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional().default('Laki-laki'),
  alamat: z.string().optional().default(''),
  tanggal_meninggal: z.string().min(1, 'Tanggal meninggal wajib diisi'),
  usia_jenazah: z.coerce.number().int().min(0).max(200).optional().default(0),
  jam_meninggal: z.string().optional().default(''),
  tempat_meninggal: z.enum(['RS', 'Rumah', 'Lainnya']).optional().default('Rumah'),
  tempat_meninggal_keterangan: z.string().max(150).optional().default(''),
  penyebab_kematian: z.enum(['sakit', 'tua', 'virus', 'kecelakaan', 'lainnya']).optional().default('sakit'),
  penyebab_kematian_keterangan: z.string().max(150).optional().default(''),
  nama_ibu: z.string().max(100).optional().default(''),
  nama_ayah: z.string().max(100).optional().default(''),
  lokasi_pemakaman: z.string().max(150).optional().default(''),
  catatan: z.string().max(2000).optional().default(''),
});

// ── Pengumuman ──

export const pengumumanCreateSchema = z.object({
  judul: z.string().min(3, 'Judul minimal 3 karakter').max(200),
  isi: z.string().min(10, 'Isi pengumuman minimal 10 karakter'),
  kategori: z.string().max(50).optional().default('umum'),
  penting: z.boolean().optional().default(false),
  tanggal_mulai: z.string().optional().default(''),
  tanggal_selesai: z.string().optional().default(''),
});

export const pengumumanUpdateSchema = pengumumanCreateSchema.partial();

// ── Kegiatan ──

export const kegiatanCreateSchema = z.object({
  nama_kegiatan: z.string().min(3, 'Nama kegiatan minimal 3 karakter').max(200),
  deskripsi: z.string().max(5000).optional().default(''),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  waktu: z.string().max(10).optional().default(''),
  lokasi: z.string().max(200).optional().default(''),
  penanggung_jawab: z.string().max(100).optional().default(''),
  status: z.enum(['rencana', 'berlangsung', 'selesai', 'batal']).optional().default('rencana'),
});

export const kegiatanUpdateSchema = kegiatanCreateSchema.partial();

// ── Password Change ──

export const passwordChangeSchema = z.object({
  old_password: z.string().min(1, 'Password lama wajib diisi'),
  new_password: z
    .string()
    .min(6, 'Password baru minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
});

// ── Cek NIK ──

export const cekNikSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
});
