"use client"

import { AlertTriangle, RotateCcw, X } from "lucide-react"
import usePropFirmStore from "@/store/propFirmStore"
import { useState } from "react"

interface PropFirmBreachBannerProps {
  type: "drawdown" | "daily_drawdown"
}

export default function PropFirmBreachBanner({ type }: PropFirmBreachBannerProps) {
  const { resetChallenge } = usePropFirmStore()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const message = type === "drawdown" 
    ? "Challenge breached – max drawdown exceeded."
    : "Challenge breached – daily drawdown exceeded."

  return (
    <div className="bg-loss/10 border border-loss/30 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-loss/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-loss" />
        </div>
        <div>
          <p className="text-sm font-semibold text-loss">{message}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your trades are still intact. Reset to start a new challenge with current settings.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={resetChallenge}
          className="flex items-center gap-2 px-4 py-2 bg-loss text-white rounded-lg text-sm font-medium hover:bg-loss/90 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Challenge
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
