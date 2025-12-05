"use client"

import React, { useMemo } from 'react'
import { LineChart, BarChart3, ChevronDown, Plus } from 'lucide-react'
import LineChartCard from '../charts/LineChartCard'
import BarChartCard from '../charts/BarChartCard'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'

interface Trade {
  date: string
}

interface ChartContainerProps {
  trades: Trade[]
}

const ChartContainer: React.FC<ChartContainerProps> = ({ trades }) => {
  const dayData = useMemo(() => {
    const tradesByDay = trades.reduce((acc: Record<string, Trade[]>, trade: Trade) => {
      const day = trade.date
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push(trade)
      return acc
    }, {})

    const chartData = Object.entries(tradesByDay).map(([day, dayTrades]) => {
      const metrics = calculatePerformanceMetrics(dayTrades)
      return {
        date: day,
        tradeCount: dayTrades.length,
        winPercentage: metrics.winPercentage
      }
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      tradeCount: chartData.map(d => ({ date: d.date, value: d.tradeCount })),
      winPercentage: chartData.map(d => ({ date: d.date, value: d.winPercentage }))
    }
  }, [trades])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Trade Count Chart */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <LineChart className="h-4 w-4 text-primary" />
            </div>
            <div className="relative">
              <select 
                className="appearance-none px-3 py-1.5 pr-8 border border-border rounded-lg bg-muted text-sm font-medium text-foreground cursor-not-allowed opacity-50"
                disabled
              >
                <option>Net P&L</option>
                <option>Trade Count</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground opacity-50 cursor-not-allowed"
            disabled
          >
            <Plus className="h-3.5 w-3.5" />
            Add metric
          </button>
        </div>

        {/* Chart */}
        <div className="p-4">
          <div className="h-72 w-full">
            <LineChartCard data={dayData.tradeCount} isArea={false} xLabel="Day" yLabel="Trade Count" />
          </div>
        </div>
      </div>

      {/* Win Percentage Chart */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-profit" />
            </div>
            <div className="relative">
              <select 
                className="appearance-none px-3 py-1.5 pr-8 border border-border rounded-lg bg-muted text-sm font-medium text-foreground cursor-not-allowed opacity-50"
                disabled
              >
                <option>Win %</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground opacity-50 cursor-not-allowed"
            disabled
          >
            <Plus className="h-3.5 w-3.5" />
            Add metric
          </button>
        </div>

        {/* Chart */}
        <div className="p-4">
          <div className="h-72 w-full">
            <BarChartCard data={dayData.winPercentage} xLabel="Day" yLabel="Win %" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartContainer
