'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Skull,
  Baby,
  FileText,
  Megaphone,
  CalendarDays,
  FileImage,
  HandCoins,
  LogOut,
  Building2,
  X,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onOpenPassword: () => void;
  suratPendingCount?: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  minRole?: 'dukuh' | 'staff' | 'warga';
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ open, onClose, onOpenPassword, suratPendingCount }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const sections: NavSection[] = [
    {
      title: 'Menu Utama',
      items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Data Warga',
      items: [
        { label: 'Data Warga', href: '/warga', icon: Users, minRole: 'staff' },
        { label: 'Data Kematian', href: '/kematian', icon: Skull, minRole: 'staff' },
        { label: 'Data Kelahiran', href: '/kelahiran', icon: Baby, minRole: 'staff' },
      ],
    },
    {
      title: 'Administrasi',
      items: [
        {
          label: 'Surat & Izin',
          href: '/surat',
          icon: FileText,
          minRole: 'staff',
          badge: suratPendingCount,
        },
        { label: 'Pengumuman', href: '/pengumuman', icon: Megaphone, minRole: 'staff' },
        { label: 'Kegiatan', href: '/kegiatan', icon: CalendarDays, minRole: 'staff' },
        { label: 'Dokumen KTP & KK', href: '/dokumen', icon: FileImage, minRole: 'staff' },
        {
          label: 'Bantuan Pemerintah',
          href: '/bantuan',
          icon: HandCoins,
          minRole: 'staff',
        },
      ],
    },
  ];

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href) && href !== '/');

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--surface)] border-r border-[var(--border)] transform transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-hijau to-hijau-muda text-white">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text)] leading-tight">Padukuhan</p>
              <p className="text-xs text-[var(--text-muted)] leading-tight">Majegan</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items
                  .filter((item) => !item.minRole || hasRole(item.minRole))
                  .map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onClose()}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          active
                            ? 'bg-hijau text-white shadow-sm'
                            : 'text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[var(--text)]'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                              active ? 'bg-white text-hijau' : 'bg-merah text-white'
                            }`}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: User + Actions */}
        <div className="border-t border-[var(--border)] p-3 space-y-1">
          <button
            onClick={onOpenPassword}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[var(--text)] transition"
          >
            <KeyRound size={18} />
            <span>Ganti Password</span>
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-merah hover:bg-merah/10 transition"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
          {user && (
            <div className="mt-2 px-3 py-2 text-xs text-[var(--text-muted)]">
              Login sebagai:{' '}
              <span className="font-semibold text-[var(--text)]">{user.nama}</span>
              <br />
              <span className="capitalize">({user.role})</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
