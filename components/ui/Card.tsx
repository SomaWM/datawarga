import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return <div className={`card ${paddingClasses[padding]} ${className}`}>{children}</div>;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hijau/10 text-hijau">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
          {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
