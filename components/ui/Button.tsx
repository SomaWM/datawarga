'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'hijau' | 'kuning' | 'merah' | 'abu' | 'biru' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  hijau: 'bg-hijau hover:bg-hijau-muda text-white shadow-sm',
  kuning: 'bg-kuning hover:bg-kuning-muda text-white shadow-sm',
  merah: 'bg-merah hover:bg-red-600 text-white shadow-sm',
  abu: 'bg-slate-500 hover:bg-slate-600 text-white shadow-sm',
  biru: 'bg-biru hover:bg-biru-muda text-white shadow-sm',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-[var(--text)] border border-[var(--border)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'hijau',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-hijau-muda disabled:opacity-60 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="spinner !w-4 !h-4 !border-2 !border-white/30 !border-t-white" />
      )}
      {children}
    </button>
  );
}
