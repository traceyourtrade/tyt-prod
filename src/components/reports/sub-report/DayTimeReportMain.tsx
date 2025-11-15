'use client'

import { useMemo } from 'react'
import useAccountDetails from '@/store/accountdetails'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'

export default function DayTimeReportMain() {
  const { selectedAccounts } = useAccountDetails()
  const trades = selectedAccounts.flatMap((acc: any) => acc.tradeData || [])

  // Group trades by day of week
  const dayMetrics = useMemo(() => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const tradesByDay = trades?.reduce(
      (acc: any, trade: any) => {
        const date = new Date(trade.date)
        const dayOfWeek = daysOfWeek[date.getDay()]
        if (!acc[dayOfWeek]) {
          acc[dayOfWeek] = []
        }
        acc[dayOfWeek].push(trade)
        return acc
      },
      {}
    )

    const metrics = Object.entries(tradesByDay).map(([day, dayTrades]: any) => {
      const dayMetrics = calculatePerformanceMetrics(dayTrades)
      return {
        day,
        trades: dayTrades,
        metrics: dayMetrics
      }
    })

    return metrics
  }, [trades])

  // Calculate performance data
  const performanceData = useMemo(() => {
    if (dayMetrics.length === 0)
      return {
        bestDay: { day: '-', trades: 0, pnl: '$0' },
        leastDay: { day: '-', trades: 0, pnl: '$0' },
        mostActiveDay: { day: '-', trades: 0 },
        bestWinRateDay: { day: '-', winRate: 0, tradeCount: 0 }
      }

    const bestDay = dayMetrics.reduce((best: any, day: any) => (!best || day.metrics.netPnL > best.metrics.netPnL ? day : best))

    const leastDay = dayMetrics.reduce((worst: any, day: any) => (!worst || day.metrics.netPnL < worst.metrics.netPnL ? day : worst))

    const mostActiveDay = dayMetrics.reduce((most: any, day: any) => (!most || day.trades.length > most.trades.length ? day : most))

    const bestWinRateDay = dayMetrics.reduce(
      (best: any, day: any) => (!best || day.metrics.winPercentage > best.metrics.winPercentage ? day : best)
    )

    return {
      bestDay: { day: bestDay.day, trades: bestDay.trades.length, pnl: `$${bestDay.metrics.netPnL.toFixed(2)}` },
      leastDay: { day: leastDay.day, trades: leastDay.trades.length, pnl: `-$${Math.abs(leastDay.metrics.netPnL).toFixed(2)}` },
      mostActiveDay: { day: mostActiveDay.day, trades: mostActiveDay.trades.length },
      bestWinRateDay: { day: bestWinRateDay.day, winRate: bestWinRateDay.metrics.winPercentage.toFixed(2), tradeCount: bestWinRateDay.trades.length }
    }
  }, [dayMetrics])

  // Calculate summary table data
  const summaryTableData = useMemo(
    () =>
      dayMetrics.map(({ day, trades, metrics }: any) => ({
        day,
        winPercent: metrics.winPercentage.toFixed(2),
        netPnl: `$${metrics.netPnL.toFixed(2)}`,
        tradeCount: trades.length,
        avgDailyVolume: metrics.avgDailyVolume.toFixed(2),
        avgWin: `$${metrics.avgTradeWinLoss > 0 ? metrics.avgTradeWinLoss.toFixed(2) : 0}`,
        avgLoss: `-$${metrics.avgTradeWinLoss < 0 ? Math.abs(metrics.avgTradeWinLoss).toFixed(2) : 0}`
      })),
    [dayMetrics]
  )

  return (
    <div className="space-y-6">
      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] rounded-lg p-4 border border-[#333]">
          <div className="text-xs text-gray-400 mb-2">Best Day</div>
          <div className="text-xl font-bold text-white">{performanceData.bestDay.day}</div>
          <div className="text-sm text-[#59c0a4] mt-1">{performanceData.bestDay.pnl}</div>
          <div className="text-xs text-gray-500">{performanceData.bestDay.trades} trades</div>
        </div>

        <div className="bg-[#121212] rounded-lg p-4 border border-[#333]">
          <div className="text-xs text-gray-400 mb-2">Worst Day</div>
          <div className="text-xl font-bold text-white">{performanceData.leastDay.day}</div>
          <div className="text-sm text-[#ec787d] mt-1">{performanceData.leastDay.pnl}</div>
          <div className="text-xs text-gray-500">{performanceData.leastDay.trades} trades</div>
        </div>

        <div className="bg-[#121212] rounded-lg p-4 border border-[#333]">
          <div className="text-xs text-gray-400 mb-2">Most Active Day</div>
          <div className="text-xl font-bold text-white">{performanceData.mostActiveDay.day}</div>
          <div className="text-sm text-gray-300 mt-1">{performanceData.mostActiveDay.trades} trades</div>
        </div>

        <div className="bg-[#121212] rounded-lg p-4 border border-[#333]">
          <div className="text-xs text-gray-400 mb-2">Best Win Rate</div>
          <div className="text-xl font-bold text-white">{performanceData.bestWinRateDay.day}</div>
          <div className="text-sm text-[#59c0a4] mt-1">{performanceData.bestWinRateDay.winRate}%</div>
          <div className="text-xs text-gray-500">{performanceData.bestWinRateDay.tradeCount} trades</div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-[#121212] rounded-lg border border-[#333] overflow-hidden">
        <div className="p-4 border-b border-[#333]">
          <h3 className="text-lg font-semibold text-white">Day of Week Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Day</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Win %</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Net P&L</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Trades</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Avg Volume</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Avg Win</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Avg Loss</th>
              </tr>
            </thead>
            <tbody>
              {summaryTableData.map((row: any, idx: number) => (
                <tr key={idx} className="border-b border-[#333] hover:bg-[#1a1a1a] transition">
                  <td className="px-4 py-3 text-white font-medium">{row.day}</td>
                  <td className="px-4 py-3 text-right text-white">{row.winPercent}%</td>
                  <td className={`px-4 py-3 text-right font-semibold ${parseFloat(row.netPnl) >= 0 ? 'text-[#59c0a4]' : 'text-[#ec787d]'}`}>
                    {row.netPnl}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{row.tradeCount}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{row.avgDailyVolume}</td>
                  <td className="px-4 py-3 text-right text-[#59c0a4]">{row.avgWin}</td>
                  <td className="px-4 py-3 text-right text-[#ec787d]">{row.avgLoss}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
