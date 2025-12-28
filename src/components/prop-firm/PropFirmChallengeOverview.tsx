"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Trophy, TrendingUp, TrendingDown, AlertTriangle,
  Plus, Target, DollarSign, Percent, Check, X,
  ChevronRight, Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import usePropFirmStore, { PropChallenge } from "@/store/propFirmStore"
import { getPresetById } from "@/lib/prop-firm-presets"

interface PropFirmChallengeOverviewProps {
  onAddChallenge: () => void
  onSelectChallenge: (challengeId: string) => void
}

export default function PropFirmChallengeOverview({ 
  onAddChallenge, 
  onSelectChallenge 
}: PropFirmChallengeOverviewProps) {
  const { 
    getAllActiveChallenges, 
    getAggregateStats,
    viewingChallengeId,
    challenges 
  } = usePropFirmStore()

  const activeChallenges = getAllActiveChallenges()
  const stats = getAggregateStats()
  const allChallenges = Object.values(challenges)
  const completedChallenges = allChallenges.filter(c => c.status === "completed" || c.status === "breached")

  if (activeChallenges.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Active Challenges</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Start tracking your prop firm challenges. You can manage up to 4 challenges simultaneously.
        </p>
        <button
          onClick={onAddChallenge}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Your First Challenge
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Aggregate Stats Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Portfolio Overview</h3>
              <p className="text-xs text-muted-foreground">{stats.activeChallenges} active challenge{stats.activeChallenges !== 1 ? "s" : ""}</p>
            </div>
          </div>
          
          {activeChallenges.length < 4 && (
            <button
              onClick={onAddChallenge}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Challenge
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              Total Capital
            </div>
            <div className="text-xl font-bold text-foreground">
              ${stats.totalCapital.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Total P&L
            </div>
            <div className={cn(
              "text-xl font-bold",
              stats.totalPnL >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="w-3.5 h-3.5" />
              Active
            </div>
            <div className="text-xl font-bold text-foreground">
              {stats.activeChallenges}
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              At Risk
            </div>
            <div className={cn(
              "text-xl font-bold",
              stats.atRiskCount > 0 ? "text-amber-500" : "text-foreground"
            )}>
              {stats.atRiskCount}
            </div>
          </div>
        </div>
      </div>

      {/* Active Challenges Grid */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Active Challenges
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isViewing={viewingChallengeId === challenge.id}
              onClick={() => onSelectChallenge(challenge.id)}
            />
          ))}
        </div>
      </div>

      {/* Completed/Failed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            Completed Challenges ({completedChallenges.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedChallenges.slice(0, 4).map((challenge) => (
              <CompletedChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ChallengeCardProps {
  challenge: PropChallenge
  isViewing: boolean
  onClick: () => void
}

function ChallengeCard({ challenge, isViewing, onClick }: ChallengeCardProps) {
  const preset = getPresetById(challenge.presetId)
  
  const calculations = useMemo(() => {
    const currentEquity = challenge.accountSize + challenge.totalPnL
    const profitTargetValue = challenge.accountSize * (challenge.settings.profitTargetPercent / 100)
    const maxDrawdownValue = challenge.accountSize * (challenge.settings.maxDrawdownPercent / 100)
    const currentProfit = currentEquity - challenge.accountSize
    const profitProgress = Math.min((Math.max(currentProfit, 0) / profitTargetValue) * 100, 100)
    const drawdownFromPeak = Math.max(challenge.peakEquity, currentEquity) - currentEquity
    const drawdownUsedPercent = (drawdownFromPeak / maxDrawdownValue) * 100
    
    return {
      currentEquity,
      profitProgress,
      drawdownUsedPercent,
      currentProfit,
    }
  }, [challenge])

  const statusConfig = {
    active: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Active" },
    at_risk: { color: "text-amber-500", bg: "bg-amber-500/10", label: "At Risk" },
    completed: { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Funded" },
    breached: { color: "text-red-500", bg: "bg-red-500/10", label: "Failed" },
  }

  const status = statusConfig[challenge.status]

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        isViewing 
          ? "border-amber-500/50 bg-amber-500/5 ring-2 ring-amber-500/20" 
          : "border-border/50 bg-card hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground truncate">{challenge.name}</h4>
            {isViewing && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500">
                Viewing
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {preset?.name || challenge.presetName} • Phase {challenge.currentPhaseIndex + 1}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.bg, status.color)}>
            {status.label}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-500" />
              Profit Target
            </span>
            <span className="font-medium text-foreground">{calculations.profitProgress.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${calculations.profitProgress}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              Drawdown Used
            </span>
            <span className={cn(
              "font-medium",
              calculations.drawdownUsedPercent >= 85 ? "text-red-500" :
              calculations.drawdownUsedPercent >= 70 ? "text-amber-500" : "text-foreground"
            )}>
              {calculations.drawdownUsedPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                calculations.drawdownUsedPercent >= 85 ? "bg-red-500" :
                calculations.drawdownUsedPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(calculations.drawdownUsedPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="text-xs">
          <span className="text-muted-foreground">Capital: </span>
          <span className="font-medium text-foreground">${challenge.accountSize.toLocaleString()}</span>
        </div>
        <div className={cn(
          "text-xs font-semibold",
          challenge.totalPnL >= 0 ? "text-emerald-500" : "text-red-500"
        )}>
          {challenge.totalPnL >= 0 ? "+" : ""}${challenge.totalPnL.toLocaleString()}
        </div>
      </div>
    </motion.button>
  )
}

function CompletedChallengeCard({ challenge }: { challenge: PropChallenge }) {
  const isPassed = challenge.status === "completed"
  
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      isPassed 
        ? "border-emerald-500/20 bg-emerald-500/5" 
        : "border-red-500/20 bg-red-500/5"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            isPassed ? "bg-emerald-500" : "bg-red-500"
          )}>
            {isPassed ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <X className="w-3.5 h-3.5 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{challenge.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(challenge.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className={cn(
          "text-sm font-semibold",
          challenge.totalPnL >= 0 ? "text-emerald-500" : "text-red-500"
        )}>
          {challenge.totalPnL >= 0 ? "+" : ""}${challenge.totalPnL.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
