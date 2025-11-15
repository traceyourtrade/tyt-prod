"use client"

type Props = {
  pnlType: string
  setPnlType: (v: string) => void
}

export default function OverviewPnLFilter({ pnlType, setPnlType }: Props) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="text-xs font-semibold uppercase text-gray-400">P&L SHOWING</div>
      <select
        value={pnlType}
        onChange={(e) => setPnlType(e.target.value)}
        className="px-4 py-2 border border-[#333] rounded-md bg-[#2a2a2a] text-sm text-white hover:bg-[#2c2c2c] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
      >
        <option value="net_pnl">NET P&L</option>
        <option value="gross_pnl">GROSS P&L</option>
      </select>
    </div>
  )
}
