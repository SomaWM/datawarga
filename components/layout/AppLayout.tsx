'use client';

import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChangePasswordModal from './ChangePasswordModal';

// Map pathname ke judul halaman
const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/warga': 'Data Warga & Kartu Keluarga',
  '/kematian': 'Data Kematian',
  '/kelahiran': 'Data Kelahiran',
  '/surat': 'Surat & Izin',
  '/pengumuman': 'Pengumuman',
  '/kegiatan': 'Kegiatan Dukuh',
  '/dokumen': 'Dokumen KTP & KK',
  '/bantuan': 'Bantuan Pemerintah',
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const title = titleMap[pathname] || 'Padukuhan Majegan';

  return (
    <div className="min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenPassword={() => setPasswordOpen(true)}
      />

      <div className="lg:pl-64">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</main>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
