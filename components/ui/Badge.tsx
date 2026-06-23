import { ReactNode } from 'react';

type BadgeVariant = 'hijau' | 'kuning' | 'merah' | 'biru' | 'abu' | 'ungu';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  hijau: 'badge-hijau',
  kuning: 'badge-kuning',
  merah: 'badge-merah',
  biru: 'badge-biru',
  abu: 'badge-abu',
  ungu: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
};

export default function Badge({ variant = 'abu', children, className = '' }: BadgeProps) {
  return <span className={`badge ${variantClasses[variant]} ${className}`}>{children}</span>;
}

/**
 * Helper untuk map status surat ke badge variant
 */
export function badgeSurat(status: string): { variant: BadgeVariant; label: string } {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'kuning', label: 'Pending' },
    diproses: { variant: 'biru', label: 'Diproses' },
    selesai: { variant: 'hijau', label: 'Selesai' },
    ditolak: { variant: 'merah', label: 'Ditolak' },
  };
  return map[status] || { variant: 'abu', label: status };
}

/**
 * Helper untuk map status kegiatan
 */
export function badgeKegiatan(status: string): { variant: BadgeVariant; label: string } {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    rencana: { variant: 'kuning', label: 'Rencana' },
    berlangsung: { variant: 'biru', label: 'Berlangsung' },
    selesai: { variant: 'hijau', label: 'Selesai' },
    batal: { variant: 'merah', label: 'Batal' },
  };
  return map[status] || { variant: 'abu', label: status };
}

/**
 * Helper untuk map status ekonomi warga
 */
export function badgeEkonomi(status: string | null): { variant: BadgeVariant; label: string } {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    mampu: { variant: 'hijau', label: '💪 Mampu' },
    rentan_miskin: { variant: 'kuning', label: '⚠️ Rentan Miskin' },
    miskin: { variant: 'merah', label: '🆘 Miskin' },
  };
  if (!status) return { variant: 'abu', label: '-' };
  return map[status] || { variant: 'abu', label: status };
}
