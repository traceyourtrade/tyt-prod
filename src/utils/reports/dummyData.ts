export type DailyPnL = { date: string; pnl: number }

export function getDailyPnL(from = '', to = ''): DailyPnL[] {
  const days: DailyPnL[] = []
  for (let i = 0; i < 30; i++) {
    days.push({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, pnl: Math.round((Math.random() - 0.5) * 200) })
  }
  return days
}

export const sampleTrades = [
  { pnl: 120 },
  { pnl: -50 },
  { pnl: 200 },
  { pnl: -30 },
  { pnl: 80 },
]

export function sampleOverview() {
  return {
    netPnl: sampleTrades.reduce((s, t) => s + t.pnl, 0),
    avgTrade: sampleTrades.reduce((s, t) => s + t.pnl, 0) / sampleTrades.length,
    maxDd: -120,
  }
}
