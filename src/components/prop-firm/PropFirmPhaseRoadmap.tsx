"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Check, Trophy, Target, TrendingDown, 
  Clock, AlertTriangle, ArrowRight, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import usePropFirmStore from "@/store/propFirmStore"
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts"

interface Trade {
  date: string
  Profit: number
  [key: string]: unknown
}

export default function PropFirmPhaseRoadmap() {
  const { 
    selectedPresetId, 
    currentPhaseIndex, 
    settings, 
    peakEquity,
    challengeStatus,
    getCurrentPhaseInfo 
  } = usePropFirmStore()
  const { selectedAccounts } = useModeFilteredAccounts()
  
  const { preset, phaseConfig } = getCurrentPhaseInfo()

  const calculations = useMemo(() => {
    let totalPnL = 0
    let tradingDays = new Set<string>()
    
    selectedAccounts.forEach(account => {
      if (account.tradeData && Array.isArray(account.tradeData)) {
        const challengeStart = settings.challengeStartDate ? new Date(settings.challengeStartDate) : new Date(0)
        
        account.tradeData.forEach((trade: Trade) => {
          const tradeDate = new Date(trade.date)
          if (tradeDate >= challengeStart) {
            const profit = trade.Profit || 0
            totalPnL += profit
            tradingDays.add(trade.date)
          }
        })
      }
    })

    const currentEquity = settings.startingBalance + totalPnL
    const profitTargetValue = settings.startingBalance * (settings.profitTargetPercent / 100)
    const maxDrawdownValue = settings.startingBalance * (settings.maxDrawdownPercent / 100)
    const currentProfit = currentEquity - settings.startingBalance
    const profitProgress = Math.min((Math.max(currentProfit, 0) / profitTargetValue) * 100, 100)
    const drawdownFromPeak = Math.max(peakEquity, currentEquity) - currentEquity
    const drawdownUsedPercent = (drawdownFromPeak / maxDrawdownValue) * 100

    return {
      currentEquity,
      totalPnL,
      profitProgress,
      drawdownUsedPercent,
      currentProfit,
      profitTargetValue,
      tradingDaysCount: tradingDays.size,
    }
  }, [selectedAccounts, settings, peakEquity])

  if (!preset) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
          <Target className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No Challenge Selected</h3>
        <p className="text-xs text-muted-foreground">Select a prop firm preset to start tracking your challenge</p>
      </div>
    )
  }

  const allPhases = [...preset.phases, preset.fundedPhase]
  const isFunded = currentPhaseIndex >= preset.phases.length

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{preset.name} Challenge</h3>
              <p className="text-xs text-muted-foreground">
                ${settings.startingBalance.toLocaleString()} account
              </p>
            </div>
          </div>
          
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold",
            challengeStatus === "completed" && "bg-emerald-500/10 text-emerald-500",
            challengeStatus === "breached" && "bg-red-500/10 text-red-500",
            challengeStatus === "at_risk" && "bg-amber-500/10 text-amber-500",
            challengeStatus === "active" && "bg-blue-500/10 text-blue-500"
          )}>
            {challengeStatus === "completed" ? "Funded!" : 
             challengeStatus === "breached" ? "Failed" :
             challengeStatus === "at_risk" ? "At Risk" : "Active"}
          </div>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          {allPhases.map((phase, idx) => {
            const isCurrentPhase = idx === currentPhaseIndex
            const isPassed = idx < currentPhaseIndex
            const isFundedPhase = idx === preset.phases.length
            
            return (
              <div key={idx} className="flex items-center flex-1">
                {/* Phase Node */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: isCurrentPhase ? 1.1 : 1 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all relative",
                      isPassed && "bg-emerald-500",
                      isCurrentPhase && !isFundedPhase && "bg-amber-500 ring-4 ring-amber-500/20",
                      isCurrentPhase && isFundedPhase && "bg-emerald-500 ring-4 ring-emerald-500/20",
                      !isPassed && !isCurrentPhase && "bg-muted border-2 border-border"
                    )}
                  >
                    {isPassed ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : isFundedPhase ? (
                      <Trophy className="w-5 h-5 text-white" />
                    ) : (
                      <span className={cn(
                        "text-sm font-bold",
                        isCurrentPhase ? "text-white" : "text-muted-foreground"
                      )}>
                        {idx + 1}
                      </span>
                    )}
                    
                    {isCurrentPhase && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border-2 border-amber-500"
                      />
                    )}
                  </motion.div>
                  
                  <span className={cn(
                    "text-xs font-medium mt-2",
                    isPassed && "text-emerald-500",
                    isCurrentPhase && "text-foreground",
                    !isPassed && !isCurrentPhase && "text-muted-foreground"
                  )}>
                    {phase.name}
                  </span>
                </div>
                
                {/* Connector Line */}
                {idx < allPhases.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 relative">
                    <div className="absolute inset-0 bg-border" />
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: isPassed ? "100%" : "0%" }}
                      className="absolute inset-y-0 left-0 bg-emerald-500"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Phase Details */}
      {phaseConfig && (
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-foreground">
                {isFunded ? "Funded Account" : `Current: ${phaseConfig.name}`}
              </h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Profit Target */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Target className="w-3.5 h-3.5 text-emerald-500" />
                  Profit Target
                </div>
                <div className="text-lg font-bold text-foreground">
                  {phaseConfig.profitTarget > 0 ? `${phaseConfig.profitTarget}%` : "N/A"}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calculations.profitProgress}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  ${calculations.currentProfit.toLocaleString()} / ${calculations.profitTargetValue.toLocaleString()}
                </p>
              </div>

              {/* Max Drawdown */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  Max Drawdown
                </div>
                <div className="text-lg font-bold text-foreground">
                  {phaseConfig.maxDrawdown}%
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(calculations.drawdownUsedPercent, 100)}%` }}
                    className={cn(
                      "h-full rounded-full",
                      calculations.drawdownUsedPercent >= 85 ? "bg-red-500" :
                      calculations.drawdownUsedPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {calculations.drawdownUsedPercent.toFixed(1)}% used
                </p>
              </div>

              {/* Daily Drawdown */}
              {phaseConfig.dailyDrawdown && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    Daily Drawdown
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {phaseConfig.dailyDrawdown}%
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Per day limit
                  </p>
                </div>
              )}

              {/* Trading Days */}
              {phaseConfig.minTradingDays && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
                    Min Trading Days
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {calculations.tradingDaysCount} / {phaseConfig.minTradingDays}
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min((calculations.tradingDaysCount / phaseConfig.minTradingDays) * 100, 100)}%` 
                      }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {Math.max(phaseConfig.minTradingDays - calculations.tradingDaysCount, 0)} more needed
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profit Split Info */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-foreground">Profit Split when Funded</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-emerald-500">
            {preset.profitSplit.initial}%
            {preset.profitSplit.scaled && (
              <>
                <ArrowRight className="w-3 h-3" />
                {preset.profitSplit.scaled}%
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
