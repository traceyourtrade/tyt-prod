import StatGroup from './StatGroup'
import StatTable from './StatTable'

type Props = {
  trades: any[]
  metrics: any
}

export default function StatsCard({ trades, metrics }: Props) {
  const monthlyPnL = {} as any // placeholder - original computed from trades

  const statsData = {
    bestMonth: { value: '$0.00', date: '' },
    lowestMonth: { value: '$0.00', date: '' },
    average: { value: `$${metrics?.avgDailyNetPnL?.toFixed?.(2) ?? '0.00'}`, unit: 'per Day' },
  }

  return (
    <div className="bg-[#1e1e1e] rounded-xl shadow-md p-6 mb-6 border border-[#333] transition">
      <div className="flex items-center gap-2 mb-4 px-2">
        <h2 className="text-base font-semibold text-white m-0">YOUR STATS <span className="text-gray-400 text-sm">ⓘ</span></h2>
        <p className="text-sm uppercase text-gray-400 m-0">(ALL DATES)</p>
      </div>
      <div className="flex flex-col gap-6">
        <StatGroup stats={statsData} />
        <StatTable trades={trades} metrics={metrics} />
      </div>
    </div>
  )
}
