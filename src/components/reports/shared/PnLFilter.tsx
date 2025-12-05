"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Props = {
  initialFrom?: string
  initialTo?: string
  onApply?: (from: string, to: string) => void
}

export default function PnLFilter({ initialFrom = '', initialTo = '', onApply }: Props) {
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)

  return (
    <div className="flex gap-3 items-center">
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="rounded-lg border border-border px-3 py-2 bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
      <span className="text-sm text-muted-foreground">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="rounded-lg border border-border px-3 py-2 bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
      <button
        onClick={() => onApply?.(from, to)}
        className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Apply
      </button>
    </div>
  )
}
