// PerformanceCards.tsx
import React from 'react';
import PerformanceCard from './PerformanceCard';

interface PerformanceData {
  bestDay: { day: string; trades: number; pnl: string };
  leastDay: { day: string; trades: number; pnl: string };
  mostActiveDay: { day: string; trades: number };
  bestWinRateDay: { day: string; winRate: string; tradeCount: number };
}

interface PerformanceCardsProps {
  data: PerformanceData;
}

const PerformanceCards: React.FC<PerformanceCardsProps> = ({ data }) => {
  return (
    <div className="flex gap-4 mb-6">
      <PerformanceCard
        title="Best performing day"
        day={data.bestDay?.day || 'N/A'}
        trades={data.bestDay?.trades || 0}
        pnl={data.bestDay?.pnl || '$0'}
        icon="trending-up"
        color="#4ebf94"
      />
      <PerformanceCard
        title="Least performing day"
        day={data.leastDay?.day || 'N/A'}
        trades={data.leastDay?.trades || 0}
        pnl={data.leastDay?.pnl || '$0'}
        icon="trending-down"
        color="#ef4444"
      />
      <PerformanceCard
        title="Most active day"
        day={data.mostActiveDay?.day || 'N/A'}
        trades={data.mostActiveDay?.trades || 0}
        pnl=""
        icon="activity"
        color="#f59e0b"
      />
      <PerformanceCard
        title="Best win rate"
        day={data.bestWinRateDay?.day || 'N/A'}
        trades={data.bestWinRateDay?.tradeCount || 0}
        pnl={`${data.bestWinRateDay?.winRate || '0'}% / ${data.bestWinRateDay?.tradeCount || 0} trade`}
        icon="user-check"
        color="#6d28d9"
      />
    </div>
  );
};

export default PerformanceCards;