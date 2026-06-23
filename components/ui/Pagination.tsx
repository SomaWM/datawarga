'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (totalPages <= 1) {
    return total > 0 ? (
      <div className="px-4 py-3 text-sm text-[var(--text-muted)] border-t border-[var(--border)]">
        Menampilkan {total} data
      </div>
    ) : null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
      <div className="text-sm text-[var(--text-muted)]">
        Menampilkan <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> dari{' '}
        <span className="font-medium">{total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="px-3 py-1 text-sm font-medium text-[var(--text)]">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
