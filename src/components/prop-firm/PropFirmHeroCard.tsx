"use client"

import { Target, Zap, TrendingUp, TrendingDown, Shield, Calendar, Clock, AlertTriangle, Trophy, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface PropFirmHeroCardProps {
  status: "active" | "at_risk" | "breached" | "completed"
  startingBalance: number
  currentEquity: number
  profitProgress: number
  drawdownProgress: number
  profitTargetValue: number
  maxDrawdownValue: number
  currentProfit: number
  drawdownUsed: number
  challengeStartDate: string | null
}

function CircularProgress({ 
  progress, 
  size = 140, 
  strokeWidth = 10, 
  type = "profit" 
}: { 
  progress: number
  size?: number
  strokeWidth?: number
  type?: "profit" | "drawdown"
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const cappedProgress = Math.min(Math.max(progress, 0), 100)
  const offset = circumference - (cappedProgress / 100) * circumference

  const getGradientColors = () => {
    if (type === "profit") {
      if (progress >= 80) return { start: "#22C55E", end: "#16A34A" }
      if (progress >= 50) return { start: "#F59E0B", end: "#D97706" }
      return { start: "#F59E0B", end: "#EA580C" }
    } else {
      if (progress >= 85) return { start: "#EF4444", end: "#DC2626" }
      if (progress >= 60) return { start: "#F59E0B", end: "#EA580C" }
      return { start: "#22C55E", end: "#16A34A" }
    }
  }

  const colors = getGradientColors()
  const gradientId = `gradient-${type}-${progress}`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.start}40)`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white tabular-nums">
          {cappedProgress.toFixed(0)}%
        </span>
        <span className="text-xs text-white/60 uppercase tracking-wider">
          {type === "profit" ? "Target" : "DD Used"}
        </span>
      </div>
    </div>
  )
}

export default function PropFirmHeroCard({
  status,
  startingBalance,
  currentEquity,
  profitProgress,
  drawdownProgress,
  profitTargetValue,
  maxDrawdownValue,
  currentProfit,
  drawdownUsed,
  challengeStartDate,
}: PropFirmHeroCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          label: "Challenge Complete",
          icon: Trophy,
          bgClass: "from-emerald-500/20 via-emerald-600/10 to-transparent",
          borderClass: "border-emerald-500/30",
          glowClass: "shadow-emerald-500/20",
          textClass: "text-emerald-400",
          dotClass: "bg-emerald-400"
        }
      case "breached":
        return {
          label: "Challenge Failed",
          icon: AlertTriangle,
          bgClass: "from-red-500/20 via-red-600/10 to-transparent",
          borderClass: "border-red-500/30",
          glowClass: "shadow-red-500/20",
          textClass: "text-red-400",
          dotClass: "bg-red-400"
        }
      case "at_risk":
        return {
          label: "At Risk",
          icon: Flame,
          bgClass: "from-amber-500/20 via-orange-600/10 to-transparent",
          borderClass: "border-amber-500/30",
          glowClass: "shadow-amber-500/20",
          textClass: "text-amber-400",
          dotClass: "bg-amber-400 animate-pulse"
        }
      default:
        return {
          label: "Active",
          icon: Zap,
          bgClass: "from-amber-500/10 via-amber-600/5 to-transparent",
          borderClass: "border-amber-500/20",
          glowClass: "shadow-amber-500/10",
          textClass: "text-amber-400",
          dotClass: "bg-amber-400"
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon
  const daysActive = challengeStartDate 
    ? Math.floor((new Date().getTime() - new Date(challengeStartDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border backdrop-blur-xl",
      "bg-gradient-to-br",
      statusConfig.bgClass,
      statusConfig.borderClass,
      "shadow-2xl",
      statusConfig.glowClass
    )}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
                  "border border-amber-500/20"
                )}>
                  <Target className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Prop Firm Challenge</h2>
                  <p className="text-sm text-white/50">Track your progress towards funding</p>
                </div>
              </div>
              
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-white/5 border",
                statusConfig.borderClass
              )}>
                <div className={cn("w-2 h-2 rounded-full", statusConfig.dotClass)} />
                <StatusIcon className={cn("w-4 h-4", statusConfig.textClass)} />
                <span className={cn("text-sm font-medium", statusConfig.textClass)}>
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  Starting Balance
                </div>
                <p className="text-xl font-bold text-white tabular-nums">
                  ${startingBalance.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Current Equity
                </div>
                <p className="text-xl font-bold text-white tabular-nums">
                  ${currentEquity.toLocaleString()}
                </p>
                <p className={cn(
                  "text-xs font-medium mt-1",
                  currentProfit >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {currentProfit >= 0 ? "+" : ""}{((currentProfit / startingBalance) * 100).toFixed(2)}%
                </p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Days Active
                </div>
                <p className="text-xl font-bold text-white tabular-nums">
                  {daysActive}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  days
                </p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  Profit/Loss
                </div>
                <p className={cn(
                  "text-xl font-bold tabular-nums",
                  currentProfit >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {currentProfit >= 0 ? "+" : ""}${Math.abs(currentProfit).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 lg:gap-12">
            <div className="text-center">
              <CircularProgress progress={profitProgress} type="profit" />
              <div className="mt-3 space-y-1">
                <p className="text-xs text-white/50">Profit Target</p>
                <p className="text-sm font-semibold text-white">
                  ${profitTargetValue.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <CircularProgress progress={drawdownProgress} type="drawdown" />
              <div className="mt-3 space-y-1">
                <p className="text-xs text-white/50">Max Drawdown</p>
                <p className="text-sm font-semibold text-white">
                  ${maxDrawdownValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
