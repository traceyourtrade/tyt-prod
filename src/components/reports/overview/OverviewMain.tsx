"use client"

import { useEffect, useState } from 'react'
import OVChartCard from './OVChartCard'
import StatsCard from './StatsCard'
import OverviewPnLFilter from './OverviewPnLFilter'
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import { calculatePerformanceMetrics as calculatePerformanceMetricsNetPnL } from '@/utils/reports/calculatePerformanceMetrics'
import useAccountDetails from '@/store/accountdetails'
import BarChartCard from '../charts/BarChartCard'
import LineChartCard from '../charts/LineChartCard'

type Props = {
  selectedAccounts: any[]
  trades: any[]
}

export default function OverviewMain() {
  const { selectedAccounts } = useAccountDetails()
  const allTrades =  selectedAccounts.flatMap((account: any) => account.tradeData || [])

  const [pnlType, setPnlType] = useState('net_pnl')
  const [metrics, setMetrics] = useState<any>({})

  useEffect(() => {
    let calculatedMetrics
    console.log('OverviewMain: Calculating metrics for pnlType:', pnlType)
    if (pnlType === 'net_pnl') {
      calculatedMetrics = calculatePerformanceMetricsNetPnL(allTrades as any)
    } else {
      calculatedMetrics = calculatePerformanceMetrics(allTrades as any)
    }
    setMetrics(calculatedMetrics)
  }, [])

  const cumulativePnLData = calculateCumulativePnL(allTrades as any,"overviewmain alltrades")
const dailyPnLData = allTrades.reduce((acc, trade) => {
    const date = trade.date;
    if (!acc[date]) {
      acc[date] = { date, value: 0 };
    }
    acc[date].value += trade.Profit + trade.Commission + trade.Swap;
    return acc;
  }, {});

  const dailyPnLArray = Object.values(dailyPnLData).map(day  => ({
    ...day,
    value: parseFloat(day.value.toFixed(2))
  }));

  return (
    <div className="overview-page">
      <div className="page-content">
        <div className="header-section">
          <OverviewPnLFilter pnlType={pnlType} setPnlType={setPnlType} />
        </div>
        <StatsCard trades={allTrades} metrics={metrics} />
        <div className="charts-section mt-6 space-y-4 md:space-y-0 md:flex md:gap-4">
          <OVChartCard title="DAILY NET CUMULATIVE P&L" subtitle="(ALL DATES)">
            <LineChartCard  data={cumulativePnLData}    yLabel={'Daily Net P&L'} xLabel={"Date"}/>
          </OVChartCard>

          <OVChartCard title="NET DAILY P&L" subtitle="(ALL DATES)">
            <BarChartCard data={dailyPnLArray} yLabel={'Net Daily P&L'} xLabel={"Date"} />
          </OVChartCard>
        </div>
      </div>
    </div>
  )
}
