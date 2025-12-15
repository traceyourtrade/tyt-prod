'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  tooltip?: string;
  className?: string;
  headerRight?: ReactNode;
}

export default function ChartCard({
  title,
  children,
  className = '',
  headerRight,
}: ChartCardProps) {
  return (
    <div className={`chart-card ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-[var(--foreground)]">{title}</h3>
        {headerRight && (
          <div className="flex items-center gap-2">
            {headerRight}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
