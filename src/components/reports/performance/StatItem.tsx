type Props = {
  label: string
  value: string | number
  infoTooltip?: string
}

export default function StatItem({ label, value, infoTooltip = '' }: Props) {
  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-3 flex flex-col justify-between">
      <div className="flex items-start gap-2">
        <div className="text-sm text-gray-400 font-medium">{label}</div>
        {infoTooltip && (
          <div className="relative group">
            <span className="text-gray-400 text-sm">ℹ️</span>
            <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-48 bg-[#0f0f0f] text-xs text-gray-200 p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition">
              {infoTooltip}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}
