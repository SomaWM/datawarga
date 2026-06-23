'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken, clearToken, getToken } from './api';

export interface User {
  id: string;
  username: string;
  nama: string;
  role: 'dukuh' | 'staff' | 'warga';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (minRole: 'dukuh' | 'staff' | 'warga') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_LEVELS: Record<string, number> = {
  dukuh: 3,
  staff: 2,
  warga: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cek token saat mount — skip jika user sudah di-set oleh login()
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await apiFetch<User>('/api/auth/me');
        setUser(userData);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(res.token);
      setUser(res.user);
      setLoading(false); // Langsung selesai loading — tidak perlu tunggu checkAuth
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.error || 'Gagal login' };
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.push('/');
  };

  const hasRole = (minRole: 'dukuh' | 'staff' | 'warga'): boolean => {
    if (!user) return false;
    const userLevel = ROLE_LEVELS[user.role] || 0;
    const requiredLevel = ROLE_LEVELS[minRole] || 0;
    return userLevel >= requiredLevel;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
