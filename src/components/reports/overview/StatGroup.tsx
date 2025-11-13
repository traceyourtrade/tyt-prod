type Props = {
  stats: any
}

export default function StatGroup({ stats }: Props) {
  return (
    <div className="flex justify-between gap-4 p-4 bg-[#2a2a2a] rounded-md">
      <div className="flex-1 flex flex-col gap-1">
        <div className="text-sm font-medium text-gray-400">Best month</div>
        <div className="text-lg font-semibold text-white">{stats.bestMonth.value}</div>
        <div className="text-xs text-gray-400">{stats.bestMonth.date}</div>
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="text-sm font-medium text-gray-400">Lowest month</div>
        <div className="text-lg font-semibold text-white">{stats.lowestMonth.value}</div>
        <div className="text-xs text-gray-400">{stats.lowestMonth.date}</div>
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="text-sm font-medium text-gray-400">Average</div>
        <div className="text-lg font-semibold text-white">{stats.average.value}</div>
        <div className="text-xs text-gray-400">{stats.average.unit}</div>
      </div>
    </div>
  )
}
