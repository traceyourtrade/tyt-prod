"use client"

import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore"

type Props = {
  trades: any[]
  metrics: any
}

export default function StatTable({ trades, metrics }: Props) {
  const { currency, exchangeRate } = useCurrencyStore()
  if (!metrics || Object.keys(metrics).length === 0) return null

  const totalCommissions = trades.reduce((s, t) => s + (t.Commission || 0), 0)
  const totalSwap = trades.reduce((s, t) => s + (t.Swap || 0), 0)

  const largestProfit = Math.max(...trades.map((t) => t.Profit || 0))
  const largestLoss = Math.min(...trades.map((t) => t.Profit || 0))

  const leftColumn = [
    { label: 'Total P&L', value: formatCompactCurrency(metrics.netPnL ?? 0, currency, exchangeRate), highlight: true, isProfit: metrics.netPnL >= 0 },
    { label: 'Average daily volume', value: (metrics.avgDailyVolume ?? 0).toFixed(2) },
    { label: 'Average winning trade', value: formatCompactCurrency(metrics.avgTradeWinLoss ?? 0, currency, exchangeRate) },
    { label: 'Average losing trade', value: formatCompactCurrency(-(Math.abs(metrics.avgTradeWinLoss || 0)), currency, exchangeRate) },
    { label: 'Total number of trades', value: trades.length.toString() },
    { label: 'Number of winning trades', value: trades.filter(t => (t.Profit || 0) > 0).length.toString() },
    { label: 'Number of losing trades', value: trades.filter(t => (t.Profit || 0) < 0).length.toString() },
    { label: 'Number of break even trades', value: trades.filter(t => (t.Profit || 0) === 0).length.toString() },
    { label: 'Max consecutive wins', value: 'N/A' },
    { label: 'Max consecutive losses', value: 'N/A' },
    { label: 'Total commissions', value: formatCompactCurrency(totalCommissions, currency, exchangeRate) },
    { label: 'Total fees', value: formatCompactCurrency(0, currency, exchangeRate) },
    { label: 'Total swap', value: formatCompactCurrency(totalSwap, currency, exchangeRate) },
    { label: 'Largest profit', value: formatCompactCurrency(largestProfit, currency, exchangeRate), highlight: true, isProfit: true },
    { label: 'Largest loss', value: formatCompactCurrency(largestLoss, currency, exchangeRate), highlight: true, isProfit: false },
    { label: 'Average hold time (All trades)', value: metrics.avgHoldTime ?? 'N/A' },
    { label: 'Average hold time (Winning trades)', value: 'N/A' },
    { label: 'Average hold time (Losing trades)', value: 'N/A' },
    { label: 'Average hold time (Scratch trades)', value: 'N/A' },
    { label: 'Average trade P&L', value: formatCompactCurrency(metrics.avgNetTradePnL ?? 0, currency, exchangeRate) },
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
    { label: 'Average daily P&L', value: formatCompactCurrency(metrics.avgDailyNetPnL ?? 0, currency, exchangeRate) },
    { label: 'Average winning day P&L', value: formatCompactCurrency(metrics.avgDailyWinLoss > 0 ? metrics.avgDailyWinLoss : 0, currency, exchangeRate) },
    { label: 'Average losing day P&L', value: formatCompactCurrency(metrics.avgDailyWinLoss < 0 ? metrics.avgDailyWinLoss : 0, currency, exchangeRate) },
    { label: 'Largest profitable day', value: formatCompactCurrency(Math.max(...trades.map(t => t.Profit || 0)), currency, exchangeRate) },
    { label: 'Largest losing day', value: formatCompactCurrency(Math.min(...trades.map(t => t.Profit || 0)), currency, exchangeRate) },
    { label: 'Average planned R-Multiple', value: `${metrics.avgPlannedRMultiple?.toFixed(2) ?? '0'}R` },
    { label: 'Average realized R-Multiple', value: `${metrics.avgRealizedRMultiple?.toFixed(2) ?? '0'}R` },
    { label: 'Trade expectancy', value: formatCompactCurrency(metrics.tradeExpectancy ?? 0, currency, exchangeRate) },
    { label: 'Max drawdown', value: formatCompactCurrency(metrics.maxDailyNetDrawdown ?? 0, currency, exchangeRate) },
    { label: 'Max drawdown, %', value: 'N/A' },
    { label: 'Average drawdown', value: formatCompactCurrency(metrics.avgDailyNetDrawdown ?? 0, currency, exchangeRate) },
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
