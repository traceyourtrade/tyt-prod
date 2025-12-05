"use client"

import React, { useMemo } from 'react'
import PerformanceCards from './PerformanceCards'
import ChartContainer from './ChartContainer'
import SummaryTable from './SummaryTable'
import CrossAnalysisTable from './CrossAnalysisTable'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import useAccountDetails from '@/store/accountdetails'

interface Trade {
  date: string
  Symbol: string
  Profit: number
  Commission?: number
  Swap?: number
}

interface PerformanceMetrics {
  netPnL: number
  winPercentage: number
  avgDailyVolume: number
  avgTradeWinLoss: number
}

interface DayMetrics {
  day: string
  trades: Trade[]
  metrics: PerformanceMetrics
}

interface PerformanceData {
  bestDay: { day: string; trades: number; pnl: string }
  leastDay: { day: string; trades: number; pnl: string }
  mostActiveDay: { day: string; trades: number }
  bestWinRateDay: { day: string; winRate: string; tradeCount: number }
}

interface SummaryTableRow {
  day: string
  winPercent: string
  netPnl: string
  tradeCount: number
  avgDailyVolume: string
  avgWin: string
  avgLoss: string
}

interface CrossAnalysisRow {
  day: string
  values: string[]
}

const SubReport = () => {
  const { selectedAccounts } = useAccountDetails()
  const trades = selectedAccounts.flatMap((account: any) => account.tradeData || [])

  const dayMetrics = useMemo((): DayMetrics[] => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const tradesByDay = trades?.reduce((acc: Record<string, Trade[]>, trade: Trade) => {
      const date = new Date(trade.date)
      const dayOfWeek = daysOfWeek[date.getDay()]
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = []
      }
      acc[dayOfWeek].push(trade)
      return acc
    }, {})

    const metrics = Object.entries(tradesByDay || {}).map(([day, dayTrades]) => {
      const dayMetrics = calculatePerformanceMetrics(dayTrades)
      return {
        day,
        trades: dayTrades,
        metrics: dayMetrics
      }
    })

    return metrics
  }, [trades])

  const performanceData = useMemo((): PerformanceData => {
    if (dayMetrics.length === 0) return {
      bestDay: { day: '-', trades: 0, pnl: '$0' },
      leastDay: { day: '-', trades: 0, pnl: '$0' },
      mostActiveDay: { day: '-', trades: 0 },
      bestWinRateDay: { day: '-', winRate: '0', tradeCount: 0 }
    }

    const bestDay = dayMetrics.reduce((best, day) => 
      !best || day.metrics.netPnL > best.metrics.netPnL ? day : best)
      
    const leastDay = dayMetrics.reduce((worst, day) => 
      !worst || day.metrics.netPnL < worst.metrics.netPnL ? day : worst)

    const mostActiveDay = dayMetrics.reduce((most, day) => 
      !most || day.trades.length > most.trades.length ? day : most)

    const bestWinRateDay = dayMetrics.reduce((best, day) => 
      !best || day.metrics.winPercentage > best.metrics.winPercentage ? day : best)

    return {
      bestDay: { 
        day: bestDay.day, 
        trades: bestDay.trades.length, 
        pnl: `$${bestDay.metrics.netPnL.toFixed(2)}` 
      },
      leastDay: { 
        day: leastDay.day, 
        trades: leastDay.trades.length, 
        pnl: `-$${Math.abs(leastDay.metrics.netPnL).toFixed(2)}` 
      },
      mostActiveDay: { 
        day: mostActiveDay.day, 
        trades: mostActiveDay.trades.length 
      },
      bestWinRateDay: { 
        day: bestWinRateDay.day, 
        winRate: bestWinRateDay.metrics.winPercentage.toFixed(2), 
        tradeCount: bestWinRateDay.trades.length 
      }
    }
  }, [dayMetrics])

  const summaryTableData = useMemo((): SummaryTableRow[] => dayMetrics.map(({ day, trades, metrics }) => ({
    day,
    winPercent: metrics.winPercentage.toFixed(2),
    netPnl: `$${metrics.netPnL.toFixed(2)}`,
    tradeCount: trades.length,
    avgDailyVolume: metrics.avgDailyVolume.toFixed(2),
    avgWin: `$${metrics.avgTradeWinLoss > 0 ? metrics.avgTradeWinLoss.toFixed(2) : 0}`,
    avgLoss: `-$${metrics.avgTradeWinLoss < 0 ? Math.abs(metrics.avgTradeWinLoss).toFixed(2) : 0}`
  })), [dayMetrics])

  const crossAnalysisData = useMemo((): CrossAnalysisRow[] => {
    const symbolsSet = new Set(trades.map((t: Trade) => t.Symbol))
    const symbols = Array.from(symbolsSet)

    return dayMetrics.map(({ day, trades }) => {
      const symbolPnL = symbols.map(symbol => {
        const symbolTrades = trades.filter((t: Trade) => t.Symbol === symbol)
        const pnl = symbolTrades.reduce((sum: number, t: Trade) => sum + (t.Profit + (t.Commission || 0) + (t.Swap || 0)), 0)
        return pnl
      })

      return {
        day,
        values: symbolPnL.map(pnl => pnl > 0 ? `$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`)
      }
    })
  }, [dayMetrics, trades])

  const symbols = useMemo(() => {
    const symbolsSet = new Set(trades.map((t: Trade) => t.Symbol))
    return Array.from(symbolsSet)
  }, [trades])

  return (
    <div className="space-y-6">
      {/* Performance Cards */}
      <PerformanceCards data={performanceData} />

      {/* Charts Section */}
      <ChartContainer trades={trades} />

      {/* Summary Table */}
      <SummaryTable data={summaryTableData} />

      {/* Cross Analysis Table */}
      <CrossAnalysisTable data={crossAnalysisData} symbols={symbols} />
    </div>
  )
}

export default SubReport
