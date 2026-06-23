'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Building2, Lock, User as UserIcon, AlertCircle, FileText } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error || 'Gagal login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hijau-pekat via-hijau to-hijau-muda p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-white/15 backdrop-blur-sm mb-4">
            <Building2 size={40} />
          </div>
          <h1 className="text-2xl font-bold">Padukuhan Majegan</h1>
          <p className="text-white/80 mt-1 text-sm">Sistem Administrasi Dukuh</p>
          <p className="text-white/60 mt-0.5 text-xs">Pandowoharjo, Sleman, D.I. Yogyakarta</p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-[var(--text)] mb-6">Masuk ke Akun</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-merah/10 px-4 py-3 text-sm text-merah">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              icon={<UserIcon size={18} />}
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              icon={<Lock size={18} />}
              required
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Masuk
            </Button>
          </form>

          {/* Link pengajuan surat untuk warga */}
          <a
            href="/pengajuan"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-hijau/30 bg-hijau-terang/10 px-4 py-3 text-sm font-medium text-hijau transition hover:bg-hijau-terang/20"
          >
            <FileText size={16} />
            Ajukan Surat Online (Warga)
          </a>

          <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Padukuhan Majegan. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}
