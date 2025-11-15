"use client"

import { useState } from 'react'

type Props = {
  initialFrom?: string
  initialTo?: string
  onApply?: (from: string, to: string) => void
}

export default function PnLFilter({ initialFrom = '', initialTo = '', onApply }: Props) {
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)

  return (
    <div className="flex gap-2 items-center">
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="rounded-md border px-3 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
      />
      <span className="text-sm text-slate-500 dark:text-slate-300">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="rounded-md border px-3 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
      />
      <button
        onClick={() => onApply?.(from, to)}
        className="ml-2 rounded-md bg-indigo-600 text-white px-3 py-1 text-sm"
      >
        Apply
      </button>
    </div>
  )
}
