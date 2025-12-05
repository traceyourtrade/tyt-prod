"use client"

import { Target, DollarSign, TrendingUp, TrendingDown, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import PropFirmStatusPill from "./PropFirmStatusPill"

interface PropFirmSummaryCardProps {
  status: "active" | "at_risk" | "breached" | "completed"
  startingBalance: number
  currentEquity: number
  profitTargetPercent: number
  maxDrawdownPercent: number
  dailyDrawdownPercent?: number | null
  todayPnL?: number
  challengeStartDate: string | null
}

export default function PropFirmSummaryCard({
  status,
  startingBalance,
  currentEquity,
  profitTargetPercent,
  maxDrawdownPercent,
  dailyDrawdownPercent,
  todayPnL = 0,
  challengeStartDate,
}: PropFirmSummaryCardProps) {
  const profitTargetValue = startingBalance * (profitTargetPercent / 100)
  const maxDrawdownValue = startingBalance * (maxDrawdownPercent / 100)
  const dailyDrawdownValue = dailyDrawdownPercent ? startingBalance * (dailyDrawdownPercent / 100) : null
  const currentPnL = currentEquity - startingBalance
  const pnlPercent = (currentPnL / startingBalance) * 100

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-xl p-5">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Prop Firm Challenge</h2>
            <p className="text-xs text-muted-foreground">Track your challenge progress</p>
          </div>
        </div>
        <PropFirmStatusPill status={status} />
      </div>

      <div className={cn(
        "grid gap-4",
        dailyDrawdownPercent ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-4"
      )}>
        <div className="bg-card/60 border border-border/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            Starting Balance
          </div>
          <p className="text-lg font-bold tabular-nums text-foreground">
            ${startingBalance.toLocaleString()}
          </p>
        </div>

        <div className="bg-card/60 border border-border/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Current Equity
          </div>
          <p className="text-lg font-bold tabular-nums text-foreground">
            ${currentEquity.toLocaleString()}
          </p>
          <p className={cn(
            "text-xs font-medium mt-0.5",
            currentPnL >= 0 ? "text-profit" : "text-loss"
          )}>
            {currentPnL >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
          </p>
        </div>

        <div className="bg-card/60 border border-border/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-profit" />
            Profit Target
          </div>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {profitTargetPercent}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ${profitTargetValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-card/60 border border-border/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-loss" />
            Max Drawdown
          </div>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {maxDrawdownPercent}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ${maxDrawdownValue.toLocaleString()}
          </p>
        </div>

        {dailyDrawdownPercent && dailyDrawdownValue && (
          <div className="bg-card/60 border border-border/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5 text-warning" />
              Daily Drawdown
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {dailyDrawdownPercent}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ${dailyDrawdownValue.toLocaleString()}
            </p>
          </div>
        )}

        {dailyDrawdownPercent && (
          <div className="bg-card/60 border border-border/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" />
              Today&apos;s P&L
            </div>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              todayPnL >= 0 ? "text-profit" : "text-loss"
            )}>
              {todayPnL >= 0 ? "+" : ""}${Math.abs(todayPnL).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {challengeStartDate && (
        <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          Challenge started on {new Date(challengeStartDate).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      )}
    </div>
  )
}
