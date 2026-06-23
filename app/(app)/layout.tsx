import { ReactNode } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
