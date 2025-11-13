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
    { label: 'Total P&L', value: `$${metrics.netPnL.toFixed(2)}` },
    { label: 'Average daily volume', value: metrics.avgDailyVolume.toFixed(2) },
    { label: 'Average winning trade', value: `$${metrics.avgTradeWinLoss.toFixed(2)}` },
    { label: 'Average losing trade', value: `-$${Math.abs(metrics.avgTradeWinLoss).toFixed(2)}` },
    { label: 'Total number of trades', value: trades.length.toString() },
    { label: 'Number of winning trades', value: trades.filter(t => (t.Profit || 0) > 0).length.toString() },
    { label: 'Number of losing trades', value: trades.filter(t => (t.Profit || 0) < 0).length.toString() },
    { label: 'Number of break even trades', value: trades.filter(t => (t.Profit || 0) === 0).length.toString() },
    { label: 'Max consecutive wins', value: 'N/A' },
    { label: 'Max consecutive losses', value: 'N/A' },
    { label: 'Total commissions', value: `$${totalCommissions.toFixed(2)}` },
    { label: 'Total fees', value: '$0' },
    { label: 'Total swap', value: `$${totalSwap.toFixed(2)}` },
    { label: 'Largest profit', value: `$${largestProfit.toFixed(2)}` },
    { label: 'Largest loss', value: `-$${Math.abs(largestLoss).toFixed(2)}` },
    { label: 'Average hold time (All trades)', value: metrics.avgHoldTime },
    { label: 'Average hold time (Winning trades)', value: 'N/A' },
    { label: 'Average hold time (Losing trades)', value: 'N/A' },
    { label: 'Average hold time (Scratch trades)', value: 'N/A' },
    { label: 'Average trade P&L', value: `$${metrics.avgNetTradePnL.toFixed(2)}` },
    { label: 'Profit factor', value: metrics.profitFactor.toFixed(2) },
  ]

  const rightColumn = [
    { label: 'Open trades', value: trades.filter(t => !t.CloseTime).length.toString() },
    { label: 'Total trading days', value: metrics.loggedDays.toString() },
    { label: 'Winning days', value: 'N/A' },
    { label: 'Losing days', value: 'N/A' },
    { label: 'Breakeven days', value: 'N/A' },
    { label: 'Logged days', value: metrics.loggedDays.toString() },
    { label: 'Max consecutive winning days', value: 'N/A' },
    { label: 'Max consecutive losing days', value: 'N/A' },
    { label: 'Average daily P&L', value: `$${metrics.avgDailyNetPnL.toFixed(2)}` },
    { label: 'Average winning day P&L', value: `$${metrics.avgDailyWinLoss > 0 ? metrics.avgDailyWinLoss.toFixed(2) : 0}` },
    { label: 'Average losing day P&L', value: `-$${metrics.avgDailyWinLoss < 0 ? Math.abs(metrics.avgDailyWinLoss).toFixed(2) : 0}` },
    { label: 'Largest profitable day (Profits)', value: `$${Math.max(...trades.map(t => t.Profit || 0)).toFixed(2)}` },
    { label: 'Largest losing day (Losses)', value: `-$${Math.abs(Math.min(...trades.map(t => t.Profit || 0))).toFixed(2)}` },
    { label: 'Average planned R-Multiple', value: `${metrics.avgPlannedRMultiple.toFixed(2)}R` },
    { label: 'Average realized R-Multiple', value: `${metrics.avgRealizedRMultiple.toFixed(2)}R` },
    { label: 'Trade expectancy', value: `$${metrics.tradeExpectancy.toFixed(2)}` },
    { label: 'Max drawdown', value: `$${metrics.maxDailyNetDrawdown.toFixed(2)}` },
    { label: 'Max drawdown, %', value: 'N/A' },
    { label: 'Average drawdown', value: `$${metrics.avgDailyNetDrawdown.toFixed(2)}` },
    { label: 'Average drawdown, %', value: 'N/A' },
  ]

  return (
    <div className="flex gap-6 w-full">
      <div className="flex-1 flex flex-col gap-2">
        {leftColumn.map((item, idx) => (
          <div key={idx} className="flex justify-between py-2 border-b border-[#333]">
            <div className="text-sm text-gray-400 font-medium">{item.label}</div>
            <div className="text-sm text-white font-semibold">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {rightColumn.map((item, idx) => (
          <div key={idx} className="flex justify-between py-2 border-b border-[#333]">
            <div className="text-sm text-gray-400 font-medium">{item.label}</div>
            <div className="text-sm text-white font-semibold">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
