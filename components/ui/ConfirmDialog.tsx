'use client';

import { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: 'merah' | 'hijau';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  loading = false,
  variant = 'merah',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
            variant === 'merah' ? 'bg-merah/10 text-merah' : 'bg-hijau/10 text-hijau'
          }`}
        >
          <AlertTriangle size={24} />
        </div>
        <div className="flex-1 pt-1">
          <p className="text-[var(--text)]">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
