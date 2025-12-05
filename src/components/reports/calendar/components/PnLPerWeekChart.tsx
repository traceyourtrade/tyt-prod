"use client"

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface WeekData {
  week: number
  pnl: number
}

interface PnLPerWeekChartProps {
  year?: number
  month?: number
  data?: WeekData[]
}

const PnLPerWeekChart: React.FC<PnLPerWeekChartProps> = ({
  year = 2025,
  month = 10,
  data = []
}) => {
  const [pnlData, setPnlData] = React.useState<WeekData[]>([])

  React.useEffect(() => {
    setPnlData(data)
  }, [year, month, data])

  const getIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="h-4 w-4 text-profit" />
    if (pnl < 0) return <TrendingDown className="h-4 w-4 text-loss" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getCardClasses = (pnl: number) => {
    if (pnl > 0) return 'bg-profit/5 border-profit/20'
    if (pnl < 0) return 'bg-loss/5 border-loss/20'
    return 'bg-muted/30 border-border'
  }

  const getPnlTextClass = (pnl: number) => {
    if (pnl > 0) return 'text-profit'
    if (pnl < 0) return 'text-loss'
    return 'text-muted-foreground'
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden h-full">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground text-center">P&L Per Week</h3>
      </div>
      <div className="p-4 space-y-3">
        {pnlData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          pnlData.map((weekData) => (
            <div
              key={weekData.week}
              className={`rounded-lg p-4 border transition-all ${getCardClasses(weekData.pnl)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(weekData.pnl)}
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Week {weekData.week}
                  </span>
                </div>
                <span className={`text-sm font-bold ${getPnlTextClass(weekData.pnl)}`}>
                  {weekData.pnl >= 0 ? '+' : ''}
                  {weekData.pnl.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PnLPerWeekChart
