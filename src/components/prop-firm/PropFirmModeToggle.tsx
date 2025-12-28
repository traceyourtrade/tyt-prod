"use client"

import { cn } from "@/lib/utils"
import usePropFirmStore from "@/store/propFirmStore"
import { LineChart, Target } from "lucide-react"

export default function PropFirmModeToggle() {
  const { isEnabled, setEnabled } = usePropFirmStore()

  return (
    <div className="inline-flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
      <button
        onClick={() => setEnabled(false)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          !isEnabled 
            ? "bg-card text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LineChart className="w-4 h-4" />
        <span className="hidden sm:inline">Live Trading</span>
      </button>
      <button
        onClick={() => setEnabled(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          isEnabled 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Target className="w-4 h-4" />
        <span className="hidden sm:inline">Prop Firm</span>
      </button>
    </div>
  )
}
