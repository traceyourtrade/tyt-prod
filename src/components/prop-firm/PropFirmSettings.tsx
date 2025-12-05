"use client"

import { useState } from "react"
import { Settings, DollarSign, Percent, TrendingDown, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import usePropFirmStore from "@/store/propFirmStore"

const drawdownOptions = [
  { label: "5%", value: 5 },
  { label: "10%", value: 10 },
  { label: "12%", value: 12 },
  { label: "Custom", value: -1 },
]

export default function PropFirmSettings() {
  const { settings, updateSettings, resetChallenge } = usePropFirmStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [customDrawdown, setCustomDrawdown] = useState(
    !drawdownOptions.find(o => o.value === settings.maxDrawdownPercent) 
      ? settings.maxDrawdownPercent 
      : 0
  )
  const [isCustomDrawdown, setIsCustomDrawdown] = useState(
    !drawdownOptions.find(o => o.value === settings.maxDrawdownPercent)
  )

  const handleDrawdownChange = (value: number) => {
    if (value === -1) {
      setIsCustomDrawdown(true)
    } else {
      setIsCustomDrawdown(false)
      updateSettings({ maxDrawdownPercent: value })
    }
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">Challenge Settings</h3>
            <p className="text-xs text-muted-foreground">Configure your prop firm challenge parameters</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-border/50 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  className="w-full pl-7 pr-4 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                <Percent className="w-3.5 h-3.5" />
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
                  className="w-full pl-4 pr-8 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                <TrendingDown className="w-3.5 h-3.5" />
                Max Drawdown
              </label>
              {isCustomDrawdown ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={customDrawdown || settings.maxDrawdownPercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setCustomDrawdown(val)
                        updateSettings({ maxDrawdownPercent: val })
                      }}
                      step="0.5"
                      min="0"
                      max="100"
                      className="w-full pl-4 pr-8 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsCustomDrawdown(false)
                      updateSettings({ maxDrawdownPercent: 10 })
                    }}
                    className="px-3 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <select
                  value={settings.maxDrawdownPercent}
                  onChange={(e) => handleDrawdownChange(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all cursor-pointer"
                >
                  {drawdownOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-card">
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                <TrendingDown className="w-3.5 h-3.5" />
                Daily Drawdown (Optional)
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
                  className="w-full pl-4 pr-8 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-foreground font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="text-xs text-muted-foreground">
              Challenge started: {settings.challengeStartDate || "Not started"}
            </div>
            <button
              onClick={resetChallenge}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
