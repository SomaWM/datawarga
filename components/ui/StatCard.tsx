import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'hijau' | 'kuning' | 'merah' | 'biru';
  hint?: string;
}

const colorClasses = {
  hijau: 'from-hijau to-hijau-muda',
  kuning: 'from-kuning to-kuning-muda',
  merah: 'from-merah to-red-500',
  biru: 'from-biru to-biru-muda',
};

export default function StatCard({ title, value, icon, color = 'hijau', hint }: StatCardProps) {
  return (
    <div className="card overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">{title}</p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{value}</p>
          {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-md`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
