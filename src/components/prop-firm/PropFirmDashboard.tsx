"use client"

import { useMemo, useEffect, useState } from "react"
import usePropFirmStore from "@/store/propFirmStore"
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts"
import PropFirmHeroCard from "./PropFirmHeroCard"
import PropFirmQuickStats from "./PropFirmQuickStats"
import PropFirmCompactSettings from "./PropFirmCompactSettings"
import PropFirmAnalytics from "./PropFirmAnalytics"
import PropFirmBreachBanner from "./PropFirmBreachBanner"
import PropFirmSuggestions from "./PropFirmSuggestions"
import Calendar from "@/components/dashboard-components/Calendar"
import { AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Trade {
  date: string
  Profit: number
  [key: string]: unknown
}

export default function PropFirmDashboard() {
  const { settings, peakEquity, challengeStatus, updatePeakEquity, setChallengeStatus } = usePropFirmStore()
  const { selectedAccounts } = useModeFilteredAccounts()
  const [dailyBreached, setDailyBreached] = useState(false)
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false)

  const calculations = useMemo(() => {
    let totalPnL = 0
    const today = new Date().toISOString().split('T')[0]
    let todayPnL = 0
    let totalWins = 0
    let totalLosses = 0
    let winCount = 0
    let lossCount = 0
    let totalTrades = 0
    
    selectedAccounts.forEach(account => {
      if (account.tradeData && Array.isArray(account.tradeData)) {
        const challengeStart = settings.challengeStartDate ? new Date(settings.challengeStartDate) : new Date(0)
        
        account.tradeData.forEach((trade: Trade) => {
          const tradeDate = new Date(trade.date)
          if (tradeDate >= challengeStart) {
            const profit = trade.Profit || 0
            totalPnL += profit
            totalTrades++
            
            if (profit > 0) {
              totalWins += profit
              winCount++
            } else if (profit < 0) {
              totalLosses += Math.abs(profit)
              lossCount++
            }
            
            if (trade.date === today) {
              todayPnL += profit
            }
          }
        })
      }
    })

    const currentEquity = settings.startingBalance + totalPnL
    const profitTargetValue = settings.startingBalance * (settings.profitTargetPercent / 100)
    const maxDrawdownValue = settings.startingBalance * (settings.maxDrawdownPercent / 100)
    
    const dailyDrawdownValue = settings.dailyDrawdownPercent 
      ? settings.startingBalance * (settings.dailyDrawdownPercent / 100)
      : null
    
    const currentProfit = currentEquity - settings.startingBalance
    const profitProgress = (Math.max(currentProfit, 0) / profitTargetValue) * 100
    
    const drawdownFromPeak = Math.max(peakEquity, currentEquity) - currentEquity
    const drawdownUsedPercent = (drawdownFromPeak / maxDrawdownValue) * 100
    
    const dailyLoss = todayPnL < 0 ? Math.abs(todayPnL) : 0
    const dailyDrawdownUsedPercent = dailyDrawdownValue 
      ? (dailyLoss / dailyDrawdownValue) * 100 
      : 0
    const dailyDrawdownBreached = dailyDrawdownValue ? dailyLoss >= dailyDrawdownValue : false

    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0
    const avgWin = winCount > 0 ? totalWins / winCount : 0
    const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

    return {
      currentEquity,
      totalPnL,
      todayPnL,
      profitTargetValue,
      maxDrawdownValue,
      dailyDrawdownValue,
      profitProgress,
      drawdownUsedPercent,
      drawdownFromPeak,
      dailyLoss,
      dailyDrawdownUsedPercent,
      dailyDrawdownBreached,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      riskRewardRatio,
      totalTrades,
      currentProfit,
    }
  }, [selectedAccounts, settings, peakEquity])

  useEffect(() => {
    if (calculations.currentEquity > peakEquity) {
      updatePeakEquity(calculations.currentEquity)
    }
  }, [calculations.currentEquity, peakEquity, updatePeakEquity])

  useEffect(() => {
    const { drawdownUsedPercent, profitProgress, dailyDrawdownBreached } = calculations
    
    if (drawdownUsedPercent >= 100) {
      setChallengeStatus("breached")
      setDailyBreached(false)
    } else if (dailyDrawdownBreached) {
      setChallengeStatus("breached")
      setDailyBreached(true)
    } else if (profitProgress >= 100) {
      setChallengeStatus("completed")
      setDailyBreached(false)
    } else if (drawdownUsedPercent >= 70) {
      setChallengeStatus("at_risk")
      setDailyBreached(false)
    } else {
      setChallengeStatus("active")
      setDailyBreached(false)
    }
  }, [calculations, setChallengeStatus])

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6 min-w-0">
        {challengeStatus === "breached" && (
          <PropFirmBreachBanner type={dailyBreached ? "daily_drawdown" : "drawdown"} />
        )}

        <PropFirmHeroCard
          status={challengeStatus}
          startingBalance={settings.startingBalance}
          currentEquity={calculations.currentEquity}
          profitProgress={calculations.profitProgress}
          drawdownProgress={calculations.drawdownUsedPercent}
          profitTargetValue={calculations.profitTargetValue}
          maxDrawdownValue={calculations.maxDrawdownValue}
          currentProfit={calculations.currentProfit}
          drawdownUsed={calculations.drawdownFromPeak}
          challengeStartDate={settings.challengeStartDate}
        />

        {calculations.dailyDrawdownValue && (
          <div className={cn(
            "relative overflow-hidden rounded-xl border backdrop-blur-sm p-4",
            "bg-white dark:bg-transparent bg-gradient-to-br",
            calculations.dailyDrawdownUsedPercent >= 85 
              ? "from-red-500/5 to-red-600/[0.02] dark:from-red-500/10 dark:to-red-600/5 border-red-500/20" 
              : calculations.dailyDrawdownUsedPercent >= 60 
                ? "from-amber-500/5 to-amber-600/[0.02] dark:from-amber-500/10 dark:to-amber-600/5 border-amber-500/20"
                : "from-gray-50 to-gray-100/50 dark:from-white/5 dark:to-white/[0.02] border-gray-200 dark:border-white/10"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  calculations.dailyDrawdownUsedPercent >= 85 
                    ? "bg-red-500/10 dark:bg-red-500/20 border border-red-500/20"
                    : calculations.dailyDrawdownUsedPercent >= 60
                      ? "bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20"
                      : "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                )}>
                  <Clock className={cn(
                    "w-5 h-5",
                    calculations.dailyDrawdownUsedPercent >= 85 
                      ? "text-red-600 dark:text-red-400"
                      : calculations.dailyDrawdownUsedPercent >= 60
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-gray-400 dark:text-white/60"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Daily Drawdown</p>
                  <p className="text-xs text-gray-500 dark:text-white/40">
                    Today&apos;s loss: ${calculations.dailyLoss.toLocaleString()} of ${calculations.dailyDrawdownValue.toLocaleString()} limit
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-48 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      calculations.dailyDrawdownUsedPercent >= 85 
                        ? "bg-red-500"
                        : calculations.dailyDrawdownUsedPercent >= 60
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(calculations.dailyDrawdownUsedPercent, 100)}%` }}
                  />
                </div>
                <span className={cn(
                  "text-lg font-bold tabular-nums",
                  calculations.dailyDrawdownUsedPercent >= 85 
                    ? "text-red-600 dark:text-red-400"
                    : calculations.dailyDrawdownUsedPercent >= 60
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {calculations.dailyDrawdownUsedPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {calculations.dailyDrawdownUsedPercent >= 60 && (
              <div className={cn(
                "flex items-center gap-2 mt-3 pt-3 border-t text-xs",
                calculations.dailyDrawdownUsedPercent >= 85 
                  ? "border-red-500/20 text-red-600 dark:text-red-400"
                  : "border-amber-500/20 text-amber-600 dark:text-amber-400"
              )}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {calculations.dailyDrawdownUsedPercent >= 85 
                  ? "Critical: Approaching daily drawdown limit!"
                  : "Warning: Daily drawdown exceeds safe zone"
                }
              </div>
            )}
          </div>
        )}

        <PropFirmQuickStats
          netPnL={calculations.totalPnL}
          winRate={calculations.winRate}
          profitFactor={calculations.profitFactor}
          totalTrades={calculations.totalTrades}
          avgWin={calculations.avgWin}
          avgLoss={calculations.avgLoss}
          riskRewardRatio={calculations.riskRewardRatio}
          todayPnL={calculations.todayPnL}
          currentEquity={calculations.currentEquity}
        />

        <div className="w-full overflow-hidden">
          <Calendar />
        </div>

        <PropFirmCompactSettings />

        <PropFirmAnalytics />
      </div>

      <div className={cn(
        "hidden xl:block flex-shrink-0 transition-all duration-300",
        suggestionsCollapsed ? "w-16" : "w-80"
      )}>
        <div className="sticky top-6">
          <PropFirmSuggestions 
            isCollapsed={suggestionsCollapsed}
            onToggleCollapse={() => setSuggestionsCollapsed(!suggestionsCollapsed)}
          />
        </div>
      </div>
    </div>
  )
}
