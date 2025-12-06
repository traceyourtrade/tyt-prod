"use client"

import { AlertTriangle, RotateCcw, X, Skull } from "lucide-react"
import usePropFirmStore from "@/store/propFirmStore"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface PropFirmBreachBannerProps {
  type: "drawdown" | "daily_drawdown"
}

export default function PropFirmBreachBanner({ type }: PropFirmBreachBannerProps) {
  const { resetChallenge } = usePropFirmStore()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const message = type === "drawdown" 
    ? "Challenge Failed – Maximum drawdown limit exceeded"
    : "Challenge Failed – Daily drawdown limit exceeded"

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border backdrop-blur-sm",
      "bg-gradient-to-r from-red-500/10 via-red-600/5 to-red-500/10 dark:from-red-500/20 dark:via-red-600/10 dark:to-red-500/20",
      "border-red-500/30 shadow-lg shadow-red-500/5 dark:shadow-red-500/10"
    )}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
      
      <div className="relative p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <Skull className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-base font-bold text-red-600 dark:text-red-400">{message}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your trades are preserved. Reset to start a new challenge with current settings.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={resetChallenge}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5",
              "bg-red-500 hover:bg-red-600 text-white",
              "rounded-xl text-sm font-semibold",
              "shadow-lg shadow-red-500/25",
              "transition-all hover:scale-105"
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Challenge
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
