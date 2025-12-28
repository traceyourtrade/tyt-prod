"use client"

import { useMemo, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import usePropFirmStore from "@/store/propFirmStore"
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts"
import PropFirmHeroCard from "./PropFirmHeroCard"
import PropFirmQuickStats from "./PropFirmQuickStats"
import PropFirmCompactSettings from "./PropFirmCompactSettings"
import PropFirmAnalytics from "./PropFirmAnalytics"
import PropFirmBreachBanner from "./PropFirmBreachBanner"
import PropFirmSuggestions from "./PropFirmSuggestions"
import PropFirmPhaseRoadmap from "./PropFirmPhaseRoadmap"
import PropFirmPresetSelector from "./PropFirmPresetSelector"
import PropFirmChallengeHistory from "./PropFirmChallengeHistory"
import PropFirmScaleUpCalculator from "./PropFirmScaleUpCalculator"
import PropFirmChallengeOverview from "./PropFirmChallengeOverview"
import Calendar from "@/components/dashboard-components/Calendar"
import { 
  AlertTriangle, Clock, Building2, X, History, Calculator, 
  ChevronRight, LayoutGrid, Eye, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Trade {
  date: string
  Profit: number
  [key: string]: unknown
}

type TabType = "portfolio" | "details" | "history" | "calculator"

export default function PropFirmDashboard() {
  const { 
    settings: globalSettings, 
    peakEquity: globalPeakEquity, 
    challengeStatus, 
    updatePeakEquity, 
    setChallengeStatus,
    alertThresholds,
    checkAndLogViolation,
    getAllActiveChallenges,
    getActiveChallenge,
    setViewingChallenge,
    viewingChallengeId,
    updateChallengeMetrics,
    setChallengeStatusById,
    checkAndLogChallengeViolation,
  } = usePropFirmStore()
  const { selectedAccounts } = useModeFilteredAccounts()
  const [dailyBreached, setDailyBreached] = useState(false)
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false)
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("portfolio")

  const activeChallenges = getAllActiveChallenges()
  const viewingChallenge = getActiveChallenge()

  // Use viewing challenge's settings if available, otherwise fall back to global
  const settings = viewingChallenge?.settings || globalSettings
  const peakEquity = viewingChallenge?.peakEquity || globalPeakEquity

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

  // Update peak equity and challenge metrics
  useEffect(() => {
    if (calculations.currentEquity > peakEquity) {
      updatePeakEquity(calculations.currentEquity)
    }
    
    // Update per-challenge metrics if viewing a challenge
    if (viewingChallengeId) {
      updateChallengeMetrics(viewingChallengeId, {
        totalPnL: calculations.totalPnL,
        currentEquity: calculations.currentEquity,
      })
    }
  }, [calculations.currentEquity, calculations.totalPnL, peakEquity, updatePeakEquity, viewingChallengeId, updateChallengeMetrics])

  // Update challenge status based on calculations
  useEffect(() => {
    const { drawdownUsedPercent, profitProgress, dailyDrawdownBreached } = calculations
    
    let newStatus: "breached" | "completed" | "at_risk" | "active" = "active"
    
    if (drawdownUsedPercent >= 100) {
      newStatus = "breached"
      setDailyBreached(false)
    } else if (dailyDrawdownBreached) {
      newStatus = "breached"
      setDailyBreached(true)
    } else if (profitProgress >= 100) {
      newStatus = "completed"
      setDailyBreached(false)
    } else if (drawdownUsedPercent >= alertThresholds.warning) {
      newStatus = "at_risk"
      setDailyBreached(false)
    } else {
      setDailyBreached(false)
    }
    
    // Update per-challenge status if viewing a challenge
    if (viewingChallengeId) {
      setChallengeStatusById(viewingChallengeId, newStatus)
    }
    setChallengeStatus(newStatus)
  }, [calculations, setChallengeStatus, alertThresholds, viewingChallengeId, setChallengeStatusById])

  // Log violations for the viewing challenge
  useEffect(() => {
    const { drawdownUsedPercent, dailyDrawdownUsedPercent, maxDrawdownValue, dailyDrawdownValue } = calculations
    
    if (!viewingChallengeId) return
    
    if (drawdownUsedPercent >= alertThresholds.critical) {
      checkAndLogChallengeViolation(
        viewingChallengeId,
        "max_drawdown",
        "critical",
        `Max drawdown at ${drawdownUsedPercent.toFixed(1)}% - CRITICAL LEVEL`,
        calculations.drawdownFromPeak,
        maxDrawdownValue
      )
    } else if (drawdownUsedPercent >= alertThresholds.warning) {
      checkAndLogChallengeViolation(
        viewingChallengeId,
        "max_drawdown",
        "warning",
        `Max drawdown at ${drawdownUsedPercent.toFixed(1)}% - approaching limit`,
        calculations.drawdownFromPeak,
        maxDrawdownValue
      )
    }

    if (dailyDrawdownValue && dailyDrawdownUsedPercent >= alertThresholds.critical) {
      checkAndLogChallengeViolation(
        viewingChallengeId,
        "daily_drawdown",
        "critical",
        `Daily drawdown at ${dailyDrawdownUsedPercent.toFixed(1)}% - CRITICAL LEVEL`,
        calculations.dailyLoss,
        dailyDrawdownValue
      )
    }
  }, [calculations, alertThresholds, viewingChallengeId, checkAndLogChallengeViolation])

  const handleAddChallenge = () => {
    setShowPresetModal(true)
  }

  const handleSelectChallenge = (challengeId: string) => {
    setViewingChallenge(challengeId)
    setActiveTab("details")
  }

  const tabs = [
    { id: "portfolio" as const, label: "Portfolio", icon: LayoutGrid },
    { id: "details" as const, label: "Details", icon: Eye, disabled: activeChallenges.length === 0 },
    { id: "history" as const, label: "History", icon: History },
    { id: "calculator" as const, label: "Calculator", icon: Calculator },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Tab Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Challenge Selector (when viewing details) */}
        {activeTab === "details" && activeChallenges.length > 1 && viewingChallenge && (
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/50 text-foreground hover:border-border transition-all text-sm font-medium"
            >
              <Building2 className="w-4 h-4 text-amber-500" />
              {viewingChallenge.name}
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50 ml-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          {/* Portfolio Tab - Multi-Challenge Overview */}
          {activeTab === "portfolio" && (
            <PropFirmChallengeOverview
              onAddChallenge={handleAddChallenge}
              onSelectChallenge={handleSelectChallenge}
            />
          )}

          {/* Details Tab - Single Challenge View */}
          {activeTab === "details" && viewingChallenge && (
            <>
              {challengeStatus === "breached" && (
                <PropFirmBreachBanner type={dailyBreached ? "daily_drawdown" : "drawdown"} />
              )}

              <PropFirmPhaseRoadmap />

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
                  calculations.dailyDrawdownUsedPercent >= alertThresholds.critical 
                    ? "from-red-500/5 to-red-600/[0.02] dark:from-red-500/10 dark:to-red-600/5 border-red-500/20" 
                    : calculations.dailyDrawdownUsedPercent >= alertThresholds.warning 
                      ? "from-amber-500/5 to-amber-600/[0.02] dark:from-amber-500/10 dark:to-amber-600/5 border-amber-500/20"
                      : "from-gray-50 to-gray-100/50 dark:from-white/5 dark:to-white/[0.02] border-gray-200 dark:border-white/10"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        calculations.dailyDrawdownUsedPercent >= alertThresholds.critical 
                          ? "bg-red-500/10 dark:bg-red-500/20 border border-red-500/20"
                          : calculations.dailyDrawdownUsedPercent >= alertThresholds.warning
                            ? "bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20"
                            : "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                      )}>
                        <Clock className={cn(
                          "w-5 h-5",
                          calculations.dailyDrawdownUsedPercent >= alertThresholds.critical 
                            ? "text-red-600 dark:text-red-400"
                            : calculations.dailyDrawdownUsedPercent >= alertThresholds.warning
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
                            calculations.dailyDrawdownUsedPercent >= alertThresholds.critical 
                              ? "bg-red-500"
                              : calculations.dailyDrawdownUsedPercent >= alertThresholds.warning
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(calculations.dailyDrawdownUsedPercent, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-lg font-bold tabular-nums",
                        calculations.dailyDrawdownUsedPercent >= alertThresholds.critical 
                          ? "text-red-600 dark:text-red-400"
                          : calculations.dailyDrawdownUsedPercent >= alertThresholds.warning
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {calculations.dailyDrawdownUsedPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {calculations.dailyDrawdownUsedPercent >= alertThresholds.warning && (
                    <div className={cn(
                      "flex items-center gap-2 mt-3 pt-3 border-t text-xs",
                      calculations.dailyDrawdownUsedPercent >= alertThresholds.critical 
                        ? "border-red-500/20 text-red-600 dark:text-red-400"
                        : "border-amber-500/20 text-amber-600 dark:text-amber-400"
                    )}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {calculations.dailyDrawdownUsedPercent >= alertThresholds.critical 
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
            </>
          )}

          {/* Details Tab - No Challenge Selected */}
          {activeTab === "details" && !viewingChallenge && activeChallenges.length > 0 && (
            <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a Challenge</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose a challenge from the Portfolio tab to view its details.
              </p>
              <button
                onClick={() => setActiveTab("portfolio")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
              >
                <LayoutGrid className="w-5 h-5" />
                View Portfolio
              </button>
            </div>
          )}

          {activeTab === "history" && (
            <PropFirmChallengeHistory />
          )}

          {activeTab === "calculator" && (
            <PropFirmScaleUpCalculator />
          )}
        </div>

        {(activeTab === "details" || activeTab === "portfolio") && (
          <div className={cn(
            "hidden xl:block flex-shrink-0 transition-all duration-300 overflow-hidden",
            suggestionsCollapsed ? "w-14" : "w-80"
          )}>
            <div className="sticky top-6">
              <PropFirmSuggestions 
                isCollapsed={suggestionsCollapsed}
                onToggleCollapse={() => setSuggestionsCollapsed(!suggestionsCollapsed)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Preset Selection Modal */}
      <AnimatePresence>
        {showPresetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPresetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-amber-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Add Challenge</h2>
                    <p className="text-xs text-muted-foreground">
                      {activeChallenges.length}/4 challenges active
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPresetModal(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                <PropFirmPresetSelector onSelect={() => {
                  setShowPresetModal(false)
                  setActiveTab("details")
                }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
