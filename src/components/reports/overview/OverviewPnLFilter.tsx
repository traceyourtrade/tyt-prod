"use client"

import { ChevronDown } from 'lucide-react'

type Props = {
  pnlType: string
  setPnlType: (v: string) => void
}

export default function OverviewPnLFilter({ pnlType, setPnlType }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
        P&L Showing
      </span>
      <div className="relative">
        <select
          value={pnlType}
          onChange={(e) => setPnlType(e.target.value)}
          className="appearance-none px-4 py-2 pr-10 border border-border rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
        >
          <option value="net_pnl">Net P&L</option>
          <option value="gross_pnl">Gross P&L</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  )
}
