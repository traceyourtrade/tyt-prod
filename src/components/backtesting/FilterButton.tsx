'use client';

import { ReactNode } from 'react';

interface FilterButtonProps {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export default function FilterButton({
  children,
  active,
  onClick,
  className = '',
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-[var(--primary)] text-white'
          : 'bg-[var(--background-hover)] text-[var(--foreground-muted)] hover:bg-[var(--background-elevated)]'
      } ${className}`}
    >
      {children}
    </button>
  );
}
