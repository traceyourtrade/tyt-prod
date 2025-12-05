"use client"

import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

type Props = {
  stats: any
}

export default function StatGroup({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Best Month */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-profit/10 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-profit" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase">Best Month</span>
        </div>
        <div className="text-xl font-bold text-profit">{stats.bestMonth.value}</div>
        {stats.bestMonth.date && (
          <div className="text-xs text-muted-foreground mt-1">{stats.bestMonth.date}</div>
        )}
      </div>

      {/* Lowest Month */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-loss/10 flex items-center justify-center">
            <TrendingDown className="h-3.5 w-3.5 text-loss" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase">Lowest Month</span>
        </div>
        <div className="text-xl font-bold text-loss">{stats.lowestMonth.value}</div>
        {stats.lowestMonth.date && (
          <div className="text-xs text-muted-foreground mt-1">{stats.lowestMonth.date}</div>
        )}
      </div>

      {/* Average */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase">Average</span>
        </div>
        <div className="text-xl font-bold text-foreground">{stats.average.value}</div>
        {stats.average.unit && (
          <div className="text-xs text-muted-foreground mt-1">{stats.average.unit}</div>
        )}
      </div>
    </div>
  )
}
