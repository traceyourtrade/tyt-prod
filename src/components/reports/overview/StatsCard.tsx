"use client"

import { BarChart2, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import StatGroup from './StatGroup'
import StatTable from './StatTable'
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore"

type Props = {
  trades: any[]
  metrics: any
}

export default function StatsCard({ trades, metrics }: Props) {
  const { currency, exchangeRate } = useCurrencyStore()
  const statsData = {
    bestMonth: { value: formatCompactCurrency(0, currency, exchangeRate), date: '' },
    lowestMonth: { value: formatCompactCurrency(0, currency, exchangeRate), date: '' },
    average: { value: formatCompactCurrency(metrics?.avgDailyNetPnL ?? 0, currency, exchangeRate), unit: 'per Day' },
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Your Stats</h2>
          <span className="text-xs text-muted-foreground uppercase">All Dates</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        <StatGroup stats={statsData} />
        <StatTable trades={trades} metrics={metrics} />
      </div>
    </div>
  )
}
