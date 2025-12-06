"use client"

import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, BarChart3, Info } from 'lucide-react'
import OVChartCard from './OVChartCard'
import StatsCard from './StatsCard'
import OverviewPnLFilter from './OverviewPnLFilter'
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts'
import BarChartCard from '../charts/BarChartCard'
import LineChartCard from '../charts/LineChartCard'

export default function OverviewMain() {
  const { selectedAccounts } = useModeFilteredAccounts()
  const allTrades = selectedAccounts.flatMap((account: any) => account.tradeData || [])

  const [pnlType, setPnlType] = useState('net_pnl')
  const [metrics, setMetrics] = useState<any>({})

  useEffect(() => {
    const calculatedMetrics = calculatePerformanceMetrics(allTrades as any)
    setMetrics(calculatedMetrics)
  }, [allTrades.length])

  const cumulativePnLData = useMemo(() => 
    calculateCumulativePnL(allTrades as any), [allTrades]
  )

  const dailyPnLArray = useMemo(() => {
    const dailyPnLData = allTrades.reduce((acc: any, trade: any) => {
      const date = trade.date
      if (!acc[date]) {
        acc[date] = { date, value: 0 }
      }
      acc[date].value += trade.Profit + (Number(trade.Commission) || 0) + (trade.Swap || 0)
      return acc
    }, {})

    return Object.values(dailyPnLData).map((day: any) => ({
      ...day,
      value: parseFloat(day.value.toFixed(2))
    }))
  }, [allTrades])

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <OverviewPnLFilter pnlType={pnlType} setPnlType={setPnlType} />
      </div>

      {/* Stats Section */}
      <StatsCard trades={allTrades} metrics={metrics} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <OVChartCard 
          title="Daily Net Cumulative P&L" 
          subtitle="All Dates"
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
        >
          <LineChartCard data={cumulativePnLData} yLabel="Daily Net P&L" xLabel="Date" />
        </OVChartCard>

        <OVChartCard 
          title="Net Daily P&L" 
          subtitle="All Dates"
          icon={<BarChart3 className="h-4 w-4 text-profit" />}
        >
          <BarChartCard data={dailyPnLArray} yLabel="Net Daily P&L" xLabel="Date" />
        </OVChartCard>
      </div>
    </div>
  )
}
