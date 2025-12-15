'use client';

import PerformanceSection from './PerformanceSection';
import SessionsList from './SessionsList';

export default function DashboardMain({handleNewSessionClick}) {
  return (
    <div className="space-y-8">
      <PerformanceSection />
      <SessionsList handleNewSessionClick={handleNewSessionClick}/>
    </div>
  );
}
