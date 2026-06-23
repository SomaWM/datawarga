'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AppLayout from './AppLayout';

/**
 * Wrapper untuk halaman yang butuh login.
 * - Kalau belum login & tidak loading -> redirect ke "/" (login page)
 * - Kalai loading -> tampilkan spinner
 * - Kalau sudah login -> render AppLayout + children
 */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-10 w-10" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
