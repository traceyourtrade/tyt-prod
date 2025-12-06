"use client"

import { TrendingUp, TrendingDown, Target, Percent, BarChart3, Activity, Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface PropFirmQuickStatsProps {
  netPnL: number
  winRate: number
  profitFactor: number
  totalTrades: number
  avgWin: number
  avgLoss: number
  riskRewardRatio: number
  todayPnL: number
  currentEquity: number
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  trend,
  variant = "default"
}: { 
  icon: any
  label: string
  value: string
  subValue?: string
  trend?: "up" | "down" | "neutral"
  variant?: "default" | "profit" | "loss" | "warning"
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "profit":
        return "from-emerald-500/5 to-emerald-600/[0.02] dark:from-emerald-500/10 dark:to-emerald-600/5 border-emerald-500/20"
      case "loss":
        return "from-red-500/5 to-red-600/[0.02] dark:from-red-500/10 dark:to-red-600/5 border-red-500/20"
      case "warning":
        return "from-amber-500/5 to-amber-600/[0.02] dark:from-amber-500/10 dark:to-amber-600/5 border-amber-500/20"
      default:
        return "from-gray-50 to-gray-100/50 dark:from-white/5 dark:to-white/[0.02] border-gray-200 dark:border-white/10"
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case "profit":
        return "text-emerald-600 dark:text-emerald-400"
      case "loss":
        return "text-red-600 dark:text-red-400"
      case "warning":
        return "text-amber-600 dark:text-amber-400"
      default:
        return "text-amber-600 dark:text-amber-400"
    }
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border backdrop-blur-sm",
      "bg-white dark:bg-transparent bg-gradient-to-br",
      getVariantStyles(),
      "p-4 transition-all hover:scale-[1.02] hover:border-amber-500/30"
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
        )}>
          <Icon className={cn("w-4 h-4", getIconColor())} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend === "up" ? "text-emerald-600 dark:text-emerald-400" : trend === "down" ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-white/40"
          )}>
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <p className="text-xs text-gray-500 dark:text-white/40 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
        {subValue && (
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  )
}

export default function PropFirmQuickStats({
  netPnL,
  winRate,
  profitFactor,
  totalTrades,
  avgWin,
  avgLoss,
  riskRewardRatio,
  todayPnL,
  currentEquity,
}: PropFirmQuickStatsProps) {
  const formatProfitFactor = (pf: number): string => {
    if (!isFinite(pf) || pf === Infinity) return "∞"
    if (pf === 0) return "0.00"
    return pf.toFixed(2)
  }

  const formatRiskReward = (rr: number): string => {
    if (!isFinite(rr) || rr === Infinity) return "1:∞"
    if (rr === 0) return "1:0"
    return `1:${rr.toFixed(1)}`
  }

  const getProfitFactorVariant = (): "profit" | "warning" | "loss" | "default" => {
    if (!isFinite(profitFactor)) return "profit"
    if (profitFactor >= 1.5) return "profit"
    if (profitFactor >= 1) return "warning"
    return "loss"
  }

  const getRiskRewardVariant = (): "profit" | "default" => {
    if (!isFinite(riskRewardRatio)) return "profit"
    return riskRewardRatio >= 1.5 ? "profit" : "default"
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      <StatCard
        icon={TrendingUp}
        label="Net P&L"
        value={`${netPnL >= 0 ? "+" : ""}$${Math.abs(netPnL).toLocaleString()}`}
        variant={netPnL >= 0 ? "profit" : "loss"}
        trend={netPnL >= 0 ? "up" : "down"}
      />
      
      <StatCard
        icon={Percent}
        label="Win Rate"
        value={`${winRate.toFixed(1)}%`}
        subValue={`${totalTrades} trades`}
        variant={winRate >= 50 ? "profit" : winRate >= 40 ? "warning" : "loss"}
      />
      
      <StatCard
        icon={Target}
        label="Profit Factor"
        value={formatProfitFactor(profitFactor)}
        variant={getProfitFactorVariant()}
      />
      
      <StatCard
        icon={BarChart3}
        label="Current Equity"
        value={`$${currentEquity.toLocaleString()}`}
      />
      
      <StatCard
        icon={TrendingUp}
        label="Avg Win"
        value={`+$${avgWin.toLocaleString()}`}
        variant="profit"
      />
      
      <StatCard
        icon={TrendingDown}
        label="Avg Loss"
        value={`-$${Math.abs(avgLoss).toLocaleString()}`}
        variant="loss"
      />
      
      <StatCard
        icon={Activity}
        label="Risk:Reward"
        value={formatRiskReward(riskRewardRatio)}
        variant={getRiskRewardVariant()}
      />
      
      <StatCard
        icon={Zap}
        label="Today's P&L"
        value={`${todayPnL >= 0 ? "+" : ""}$${Math.abs(todayPnL).toLocaleString()}`}
        variant={todayPnL >= 0 ? "profit" : "loss"}
        trend={todayPnL >= 0 ? "up" : todayPnL < 0 ? "down" : "neutral"}
      />
    </div>
  )
}
