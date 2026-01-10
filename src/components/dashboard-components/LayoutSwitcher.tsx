'use client';

import React from 'react';
import { LayoutGrid, Grid3X3 } from 'lucide-react';
import useDashboardLayoutStore, { LayoutMode } from '@/store/dashboardLayoutStore';

const LayoutSwitcher: React.FC = () => {
  const { layoutMode, setLayoutMode } = useDashboardLayoutStore();

  const layouts: { mode: LayoutMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'view1', label: 'View 1', icon: <LayoutGrid className="w-4 h-4" /> },
    { mode: 'view2', label: 'View 2', icon: <Grid3X3 className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
      {layouts.map(({ mode, label, icon }) => (
        <button
          key={mode}
          onClick={() => setLayoutMode(mode)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${layoutMode === mode 
              ? 'bg-card text-foreground shadow-sm border border-border/50' 
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }
          `}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default LayoutSwitcher;
