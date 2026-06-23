/**
 * Utility functions untuk formatting dan helper umum.
 */

/**
 * Format tanggal ke format Indonesia: "19 Juni 2026"
 */
export function formatTanggal(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal pendek: "19/06/2026"
 */
export function formatTanggalPendek(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format datetime: "19 Jun 2026, 14:30"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format angka ke Rupiah: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Hitung umur dari tanggal lahir
 */
export function hitungUmur(tanggalLahir: string | Date | null | undefined): number | null {
  if (!tanggalLahir) return null;
  const lahir = typeof tanggalLahir === 'string' ? new Date(tanggalLahir) : tanggalLahir;
  if (isNaN(lahir.getTime())) return null;
  const diff = Date.now() - lahir.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Kapitalisasi huruf pertama setiap kata
 */
export function titleCase(str: string | null | undefined): string {
  if (!str) return '-';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Inisial nama untuk avatar
 */
export function inisial(nama: string | null | undefined): string {
  if (!nama) return '?';
  const parts = nama.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Debounce function untuk search
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Cek apakah string valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
