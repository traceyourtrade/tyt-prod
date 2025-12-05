"use client"

import { formatCompactNumber } from "@/utils/formatNumber"

type Props = {
  trades: any[]
  metrics: any
}

export default function StatTable({ trades, metrics }: Props) {
  if (!metrics || Object.keys(metrics).length === 0) return null

  const totalCommissions = trades.reduce((s, t) => s + (t.Commission || 0), 0)
  const totalSwap = trades.reduce((s, t) => s + (t.Swap || 0), 0)

  const largestProfit = Math.max(...trades.map((t) => t.Profit || 0))
  const largestLoss = Math.min(...trades.map((t) => t.Profit || 0))

  const leftColumn = [
    { label: 'Total P&L', value: `$${formatCompactNumber(metrics.netPnL ?? 0, 2)}`, highlight: true, isProfit: metrics.netPnL >= 0 },
    { label: 'Average daily volume', value: formatCompactNumber(metrics.avgDailyVolume ?? 0, 2) },
    { label: 'Average winning trade', value: `$${formatCompactNumber(metrics.avgTradeWinLoss ?? 0, 2)}` },
    { label: 'Average losing trade', value: `-$${formatCompactNumber(Math.abs(metrics.avgTradeWinLoss || 0), 2)}` },
    { label: 'Total number of trades', value: trades.length.toString() },
    { label: 'Number of winning trades', value: trades.filter(t => (t.Profit || 0) > 0).length.toString() },
    { label: 'Number of losing trades', value: trades.filter(t => (t.Profit || 0) < 0).length.toString() },
    { label: 'Number of break even trades', value: trades.filter(t => (t.Profit || 0) === 0).length.toString() },
    { label: 'Max consecutive wins', value: 'N/A' },
    { label: 'Max consecutive losses', value: 'N/A' },
    { label: 'Total commissions', value: `$${formatCompactNumber(totalCommissions, 2)}` },
    { label: 'Total fees', value: '$0' },
    { label: 'Total swap', value: `$${formatCompactNumber(totalSwap, 2)}` },
    { label: 'Largest profit', value: `$${formatCompactNumber(largestProfit, 2)}`, highlight: true, isProfit: true },
    { label: 'Largest loss', value: `-$${formatCompactNumber(Math.abs(largestLoss), 2)}`, highlight: true, isProfit: false },
    { label: 'Average hold time (All trades)', value: metrics.avgHoldTime ?? 'N/A' },
    { label: 'Average hold time (Winning trades)', value: 'N/A' },
    { label: 'Average hold time (Losing trades)', value: 'N/A' },
    { label: 'Average hold time (Scratch trades)', value: 'N/A' },
    { label: 'Average trade P&L', value: `$${formatCompactNumber(metrics.avgNetTradePnL ?? 0, 2)}` },
    { label: 'Profit factor', value: metrics.profitFactor?.toFixed(2) ?? '0' },
  ]

  const rightColumn = [
    { label: 'Open trades', value: trades.filter(t => !t.CloseTime).length.toString() },
    { label: 'Total trading days', value: metrics.loggedDays?.toString() ?? '0' },
    { label: 'Winning days', value: 'N/A' },
    { label: 'Losing days', value: 'N/A' },
    { label: 'Breakeven days', value: 'N/A' },
    { label: 'Logged days', value: metrics.loggedDays?.toString() ?? '0' },
    { label: 'Max consecutive winning days', value: 'N/A' },
    { label: 'Max consecutive losing days', value: 'N/A' },
    { label: 'Average daily P&L', value: `$${formatCompactNumber(metrics.avgDailyNetPnL ?? 0, 2)}` },
    { label: 'Average winning day P&L', value: `$${formatCompactNumber(metrics.avgDailyWinLoss > 0 ? metrics.avgDailyWinLoss : 0, 2)}` },
    { label: 'Average losing day P&L', value: `-$${formatCompactNumber(metrics.avgDailyWinLoss < 0 ? Math.abs(metrics.avgDailyWinLoss) : 0, 2)}` },
    { label: 'Largest profitable day', value: `$${formatCompactNumber(Math.max(...trades.map(t => t.Profit || 0)), 2)}` },
    { label: 'Largest losing day', value: `-$${formatCompactNumber(Math.abs(Math.min(...trades.map(t => t.Profit || 0))), 2)}` },
    { label: 'Average planned R-Multiple', value: `${metrics.avgPlannedRMultiple?.toFixed(2) ?? '0'}R` },
    { label: 'Average realized R-Multiple', value: `${metrics.avgRealizedRMultiple?.toFixed(2) ?? '0'}R` },
    { label: 'Trade expectancy', value: `$${formatCompactNumber(metrics.tradeExpectancy ?? 0, 2)}` },
    { label: 'Max drawdown', value: `$${formatCompactNumber(metrics.maxDailyNetDrawdown ?? 0, 2)}` },
    { label: 'Max drawdown, %', value: 'N/A' },
    { label: 'Average drawdown', value: `$${formatCompactNumber(metrics.avgDailyNetDrawdown ?? 0, 2)}` },
    { label: 'Average drawdown, %', value: 'N/A' },
  ]

  const StatRow = ({ item, idx }: { item: any; idx: number }) => (
    <div 
      key={idx} 
      className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors px-2 rounded"
    >
      <span className="text-sm text-muted-foreground">{item.label}</span>
      <span className={`text-sm font-medium ${
        item.highlight 
          ? item.isProfit ? 'text-profit' : 'text-loss'
          : 'text-foreground'
      }`}>
        {item.value}
      </span>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-0">
        {leftColumn.map((item, idx) => (
          <StatRow key={idx} item={item} idx={idx} />
        ))}
      </div>
      <div className="space-y-0">
        {rightColumn.map((item, idx) => (
          <StatRow key={idx} item={item} idx={idx} />
        ))}
      </div>
    </div>
  )
}
