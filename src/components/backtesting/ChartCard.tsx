'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tooltip?: string;
  className?: string;
  headerRight?: ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  className = '',
  headerRight,
}: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {headerRight && (
          <div className="flex-shrink-0">
            {headerRight}
          </div>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
