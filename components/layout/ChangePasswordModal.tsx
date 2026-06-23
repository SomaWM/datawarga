'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiFetch } from '@/lib/api';
import { Lock, KeyRound } from 'lucide-react';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Semua kolom wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sesuai');
      return;
    }
    if (newPassword === oldPassword) {
      setError('Password baru tidak boleh sama dengan password lama');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      toast.success('Password berhasil diubah');
      handleClose();
    } catch (err: any) {
      setError(err?.error || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Ganti Password"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hijau/10 text-hijau">
          <KeyRound size={24} />
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Demi keamanan akun, gunakan password yang kuat dan mudah Anda ingat.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-merah/10 px-4 py-2.5 text-sm text-merah">{error}</div>
      )}

      <div className="space-y-4">
        <Input
          label="Password Lama"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          icon={<Lock size={18} />}
          placeholder="Masukkan password lama"
          autoFocus
        />
        <Input
          label="Password Baru"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          icon={<Lock size={18} />}
          placeholder="Minimal 6 karakter"
        />
        <Input
          label="Konfirmasi Password Baru"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock size={18} />}
          placeholder="Ulangi password baru"
        />
      </div>
    </Modal>
  );
}
