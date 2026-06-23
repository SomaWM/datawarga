import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)]">
        {icon || <Inbox size={28} />}
      </div>
      <h3 className="mt-4 text-base font-medium text-[var(--text)]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--text-muted)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  text?: string;
}

export function LoadingState({ text = 'Memuat data...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="spinner h-8 w-8" />
      <p className="mt-3 text-sm text-[var(--text-muted)]">{text}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
