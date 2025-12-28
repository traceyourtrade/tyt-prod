"use client"

import { Target, Zap, TrendingUp, Shield, Calendar, Clock, AlertTriangle, Trophy, Flame, DollarSign, Activity } from "lucide-react"
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
  size = 70, 
  strokeWidth = 6, 
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
      if (progress >= 80) return { start: "#10B981", end: "#059669", glow: "rgba(16,185,129,0.4)" }
      if (progress >= 50) return { start: "#F59E0B", end: "#D97706", glow: "rgba(245,158,11,0.4)" }
      return { start: "#3B82F6", end: "#2563EB", glow: "rgba(59,130,246,0.4)" }
    } else {
      if (progress >= 85) return { start: "#EF4444", end: "#DC2626", glow: "rgba(239,68,68,0.5)" }
      if (progress >= 60) return { start: "#F59E0B", end: "#EA580C", glow: "rgba(245,158,11,0.4)" }
      return { start: "#10B981", end: "#059669", glow: "rgba(16,185,129,0.3)" }
    }
  }

  const colors = getGradientColors()
  const gradientId = `gradient-${type}-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
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
          className="text-white/[0.06]"
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
            filter: `drop-shadow(0 0 6px ${colors.glow})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white tabular-nums">
          {cappedProgress.toFixed(0)}%
        </span>
        <span className="text-[8px] text-white/50 uppercase tracking-wider font-medium">
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
          label: "Funded",
          icon: Trophy,
          bgGradient: "from-emerald-500/15 via-emerald-600/5 to-transparent",
          borderColor: "border-emerald-500/30",
          badgeBg: "bg-emerald-500/20",
          badgeBorder: "border-emerald-500/40",
          textColor: "text-emerald-400",
          dotColor: "bg-emerald-400"
        }
      case "breached":
        return {
          label: "Failed",
          icon: AlertTriangle,
          bgGradient: "from-red-500/15 via-red-600/5 to-transparent",
          borderColor: "border-red-500/30",
          badgeBg: "bg-red-500/20",
          badgeBorder: "border-red-500/40",
          textColor: "text-red-400",
          dotColor: "bg-red-400"
        }
      case "at_risk":
        return {
          label: "At Risk",
          icon: Flame,
          bgGradient: "from-amber-500/15 via-orange-600/5 to-transparent",
          borderColor: "border-amber-500/30",
          badgeBg: "bg-amber-500/20",
          badgeBorder: "border-amber-500/40",
          textColor: "text-amber-400",
          dotColor: "bg-amber-400 animate-pulse"
        }
      default:
        return {
          label: "Active",
          icon: Zap,
          bgGradient: "from-amber-500/10 via-amber-600/5 to-transparent",
          borderColor: "border-amber-500/20",
          badgeBg: "bg-amber-500/15",
          badgeBorder: "border-amber-500/30",
          textColor: "text-amber-400",
          dotColor: "bg-amber-400"
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon
  const daysActive = challengeStartDate 
    ? Math.floor((new Date().getTime() - new Date(challengeStartDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toLocaleString()}`
  }

  return (
    <div className={cn(
      "relative rounded-2xl border backdrop-blur-xl overflow-hidden",
      "bg-gradient-to-br",
      statusConfig.bgGradient,
      statusConfig.borderColor
    )}>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Prop Firm Challenge</h2>
              <p className="text-xs text-white/50">Track your progress towards funding</p>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
            statusConfig.badgeBg,
            statusConfig.badgeBorder
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotColor)} />
            <StatusIcon className={cn("w-3.5 h-3.5", statusConfig.textColor)} />
            <span className={cn("text-xs font-semibold", statusConfig.textColor)}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="flex items-center gap-4">
          {/* Stats Row */}
          <div className="flex-1 flex items-center gap-2">
            <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06] min-w-0">
              <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase tracking-wider">
                <Shield className="w-2.5 h-2.5 flex-shrink-0" />
                <span>Starting</span>
              </div>
              <p className="text-sm font-bold text-white tabular-nums truncate">
                {formatCurrency(startingBalance)}
              </p>
            </div>
            
            <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06] min-w-0">
              <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase tracking-wider">
                <TrendingUp className="w-2.5 h-2.5 flex-shrink-0" />
                <span>Current</span>
              </div>
              <p className="text-sm font-bold text-white tabular-nums truncate">
                {formatCurrency(currentEquity)}
              </p>
              <p className={cn(
                "text-[9px] font-semibold",
                currentProfit >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {currentProfit >= 0 ? "+" : ""}{((currentProfit / startingBalance) * 100).toFixed(2)}%
              </p>
            </div>
            
            <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06] min-w-0">
              <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase tracking-wider">
                <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                <span>Days</span>
              </div>
              <p className="text-sm font-bold text-white tabular-nums">
                {daysActive}
              </p>
              <p className="text-[9px] text-white/40">active</p>
            </div>
            
            <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06] min-w-0">
              <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase tracking-wider">
                <Activity className="w-2.5 h-2.5 flex-shrink-0" />
                <span>P&L</span>
              </div>
              <p className={cn(
                "text-sm font-bold tabular-nums truncate",
                currentProfit >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {currentProfit >= 0 ? "+" : ""}{formatCurrency(Math.abs(currentProfit))}
              </p>
            </div>
          </div>

          {/* Progress Circles - Compact */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <CircularProgress progress={profitProgress} type="profit" size={70} strokeWidth={6} />
              <div className="mt-1">
                <p className="text-[8px] text-white/40 uppercase tracking-wider">Target</p>
                <p className="text-xs font-bold text-white">{formatCurrency(profitTargetValue)}</p>
              </div>
            </div>
            
            <div className="text-center">
              <CircularProgress progress={drawdownProgress} type="drawdown" size={70} strokeWidth={6} />
              <div className="mt-1">
                <p className="text-[8px] text-white/40 uppercase tracking-wider">Max DD</p>
                <p className="text-xs font-bold text-white">{formatCurrency(maxDrawdownValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
