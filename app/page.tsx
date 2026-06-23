'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LoginPage from '@/components/auth/LoginPage';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Tampilkan loading saat masih cek token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hijau-pekat via-hijau to-hijau-muda">
        <div className="spinner h-10 w-10 !border-white/30 !border-t-white" />
      </div>
    );
  }

  // Kalau sudah login (tunggu redirect) atau belum login -> tampilkan login page
  if (user) return null;
  return <LoginPage />;
}
