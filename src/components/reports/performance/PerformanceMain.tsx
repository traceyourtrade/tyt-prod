"use client"

import { useMemo } from 'react'
import { 
  TrendingUp, 
  BarChart3, 
  Plus, 
  MoreHorizontal,
  ChevronDown
} from 'lucide-react'
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
  const trades = selectedAccounts.flatMap((account: any) => account.tradeData || [])

  const netPLData = useMemo(() => calculateCumulativePnL(trades as any), [trades])

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

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Net P&L Chart */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Chart Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
                  Net P&L - cumulative
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Add metric
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
                Day
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          {/* Chart Content */}
          <div className="p-4">
            <div className="h-64 md:h-72">
              <LineChartCard 
                data={netPLData as any} 
                xLabel="date" 
                yLabel="Net P&L" 
                styles={{}} 
              />
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Net P&L</span>
            </div>
          </div>
        </div>

        {/* Avg Daily Win/Loss Chart */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Chart Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-profit" />
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
                  Avg Daily Win/Loss
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Add metric
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
                Day
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          {/* Chart Content */}
          <div className="p-4">
            <div className="h-64 md:h-72">
              <BarChartCard 
                data={avgDailyData as any} 
                xLabel="date" 
                yLabel="Avg Daily"
              />
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-profit" />
                <span className="text-sm text-muted-foreground">Avg Daily (Positive)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-loss" />
                <span className="text-sm text-muted-foreground">Avg Daily (Negative)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <SummarySection trades={trades} />
    </div>
  )
}
