'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden'; // Lock scroll
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`modal-enter relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden rounded-xl bg-[var(--surface)] shadow-besar flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
