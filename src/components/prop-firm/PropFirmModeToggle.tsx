"use client"

import { cn } from "@/lib/utils"
import usePropFirmStore from "@/store/propFirmStore"
import { LineChart, Target } from "lucide-react"

export default function PropFirmModeToggle() {
  const { isEnabled, setEnabled } = usePropFirmStore()

  return (
    <div className="inline-flex items-center bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
      <button
        onClick={() => setEnabled(false)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          !isEnabled 
            ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.08]" 
            : "text-white/50 hover:text-white/70"
        )}
      >
        <LineChart className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Live Trading</span>
      </button>
      <button
        onClick={() => setEnabled(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          isEnabled 
            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25" 
            : "text-white/50 hover:text-white/70"
        )}
      >
        <Target className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Prop Firm</span>
      </button>
    </div>
  )
}
