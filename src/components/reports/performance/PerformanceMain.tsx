"use client"

import { useMemo } from 'react'
import LineChartCard from '@/components/reports/charts/LineChartCard'
import BarChartCard from '@/components/reports/charts/BarChartCard'
import SummarySection from './SummarySection'
import useAccountDetails from '@/store/accountdetails'
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL'

type Props = {
  metric?: string
  type?: string
}

export default function PerformanceMain({ metric = 'pnl', type = 'gross' }: Props) {
  
  const { selectedAccounts } = useAccountDetails()
  const trades =  selectedAccounts.flatMap((account: any) => account.tradeData || [])


  const netPLData = useMemo(() => calculateCumulativePnL(trades as any,"performance"), [trades])

  const avgDailyData = useMemo(() => {
    const map: Record<string, { date: string; value: number; count: number }> = {}
    trades.forEach((trade: any) => {
      const date = trade.date
      if (!map[date]) map[date] = { date, value: 0, count: 0 }
      map[date].value += (trade.Profit || 0) + (trade.Commission || 0) + (trade.Swap || 0)
      map[date].count++
    })
    return Object.values(map).map((d) => ({ date: d.date, value: parseFloat((d.value / Math.max(1, d.count)).toFixed(2)) }))
  }, [trades])

  const chartWrapper = ({ title, yLabel, line }: { title: string; yLabel: string; line?: boolean }) => {
    return (
      <div className="bg-[#121212] rounded-xl p-4 border border-[#333] flex-1">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <select className="bg-transparent text-white border border-[#333] rounded px-2 py-1 text-sm" disabled>
              <option>{title}</option>
            </select>
            <button className="ml-2 bg-[#1a3a2d] text-[#878a89] rounded px-2 py-1 text-sm" disabled>+ Add metric</button>
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-transparent text-white border border-[#333] rounded px-2 py-1 text-sm" disabled>
              <option>Day</option>
            </select>
            <button className="text-gray-400 text-xl" disabled>⋯</button>
          </div>
        </div>
        <div className="h-72">
          {(() => {
            const LC: any = LineChartCard
            const BC: any = BarChartCard
            return line ? <LC data={netPLData as any} xLabel="date" yLabel="Net P&L" styles={{}} /> : <BC data={avgDailyData as any} xLabel="date" yLabel="Avg Daily" styles={{}} />
          })()}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-gray-300">{yLabel}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {chartWrapper({ title: 'Net P&L - cumulative', yLabel: 'Net P&L', line: true })}
        {chartWrapper({ title: 'Avg Daily Win/Loss', yLabel: 'Avg Daily Win/Loss', line: false })}
      </div>
      <SummarySection trades={trades} />
    </div>
  )
}
