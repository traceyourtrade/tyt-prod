"use client"

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  BarChart3, 
  MoreHorizontal,
  ChevronDown
} from 'lucide-react'
import LineChartCard from '@/components/reports/charts/LineChartCard'
import BarChartCard from '@/components/reports/charts/BarChartCard'
import SummarySection from './SummarySection'
import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts'
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL'

type Props = {
  metric?: string
  type?: string
}

export default function PerformanceMain({ metric = 'pnl', type = 'gross' }: Props) {
  const { selectedAccounts } = useModeFilteredAccounts()
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-border transition-all duration-300"
        >
          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Net P&L</h3>
                <p className="text-xs text-muted-foreground">Cumulative performance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-colors">
                Day
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="h-64 md:h-72">
              <LineChartCard 
                data={netPLData as any} 
                xLabel="date" 
                yLabel="Net P&L" 
                styles={{}} 
              />
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                <span className="text-xs text-muted-foreground font-medium">Cumulative P&L</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Avg Daily Win/Loss Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-border transition-all duration-300"
        >
          <div className="h-0.5 bg-gradient-to-r from-transparent via-profit/40 to-transparent" />
          
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-profit/20 to-profit/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-profit" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Daily Performance</h3>
                <p className="text-xs text-muted-foreground">Average win/loss by day</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-colors">
                Day
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="h-64 md:h-72">
              <BarChartCard 
                data={avgDailyData as any} 
                xLabel="date" 
                yLabel="Avg Daily"
              />
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-profit shadow-sm shadow-profit/50" />
                <span className="text-xs text-muted-foreground font-medium">Profitable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-loss shadow-sm shadow-loss/50" />
                <span className="text-xs text-muted-foreground font-medium">Loss</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Summary Section */}
      <SummarySection trades={trades} />
    </div>
  )
}
