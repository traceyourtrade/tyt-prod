"use client"

import { useState } from "react"
import { Settings, DollarSign, Percent, TrendingDown, ChevronDown, RotateCcw, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import usePropFirmStore from "@/store/propFirmStore"
import { motion, AnimatePresence } from "framer-motion"

export default function PropFirmCompactSettings() {
  const { settings, updateSettings, resetChallenge } = usePropFirmStore()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border backdrop-blur-sm",
      "bg-card",
      "bg-gradient-to-br from-secondary/50 to-secondary/30 dark:from-white/5 dark:to-white/[0.02]",
      "border-border/60 dark:border-white/10",
      isExpanded && "border-amber-500/20"
    )}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10",
            "border border-amber-500/20"
          )}>
            <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">Challenge Settings</h3>
            <p className="text-xs text-muted-foreground">
              ${settings.startingBalance.toLocaleString()} | {settings.profitTargetPercent}% target | {settings.maxDrawdownPercent}% max DD
            </p>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/60 dark:border-white/5 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                    <DollarSign className="w-3.5 h-3.5" />
                    Starting Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={settings.startingBalance}
                      onChange={(e) => updateSettings({ startingBalance: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-4 py-2.5 bg-secondary/70 dark:bg-white/5 border border-border/60 dark:border-white/10 rounded-lg text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Profit Target
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.profitTargetPercent}
                      onChange={(e) => updateSettings({ profitTargetPercent: parseFloat(e.target.value) || 0 })}
                      step="0.5"
                      min="0"
                      max="100"
                      className="w-full pl-4 pr-8 py-2.5 bg-secondary/70 dark:bg-white/5 border border-border/60 dark:border-white/10 rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                    <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    Max Drawdown
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.maxDrawdownPercent}
                      onChange={(e) => updateSettings({ maxDrawdownPercent: parseFloat(e.target.value) || 0 })}
                      step="0.5"
                      min="0"
                      max="100"
                      className="w-full pl-4 pr-8 py-2.5 bg-secondary/70 dark:bg-white/5 border border-border/60 dark:border-white/10 rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Daily DD (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.dailyDrawdownPercent || ""}
                      onChange={(e) => updateSettings({ dailyDrawdownPercent: parseFloat(e.target.value) || null })}
                      placeholder="Not set"
                      step="0.5"
                      min="0"
                      max="100"
                      className="w-full pl-4 pr-8 py-2.5 bg-secondary/70 dark:bg-white/5 border border-border/60 dark:border-white/10 rounded-lg text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 dark:border-white/5">
                <div className="text-xs text-muted-foreground">
                  Started: {settings.challengeStartDate 
                    ? new Date(settings.challengeStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : "Not started"
                  }
                </div>
                <button
                  onClick={resetChallenge}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 rounded-lg border border-amber-500/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Challenge
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
