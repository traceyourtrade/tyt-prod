"use client"

import React from 'react'
import PerformanceCard from './PerformanceCard'

interface PerformanceData {
  bestDay: { day: string; trades: number; pnl: string }
  leastDay: { day: string; trades: number; pnl: string }
  mostActiveDay: { day: string; trades: number }
  bestWinRateDay: { day: string; winRate: string; tradeCount: number }
}

interface PerformanceCardsProps {
  data: PerformanceData
}

const PerformanceCards: React.FC<PerformanceCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <PerformanceCard
        title="Best Performing Day"
        day={data.bestDay?.day || 'N/A'}
        trades={data.bestDay?.trades || 0}
        pnl={data.bestDay?.pnl || '$0'}
        icon="trending-up"
        variant="profit"
      />
      <PerformanceCard
        title="Least Performing Day"
        day={data.leastDay?.day || 'N/A'}
        trades={data.leastDay?.trades || 0}
        pnl={data.leastDay?.pnl || '$0'}
        icon="trending-down"
        variant="loss"
      />
      <PerformanceCard
        title="Most Active Day"
        day={data.mostActiveDay?.day || 'N/A'}
        trades={data.mostActiveDay?.trades || 0}
        pnl=""
        icon="activity"
        variant="warning"
      />
      <PerformanceCard
        title="Best Win Rate"
        day={data.bestWinRateDay?.day || 'N/A'}
        trades={data.bestWinRateDay?.tradeCount || 0}
        pnl={`${data.bestWinRateDay?.winRate || '0'}% / ${data.bestWinRateDay?.tradeCount || 0} trade`}
        icon="user-check"
        variant="primary"
      />
    </div>
  )
}

export default PerformanceCards
