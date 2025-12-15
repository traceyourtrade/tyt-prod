'use client';

import PerformanceSection from './PerformanceSection';
import SessionsList from './SessionsList';

interface DashboardMainProps {
  handleNewSessionClick: () => void;
}

export default function DashboardMain({ handleNewSessionClick }: DashboardMainProps) {
  return (
    <div className="space-y-8">
      <PerformanceSection />
      <SessionsList handleNewSessionClick={handleNewSessionClick}/>
    </div>
  );
}
