"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react"

interface ProgressBarProps {
  label: string
  value: number
  maxValue: number
  type: "profit" | "drawdown" | "daily"
  targetLabel?: string
}

function ProgressBar({ label, value, maxValue, type, targetLabel }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100)
  
  const getBarColor = () => {
    if (type === "profit") {
      if (percentage >= 80) return "bg-profit"
      return "bg-primary"
    } else {
      if (percentage >= 85) return "bg-loss"
      if (percentage >= 60) return "bg-warning"
      return "bg-primary"
    }
  }

  const getBgColor = () => {
    if (type === "profit") {
      return "bg-primary/10"
    } else {
      if (percentage >= 85) return "bg-loss/10"
      if (percentage >= 60) return "bg-warning/10"
      return "bg-primary/10"
    }
  }

  const getTextColor = () => {
    if (type === "profit") {
      if (percentage >= 80) return "text-profit"
      return "text-primary"
    } else {
      if (percentage >= 85) return "text-loss"
      if (percentage >= 60) return "text-warning"
      return "text-foreground"
    }
  }

  const getIcon = () => {
    if (type === "profit") return TrendingUp
    if (type === "daily") return Clock
    return TrendingDown
  }

  const Icon = getIcon()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", getTextColor())} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-lg font-bold tabular-nums", getTextColor())}>
            {percentage.toFixed(1)}%
          </span>
          {targetLabel && (
            <span className="text-xs text-muted-foreground">
              {targetLabel}
            </span>
          )}
        </div>
      </div>
      
      <div className={cn("h-3 rounded-full overflow-hidden", getBgColor())}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getBarColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {(type === "drawdown" || type === "daily") && percentage >= 60 && (
        <div className={cn(
          "flex items-center gap-2 text-xs",
          percentage >= 85 ? "text-loss" : "text-warning"
        )}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {percentage >= 85 
            ? `Critical: Approaching max ${type === "daily" ? "daily " : ""}drawdown limit!`
            : `Warning: ${type === "daily" ? "Daily d" : "D"}rawdown exceeds safe zone`
          }
        </div>
      )}
    </div>
  )
}

interface PropFirmProgressBarsProps {
  currentEquity: number
  startingBalance: number
  profitTarget: number
  maxDrawdown: number
  peakEquity: number
  dailyDrawdown?: number | null
  dailyLoss?: number
}

export default function PropFirmProgressBars({
  currentEquity,
  startingBalance,
  profitTarget,
  maxDrawdown,
  peakEquity,
  dailyDrawdown,
  dailyLoss = 0,
}: PropFirmProgressBarsProps) {
  const profitTargetValue = startingBalance * (profitTarget / 100)
  const currentProfit = currentEquity - startingBalance
  const profitProgress = Math.max(currentProfit, 0)
  
  const maxDrawdownValue = startingBalance * (maxDrawdown / 100)
  const drawdownFromPeak = peakEquity - currentEquity
  const drawdownUsed = Math.max(drawdownFromPeak, 0)

  const dailyDrawdownValue = dailyDrawdown ? startingBalance * (dailyDrawdown / 100) : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <ProgressBar
            label="Target Progress"
            value={profitProgress}
            maxValue={profitTargetValue}
            type="profit"
            targetLabel={`of ${profitTarget}% target`}
          />
          <div className="mt-4 pt-4 border-t border-border/30 flex justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Current Profit</span>
              <p className={cn(
                "text-lg font-bold tabular-nums",
                currentProfit >= 0 ? "text-profit" : "text-loss"
              )}>
                {currentProfit >= 0 ? "+" : ""}{currentProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Target</span>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {profitTargetValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-5">
          <ProgressBar
            label="Max Drawdown Used"
            value={drawdownUsed}
            maxValue={maxDrawdownValue}
            type="drawdown"
            targetLabel={`of ${maxDrawdown}% max`}
          />
          <div className="mt-4 pt-4 border-t border-border/30 flex justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Drawdown Used</span>
              <p className={cn(
                "text-lg font-bold tabular-nums",
                drawdownUsed > 0 ? "text-loss" : "text-foreground"
              )}>
                {drawdownUsed > 0 ? "-" : ""}{drawdownUsed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Max Allowed</span>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {maxDrawdownValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {dailyDrawdownValue && (
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <ProgressBar
            label="Daily Drawdown Used"
            value={dailyLoss}
            maxValue={dailyDrawdownValue}
            type="daily"
            targetLabel={`of ${dailyDrawdown}% daily limit`}
          />
          <div className="mt-4 pt-4 border-t border-border/30 flex justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Today&apos;s Loss</span>
              <p className={cn(
                "text-lg font-bold tabular-nums",
                dailyLoss > 0 ? "text-loss" : "text-foreground"
              )}>
                {dailyLoss > 0 ? "-" : ""}{dailyLoss.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Daily Limit</span>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {dailyDrawdownValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
