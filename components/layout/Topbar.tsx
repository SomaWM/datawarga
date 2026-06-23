'use client';

import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--text)]">{title}</h1>
      </div>

      <button
        onClick={toggleTheme}
        className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
        title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
    </header>
  );
}
