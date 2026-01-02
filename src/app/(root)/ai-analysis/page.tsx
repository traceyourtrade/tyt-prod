"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts"
import useCurrencyStore, { formatCurrencyValue } from "@/store/currencyStore"
import SubscriptionGate from "@/components/subscription/SubscriptionGate"
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Calendar,
  AlertTriangle,
  Target,
  BarChart3,
  Activity,
  Zap,
  Award,
  Shield,
  LineChart,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  Sparkles,
  Gauge,
} from "lucide-react"

interface Trade {
  date: string
  time?: string
  Item: string
  Type: string
  Profit: number
  strategy?: string
  OpenTime?: string
  CloseTime?: string
  OpenPrice?: number
  ClosePrice?: number
  Size?: number
  StopLoss?: number
  TakeProfit?: number
  [key: string]: unknown
}

interface Account {
  tradeData?: Trade[]
  accountBalance?: number
  [key: string]: unknown
}

const tabs = [
  { id: "streaks", name: "Streak Analysis", icon: Flame },
  { id: "risk", name: "Risk Analysis", icon: Shield },
  { id: "time", name: "Time Insights", icon: Clock },
  { id: "emotional", name: "Emotional Patterns", icon: AlertTriangle },
  { id: "benchmarks", name: "Benchmarks", icon: Award },
  { id: "quality", name: "Trade Quality", icon: Target },
  { id: "correlations", name: "Correlations", icon: Activity },
  { id: "smart", name: "Smart Insights", icon: Sparkles },
]

export default function AIAnalysisPage() {
  const [activeTab, setActiveTab] = useState("streaks")
  const { selectedAccounts } = useModeFilteredAccounts()
  const { currency, exchangeRate } = useCurrencyStore()

  const allTrades = useMemo(() => {
    return (selectedAccounts as Account[])
      .flatMap((acc) => acc.tradeData || [])
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || "00:00:00"}`)
        const dateB = new Date(`${b.date} ${b.time || "00:00:00"}`)
        return dateA.getTime() - dateB.getTime()
      })
  }, [selectedAccounts])

  const accountBalance = useMemo(() => {
    return (selectedAccounts as Account[]).reduce((sum, acc) => {
      return sum + (Number(acc.accountBalance) || 0)
    }, 0)
  }, [selectedAccounts])

  const formatValue = (value: number) => {
    return formatCurrencyValue(value, currency, exchangeRate)
  }

  return (
    <SubscriptionGate 
      featureName="AI Analysis" 
      featureDescription="Get advanced statistical insights including streak analysis, risk metrics, time patterns, and AI-powered recommendations."
    >
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-xl mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20 flex items-center justify-center">
              <BrainCircuit className="w-7 h-7 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Analysis</h1>
              <p className="text-muted-foreground">
                Advanced statistical insights from your trading data
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-violet-500/10 text-violet-500 border border-violet-500/20"
                  : "bg-card/50 text-muted-foreground hover:text-foreground border border-border hover:border-violet-500/20"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "streaks" && (
            <StreakAnalysis trades={allTrades} formatValue={formatValue} />
          )}
          {activeTab === "risk" && (
            <RiskAnalysis trades={allTrades} formatValue={formatValue} accountBalance={accountBalance} />
          )}
          {activeTab === "time" && (
            <TimeInsights trades={allTrades} formatValue={formatValue} />
          )}
          {activeTab === "emotional" && (
            <EmotionalPatterns trades={allTrades} formatValue={formatValue} />
          )}
          {activeTab === "benchmarks" && (
            <PerformanceBenchmarks trades={allTrades} formatValue={formatValue} />
          )}
          {activeTab === "quality" && (
            <TradeQuality trades={allTrades} formatValue={formatValue} />
          )}
          {activeTab === "correlations" && (
            <CorrelationsAnalysis trades={allTrades} formatValue={formatValue} />
          )}
          {activeTab === "smart" && (
            <SmartInsights trades={allTrades} formatValue={formatValue} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    </SubscriptionGate>
  )
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = "violet" 
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
  color?: "violet" | "green" | "red" | "amber" | "blue" | "cyan"
}) {
  const colorClasses = {
    violet: "from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-500",
    green: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-500",
    red: "from-red-500/20 to-red-600/10 border-red-500/20 text-red-500",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-500",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-500",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-500",
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center",
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className={cn(
          "absolute bottom-2 right-2 flex items-center gap-1 text-xs",
          trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
        )}>
          {trend === "up" ? <ArrowUp className="w-3 h-3" /> : trend === "down" ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </div>
      )}
    </div>
  )
}

function InsightCard({ 
  title, 
  description, 
  type = "info" 
}: { 
  title: string
  description: string
  type?: "success" | "warning" | "danger" | "info"
}) {
  const typeClasses = {
    success: "border-emerald-500/20 bg-emerald-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
    danger: "border-red-500/20 bg-red-500/5",
    info: "border-violet-500/20 bg-violet-500/5",
  }

  const iconClasses = {
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500",
    info: "text-violet-500",
  }

  return (
    <div className={cn(
      "rounded-xl border p-4",
      typeClasses[type]
    )}>
      <div className="flex items-start gap-3">
        <Info className={cn("w-5 h-5 mt-0.5 flex-shrink-0", iconClasses[type])} />
        <div>
          <h4 className="font-medium text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

function StreakAnalysis({ trades, formatValue }: { trades: Trade[], formatValue: (v: number) => string }) {
  const analysis = useMemo(() => {
    if (trades.length === 0) return null

    let currentWinStreak = 0
    let currentLossStreak = 0
    let maxWinStreak = 0
    let maxLossStreak = 0
    let winStreaks: number[] = []
    let lossStreaks: number[] = []
    
    let tradesAfterWinStreak: { streak: number, result: "win" | "loss", profit: number }[] = []
    let tradesAfterLossStreak: { streak: number, result: "win" | "loss", profit: number }[] = []

    trades.forEach((trade, i) => {
      const isWin = trade.Profit > 0

      if (isWin) {
        if (currentLossStreak > 0) {
          lossStreaks.push(currentLossStreak)
          if (i > 0) {
            tradesAfterLossStreak.push({
              streak: currentLossStreak,
              result: "win",
              profit: trade.Profit
            })
          }
        }
        currentLossStreak = 0
        currentWinStreak++
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
      } else {
        if (currentWinStreak > 0) {
          winStreaks.push(currentWinStreak)
          if (i > 0) {
            tradesAfterWinStreak.push({
              streak: currentWinStreak,
              result: "loss",
              profit: trade.Profit
            })
          }
        }
        currentWinStreak = 0
        currentLossStreak++
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
      }
    })

    if (currentWinStreak > 0) winStreaks.push(currentWinStreak)
    if (currentLossStreak > 0) lossStreaks.push(currentLossStreak)

    const avgWinStreak = winStreaks.length > 0 ? winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length : 0
    const avgLossStreak = lossStreaks.length > 0 ? lossStreaks.reduce((a, b) => a + b, 0) / lossStreaks.length : 0

    const lossAfter3Wins = tradesAfterWinStreak.filter(t => t.streak >= 3 && t.result === "loss").length
    const totalAfter3Wins = tradesAfterWinStreak.filter(t => t.streak >= 3).length
    const lossRateAfterWinStreak = totalAfter3Wins > 0 ? (lossAfter3Wins / totalAfter3Wins) * 100 : 0

    const winAfter3Losses = tradesAfterLossStreak.filter(t => t.streak >= 3 && t.result === "win").length
    const totalAfter3Losses = tradesAfterLossStreak.filter(t => t.streak >= 3).length
    const winRateAfterLossStreak = totalAfter3Losses > 0 ? (winAfter3Losses / totalAfter3Losses) * 100 : 0

    return {
      maxWinStreak,
      maxLossStreak,
      avgWinStreak,
      avgLossStreak,
      currentWinStreak,
      currentLossStreak,
      lossRateAfterWinStreak,
      winRateAfterLossStreak,
      totalWinStreaks: winStreaks.length,
      totalLossStreaks: lossStreaks.length,
    }
  }, [trades])

  if (!analysis || trades.length < 5) {
    return (
      <div className="text-center py-12">
        <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground">Need at least 5 trades for streak analysis</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Longest Win Streak"
          value={analysis.maxWinStreak}
          subtitle="consecutive wins"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Longest Loss Streak"
          value={analysis.maxLossStreak}
          subtitle="consecutive losses"
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Avg Win Streak"
          value={analysis.avgWinStreak.toFixed(1)}
          subtitle="trades"
          icon={Flame}
          color="amber"
        />
        <StatCard
          title="Avg Loss Streak"
          value={analysis.avgLossStreak.toFixed(1)}
          subtitle="trades"
          icon={Activity}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Current Win Streak"
          value={analysis.currentWinStreak}
          subtitle={analysis.currentWinStreak > 0 ? "You're on a roll!" : "No active win streak"}
          icon={Zap}
          color="green"
        />
        <StatCard
          title="Current Loss Streak"
          value={analysis.currentLossStreak}
          subtitle={analysis.currentLossStreak > 0 ? "Stay disciplined" : "No active loss streak"}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Streak Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.lossRateAfterWinStreak > 50 && (
            <InsightCard
              type="warning"
              title="Overconfidence Pattern Detected"
              description={`You lose ${analysis.lossRateAfterWinStreak.toFixed(0)}% of trades after a 3+ win streak. Consider being more cautious after winning runs.`}
            />
          )}
          {analysis.winRateAfterLossStreak > 50 && (
            <InsightCard
              type="success"
              title="Strong Recovery Pattern"
              description={`You win ${analysis.winRateAfterLossStreak.toFixed(0)}% of trades after a 3+ loss streak. You recover well from drawdowns.`}
            />
          )}
          {analysis.maxLossStreak >= 5 && (
            <InsightCard
              type="danger"
              title="Extended Loss Streak Warning"
              description={`You've experienced a ${analysis.maxLossStreak}-trade loss streak. Consider implementing a daily loss limit.`}
            />
          )}
          {analysis.maxWinStreak >= 5 && (
            <InsightCard
              type="info"
              title="Excellent Win Streaks"
              description={`Your best streak was ${analysis.maxWinStreak} consecutive wins. Your strategy can produce consistent results.`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function RiskAnalysis({ trades, formatValue, accountBalance }: { trades: Trade[], formatValue: (v: number) => string, accountBalance: number }) {
  const analysis = useMemo(() => {
    if (trades.length === 0) return null

    let runningBalance = accountBalance
    let peakBalance = accountBalance
    let maxDrawdown = 0
    let maxDrawdownPercent = 0
    let currentDrawdown = 0
    
    const dailyPnL: Record<string, number> = {}
    let maxDailyLoss = 0
    let maxDailyWin = 0

    const riskRewardRatios: number[] = []
    const positionSizes: number[] = []

    trades.forEach((trade) => {
      runningBalance += trade.Profit
      
      if (runningBalance > peakBalance) {
        peakBalance = runningBalance
      }
      
      currentDrawdown = peakBalance - runningBalance
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown
        maxDrawdownPercent = peakBalance > 0 ? (currentDrawdown / peakBalance) * 100 : 0
      }

      if (!dailyPnL[trade.date]) dailyPnL[trade.date] = 0
      dailyPnL[trade.date] += trade.Profit

      if (trade.StopLoss && trade.TakeProfit && trade.OpenPrice) {
        const risk = Math.abs(trade.OpenPrice - trade.StopLoss)
        const reward = Math.abs(trade.TakeProfit - trade.OpenPrice)
        if (risk > 0) {
          riskRewardRatios.push(reward / risk)
        }
      }

      if (trade.Size) {
        positionSizes.push(trade.Size)
      }
    })

    Object.values(dailyPnL).forEach((pnl) => {
      if (pnl < maxDailyLoss) maxDailyLoss = pnl
      if (pnl > maxDailyWin) maxDailyWin = pnl
    })

    const avgRR = riskRewardRatios.length > 0 
      ? riskRewardRatios.reduce((a, b) => a + b, 0) / riskRewardRatios.length 
      : 0

    const avgPositionSize = positionSizes.length > 0
      ? positionSizes.reduce((a, b) => a + b, 0) / positionSizes.length
      : 0

    const positionSizeVariance = positionSizes.length > 1
      ? Math.sqrt(positionSizes.reduce((sum, size) => sum + Math.pow(size - avgPositionSize, 2), 0) / positionSizes.length)
      : 0

    const positionSizeConsistency = avgPositionSize > 0 
      ? Math.max(0, 100 - (positionSizeVariance / avgPositionSize) * 100)
      : 100

    return {
      maxDrawdown,
      maxDrawdownPercent,
      currentDrawdown,
      maxDailyLoss,
      maxDailyWin,
      avgRR,
      avgPositionSize,
      positionSizeConsistency,
      tradingDays: Object.keys(dailyPnL).length,
    }
  }, [trades, accountBalance])

  if (!analysis || trades.length < 5) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground">Need at least 5 trades for risk analysis</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Max Drawdown"
          value={formatValue(analysis.maxDrawdown)}
          subtitle={`${analysis.maxDrawdownPercent.toFixed(1)}% from peak`}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Max Daily Loss"
          value={formatValue(Math.abs(analysis.maxDailyLoss))}
          subtitle="worst trading day"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Max Daily Win"
          value={formatValue(analysis.maxDailyWin)}
          subtitle="best trading day"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Avg Risk:Reward"
          value={analysis.avgRR > 0 ? `1:${analysis.avgRR.toFixed(1)}` : "N/A"}
          subtitle="target ratio"
          icon={Target}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Position Size Consistency"
          value={`${analysis.positionSizeConsistency.toFixed(0)}%`}
          subtitle="lower variance = better"
          icon={BarChart3}
          color="cyan"
        />
        <StatCard
          title="Trading Days"
          value={analysis.tradingDays}
          subtitle="active days analyzed"
          icon={Calendar}
          color="violet"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Risk Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.maxDrawdownPercent > 20 && (
            <InsightCard
              type="danger"
              title="High Drawdown Alert"
              description={`Your max drawdown of ${analysis.maxDrawdownPercent.toFixed(1)}% exceeds the recommended 20% limit. Consider reducing position sizes.`}
            />
          )}
          {analysis.positionSizeConsistency < 50 && (
            <InsightCard
              type="warning"
              title="Inconsistent Position Sizing"
              description="Your position sizes vary significantly. Consistent sizing helps manage risk better."
            />
          )}
          {analysis.avgRR > 0 && analysis.avgRR < 1 && (
            <InsightCard
              type="warning"
              title="Low Risk:Reward Ratio"
              description={`Your average R:R of 1:${analysis.avgRR.toFixed(1)} is below 1:1. Consider targeting higher rewards.`}
            />
          )}
          {analysis.avgRR >= 2 && (
            <InsightCard
              type="success"
              title="Strong Risk:Reward"
              description={`Your average R:R of 1:${analysis.avgRR.toFixed(1)} is excellent. Keep targeting high reward trades.`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function TimeInsights({ trades, formatValue }: { trades: Trade[], formatValue: (v: number) => string }) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  const analysis = useMemo(() => {
    if (trades.length === 0) return null

    const hourlyData: Record<number, { wins: number, losses: number, profit: number, count: number }> = {}
    const sessionData: Record<string, { wins: number, losses: number, profit: number, count: number }> = {
      "Asian (00:00-08:00)": { wins: 0, losses: 0, profit: 0, count: 0 },
      "London (08:00-16:00)": { wins: 0, losses: 0, profit: 0, count: 0 },
      "New York (13:00-21:00)": { wins: 0, losses: 0, profit: 0, count: 0 },
    }

    const holdingTimes: { duration: number, profit: number }[] = []
    
    const heatmapData: Record<number, Record<number, { wins: number, losses: number, profit: number, count: number }>> = {}
    for (let day = 0; day < 7; day++) {
      heatmapData[day] = {}
      for (let hour = 0; hour < 24; hour++) {
        heatmapData[day][hour] = { wins: 0, losses: 0, profit: 0, count: 0 }
      }
    }

    trades.forEach((trade) => {
      const time = trade.time || (trade.OpenTime ? trade.OpenTime.split(" ")[1] || trade.OpenTime.split("T")[1] : null)
      const tradeDate = new Date(trade.date)
      const dayOfWeek = tradeDate.getDay()
      
      if (time) {
        const hour = parseInt(time.split(":")[0], 10)
        if (!isNaN(hour)) {
          if (!hourlyData[hour]) {
            hourlyData[hour] = { wins: 0, losses: 0, profit: 0, count: 0 }
          }
          hourlyData[hour].count++
          hourlyData[hour].profit += trade.Profit
          if (trade.Profit > 0) hourlyData[hour].wins++
          else if (trade.Profit < 0) hourlyData[hour].losses++

          heatmapData[dayOfWeek][hour].count++
          heatmapData[dayOfWeek][hour].profit += trade.Profit
          if (trade.Profit > 0) heatmapData[dayOfWeek][hour].wins++
          else if (trade.Profit < 0) heatmapData[dayOfWeek][hour].losses++

          if (hour >= 0 && hour < 8) {
            sessionData["Asian (00:00-08:00)"].count++
            sessionData["Asian (00:00-08:00)"].profit += trade.Profit
            if (trade.Profit > 0) sessionData["Asian (00:00-08:00)"].wins++
            else sessionData["Asian (00:00-08:00)"].losses++
          }
          if (hour >= 8 && hour < 16) {
            sessionData["London (08:00-16:00)"].count++
            sessionData["London (08:00-16:00)"].profit += trade.Profit
            if (trade.Profit > 0) sessionData["London (08:00-16:00)"].wins++
            else sessionData["London (08:00-16:00)"].losses++
          }
          if (hour >= 13 && hour < 21) {
            sessionData["New York (13:00-21:00)"].count++
            sessionData["New York (13:00-21:00)"].profit += trade.Profit
            if (trade.Profit > 0) sessionData["New York (13:00-21:00)"].wins++
            else sessionData["New York (13:00-21:00)"].losses++
          }
        }
      }

      if (trade.OpenTime && trade.CloseTime) {
        const openTime = new Date(trade.OpenTime.replace(" ", "T"))
        const closeTime = new Date(trade.CloseTime.replace(" ", "T"))
        const duration = (closeTime.getTime() - openTime.getTime()) / (1000 * 60)
        if (!isNaN(duration) && duration > 0) {
          holdingTimes.push({ duration, profit: trade.Profit })
        }
      }
    })

    const bestHour = Object.entries(hourlyData).reduce((best, [hour, data]) => {
      const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0
      if (data.count >= 3 && winRate > (best?.winRate || 0)) {
        return { hour: parseInt(hour), winRate, profit: data.profit, count: data.count }
      }
      return best
    }, null as { hour: number, winRate: number, profit: number, count: number } | null)

    const worstHour = Object.entries(hourlyData).reduce((worst, [hour, data]) => {
      const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 100
      if (data.count >= 3 && winRate < (worst?.winRate ?? 100)) {
        return { hour: parseInt(hour), winRate, profit: data.profit, count: data.count }
      }
      return worst
    }, null as { hour: number, winRate: number, profit: number, count: number } | null)

    let bestSlot: { day: number, hour: number, winRate: number, profit: number, count: number } | null = null
    let worstSlot: { day: number, hour: number, winRate: number, profit: number, count: number } | null = null
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const cell = heatmapData[day][hour]
        if (cell.count >= 3) {
          const winRate = (cell.wins / cell.count) * 100
          if (!bestSlot || winRate > bestSlot.winRate) {
            bestSlot = { day, hour, winRate, profit: cell.profit, count: cell.count }
          }
          if (!worstSlot || winRate < worstSlot.winRate) {
            worstSlot = { day, hour, winRate, profit: cell.profit, count: cell.count }
          }
        }
      }
    }

    const avgHoldingTime = holdingTimes.length > 0
      ? holdingTimes.reduce((sum, t) => sum + t.duration, 0) / holdingTimes.length
      : 0

    const winningHoldingTime = holdingTimes.filter(t => t.profit > 0)
    const losingHoldingTime = holdingTimes.filter(t => t.profit < 0)
    
    const avgWinningHoldTime = winningHoldingTime.length > 0
      ? winningHoldingTime.reduce((sum, t) => sum + t.duration, 0) / winningHoldingTime.length
      : 0

    const avgLosingHoldTime = losingHoldingTime.length > 0
      ? losingHoldingTime.reduce((sum, t) => sum + t.duration, 0) / losingHoldingTime.length
      : 0

    return {
      hourlyData,
      sessionData,
      heatmapData,
      bestHour,
      worstHour,
      bestSlot,
      worstSlot,
      avgHoldingTime,
      avgWinningHoldTime,
      avgLosingHoldTime,
    }
  }, [trades])

  if (!analysis || trades.length < 5) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground">Need at least 5 trades for time analysis</p>
      </div>
    )
  }

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins.toFixed(0)}m`
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    return `${hours}h ${minutes.toFixed(0)}m`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analysis.bestHour && (
          <StatCard
            title="Best Trading Hour"
            value={`${analysis.bestHour.hour}:00`}
            subtitle={`${analysis.bestHour.winRate.toFixed(0)}% win rate`}
            icon={TrendingUp}
            color="green"
          />
        )}
        {analysis.worstHour && (
          <StatCard
            title="Worst Trading Hour"
            value={`${analysis.worstHour.hour}:00`}
            subtitle={`${analysis.worstHour.winRate.toFixed(0)}% win rate`}
            icon={TrendingDown}
            color="red"
          />
        )}
        <StatCard
          title="Avg Holding Time"
          value={formatMinutes(analysis.avgHoldingTime)}
          subtitle="all trades"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Winners Hold Time"
          value={formatMinutes(analysis.avgWinningHoldTime)}
          subtitle="winning trades"
          icon={Zap}
          color="amber"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Session Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analysis.sessionData).map(([session, data]) => {
            const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0
            return (
              <div key={session} className="rounded-xl border border-border bg-card/50 p-4">
                <h4 className="font-medium text-foreground mb-3">{session}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trades</span>
                    <span className="text-foreground font-medium">{data.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className={cn(
                      "font-medium",
                      winRate >= 50 ? "text-emerald-500" : "text-red-500"
                    )}>{winRate.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit</span>
                    <span className={cn(
                      "font-medium",
                      data.profit >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>{formatValue(data.profit)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Performance Heatmap</h3>
        <p className="text-sm text-muted-foreground">Win rate by hour and day of week (cells with 3+ trades)</p>
        
        {(analysis.bestSlot || analysis.worstSlot) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {analysis.bestSlot && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-foreground">Your Edge</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Best: <span className="text-emerald-500 font-medium">{dayNames[analysis.bestSlot.day]} {analysis.bestSlot.hour}:00</span> ({analysis.bestSlot.winRate.toFixed(0)}% win rate, {analysis.bestSlot.count} trades)
                </p>
              </div>
            )}
            {analysis.worstSlot && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-foreground">Avoid</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Worst: <span className="text-red-500 font-medium">{dayNames[analysis.worstSlot.day]} {analysis.worstSlot.hour}:00</span> ({analysis.worstSlot.winRate.toFixed(0)}% win rate, {analysis.worstSlot.count} trades)
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="rounded-xl border border-border bg-card/50 p-4 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex">
              <div className="w-16 flex-shrink-0"></div>
              <div className="flex-1 grid grid-cols-24 gap-0.5 text-xs text-muted-foreground mb-1">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="text-center">{i}</div>
                ))}
              </div>
            </div>
            
            {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
              <div key={dayIndex} className="flex items-center">
                <div className="w-16 flex-shrink-0 text-xs text-muted-foreground pr-2 text-right">
                  {shortDayNames[dayIndex]}
                </div>
                <div className="flex-1 grid grid-cols-24 gap-0.5">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = analysis.heatmapData[dayIndex][hour]
                    const winRate = cell.count > 0 ? (cell.wins / cell.count) * 100 : -1
                    const hasData = cell.count >= 1
                    const hasEnoughData = cell.count >= 3
                    
                    let bgColor = "bg-muted/30"
                    if (hasEnoughData) {
                      if (winRate >= 70) bgColor = "bg-emerald-500"
                      else if (winRate >= 55) bgColor = "bg-emerald-500/60"
                      else if (winRate >= 45) bgColor = "bg-amber-500/60"
                      else if (winRate >= 30) bgColor = "bg-red-500/60"
                      else bgColor = "bg-red-500"
                    } else if (hasData) {
                      bgColor = "bg-muted/50"
                    }
                    
                    return (
                      <div
                        key={hour}
                        className={cn(
                          "h-6 rounded-sm relative group cursor-default transition-all",
                          bgColor,
                          hasEnoughData && "hover:ring-2 hover:ring-violet-500 hover:z-10"
                        )}
                        title={hasData ? `${shortDayNames[dayIndex]} ${hour}:00 - ${cell.count} trades, ${winRate.toFixed(0)}% WR, ${formatValue(cell.profit)}` : "No trades"}
                      >
                        {hasEnoughData && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                            <div className="font-medium">{shortDayNames[dayIndex]} {hour}:00</div>
                            <div className="text-muted-foreground">{cell.count} trades</div>
                            <div className={winRate >= 50 ? "text-emerald-500" : "text-red-500"}>{winRate.toFixed(0)}% win rate</div>
                            <div className={cell.profit >= 0 ? "text-emerald-500" : "text-red-500"}>{formatValue(cell.profit)}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-red-500"></div>
                <span>&lt;30%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-red-500/60"></div>
                <span>30-45%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-amber-500/60"></div>
                <span>45-55%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-emerald-500/60"></div>
                <span>55-70%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-emerald-500"></div>
                <span>&gt;70%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Time Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.avgLosingHoldTime > analysis.avgWinningHoldTime * 1.5 && (
            <InsightCard
              type="warning"
              title="Holding Losers Too Long"
              description={`You hold losing trades ${formatMinutes(analysis.avgLosingHoldTime)} on average vs ${formatMinutes(analysis.avgWinningHoldTime)} for winners. Consider tighter stop losses.`}
            />
          )}
          {analysis.bestHour && (
            <InsightCard
              type="success"
              title={`Peak Performance at ${analysis.bestHour.hour}:00`}
              description={`You achieve ${analysis.bestHour.winRate.toFixed(0)}% win rate during this hour across ${analysis.bestHour.count} trades.`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function EmotionalPatterns({ trades, formatValue }: { trades: Trade[], formatValue: (v: number) => string }) {
  const analysis = useMemo(() => {
    if (trades.length === 0) return null

    const dailyTrades: Record<string, Trade[]> = {}
    trades.forEach((trade) => {
      if (!dailyTrades[trade.date]) dailyTrades[trade.date] = []
      dailyTrades[trade.date].push(trade)
    })

    let revengeTradeCount = 0
    let revengeTradeProfit = 0
    let revengeWithLargerSize = 0
    let overtradingDays = 0
    let avgTradesPerDay = 0

    const tradesPerDay = Object.values(dailyTrades).map(t => t.length)
    avgTradesPerDay = tradesPerDay.length > 0 
      ? tradesPerDay.reduce((a, b) => a + b, 0) / tradesPerDay.length 
      : 0

    const allVolumes = trades.map(t => t.Volume || 0).filter(v => v > 0)
    const avgVolume = allVolumes.length > 0 ? allVolumes.reduce((a, b) => a + b, 0) / allVolumes.length : 0

    Object.values(dailyTrades).forEach((dayTrades) => {
      if (dayTrades.length > avgTradesPerDay * 2) {
        overtradingDays++
      }

      for (let i = 1; i < dayTrades.length; i++) {
        const prevTrade = dayTrades[i - 1]
        const currTrade = dayTrades[i]
        
        if (prevTrade.Profit < 0) {
          const prevTime = prevTrade.time || prevTrade.CloseTime?.split(" ")[1] || "00:00"
          const currTime = currTrade.time || currTrade.OpenTime?.split(" ")[1] || "00:00"
          
          const prevMinutes = parseInt(prevTime.split(":")[0]) * 60 + parseInt(prevTime.split(":")[1] || "0")
          const currMinutes = parseInt(currTime.split(":")[0]) * 60 + parseInt(currTime.split(":")[1] || "0")
          
          if (currMinutes - prevMinutes < 15 && currMinutes > prevMinutes) {
            revengeTradeCount++
            revengeTradeProfit += currTrade.Profit
            if ((currTrade.Volume || 0) > (prevTrade.Volume || 0)) {
              revengeWithLargerSize++
            }
          }
        }
      }
    })

    const recoveryTimes: number[] = []
    let inDrawdown = false
    let drawdownStart = 0
    let runningPnL = 0

    trades.forEach((trade, i) => {
      runningPnL += trade.Profit
      
      if (runningPnL < 0 && !inDrawdown) {
        inDrawdown = true
        drawdownStart = i
      } else if (runningPnL >= 0 && inDrawdown) {
        recoveryTimes.push(i - drawdownStart)
        inDrawdown = false
      }
    })

    const avgRecoveryTrades = recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0

    const revengeTradeWinRate = revengeTradeCount > 0
      ? (trades.slice(0, revengeTradeCount).filter(t => t.Profit > 0).length / revengeTradeCount) * 100
      : 0

    const last5Trades = trades.slice(-5)
    let recentLosingStreak = 0
    for (let i = last5Trades.length - 1; i >= 0; i--) {
      if (last5Trades[i].Profit < 0) {
        recentLosingStreak++
      } else {
        break
      }
    }

    const last3Losses = trades.slice(-3).every(t => t.Profit < 0)
    const lastTrade = trades[trades.length - 1]
    const lastTradeLarger = lastTrade && avgVolume > 0 && (lastTrade.Volume || 0) > avgVolume * 1.2
    const activeTiltWarning = last3Losses && lastTradeLarger

    const todayDate = new Date().toISOString().split("T")[0]
    const todayTrades = dailyTrades[todayDate] || []
    const overtradingToday = todayTrades.length > avgTradesPerDay * 2

    let tiltRiskScore = 0
    tiltRiskScore += Math.min(recentLosingStreak * 20, 60)
    if (revengeWithLargerSize > 0) tiltRiskScore += 20
    if (overtradingToday) tiltRiskScore += 20
    tiltRiskScore = Math.min(tiltRiskScore, 100)

    return {
      revengeTradeCount,
      revengeTradeProfit,
      revengeWithLargerSize,
      overtradingDays,
      totalDays: Object.keys(dailyTrades).length,
      avgTradesPerDay,
      avgRecoveryTrades,
      revengeTradeWinRate,
      tiltRiskScore,
      recentLosingStreak,
      activeTiltWarning,
      overtradingToday,
      todayTradeCount: todayTrades.length,
    }
  }, [trades])

  if (!analysis || trades.length < 10) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground">Need at least 10 trades for emotional pattern analysis</p>
      </div>
    )
  }

  const getTiltColor = (score: number) => {
    if (score <= 30) return "emerald"
    if (score <= 60) return "amber"
    return "red"
  }
  
  const tiltColor = getTiltColor(analysis.tiltRiskScore)
  
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gauge className={cn(
              "w-8 h-8",
              tiltColor === "emerald" ? "text-emerald-500" : tiltColor === "amber" ? "text-amber-500" : "text-red-500"
            )} />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Tilt Risk Score</h3>
              <p className="text-sm text-muted-foreground">Real-time emotional state assessment</p>
            </div>
          </div>
          <div className={cn(
            "text-4xl font-bold",
            tiltColor === "emerald" ? "text-emerald-500" : tiltColor === "amber" ? "text-amber-500" : "text-red-500"
          )}>
            {analysis.tiltRiskScore}
          </div>
        </div>
        
        <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-emerald-500/30"></div>
            <div className="flex-1 bg-amber-500/30"></div>
            <div className="flex-1 bg-red-500/30"></div>
          </div>
          <div 
            className={cn(
              "absolute top-0 left-0 h-full transition-all rounded-full",
              tiltColor === "emerald" ? "bg-emerald-500" : tiltColor === "amber" ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${analysis.tiltRiskScore}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground mb-4">
          <span>0 - Calm</span>
          <span>30 - Caution</span>
          <span>60 - Warning</span>
          <span>100 - Tilt</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className={cn(
            "rounded-lg p-3 border",
            analysis.recentLosingStreak >= 3 ? "border-red-500/30 bg-red-500/5" : "border-border bg-muted/20"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Losing Streak</span>
              <span className={cn(
                "font-bold",
                analysis.recentLosingStreak >= 3 ? "text-red-500" : "text-foreground"
              )}>{analysis.recentLosingStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">+20 pts per loss (max 60)</div>
          </div>
          <div className={cn(
            "rounded-lg p-3 border",
            analysis.revengeWithLargerSize > 0 ? "border-red-500/30 bg-red-500/5" : "border-border bg-muted/20"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Size Increase</span>
              <span className={cn(
                "font-bold",
                analysis.revengeWithLargerSize > 0 ? "text-red-500" : "text-foreground"
              )}>{analysis.revengeWithLargerSize > 0 ? "Yes" : "No"}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">+20 pts if sizing up after loss</div>
          </div>
          <div className={cn(
            "rounded-lg p-3 border",
            analysis.overtradingToday ? "border-red-500/30 bg-red-500/5" : "border-border bg-muted/20"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Overtrading</span>
              <span className={cn(
                "font-bold",
                analysis.overtradingToday ? "text-red-500" : "text-foreground"
              )}>{analysis.overtradingToday ? "Yes" : "No"}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">+20 pts if 2x avg trades today</div>
          </div>
        </div>
        
        {analysis.activeTiltWarning && (
          <div className="mt-4 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-2 text-red-500 font-medium">
              <AlertTriangle className="w-5 h-5" />
              <span>Active Tilt Warning</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Last 3 trades are losses and your last trade was larger than average. Consider taking a break.
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Revenge Trades"
          value={analysis.revengeTradeCount}
          subtitle="trades within 15min of loss"
          icon={Zap}
          color="red"
        />
        <StatCard
          title="Revenge Trade P&L"
          value={formatValue(analysis.revengeTradeProfit)}
          subtitle="total from revenge trades"
          icon={TrendingDown}
          color={analysis.revengeTradeProfit >= 0 ? "green" : "red"}
        />
        <StatCard
          title="Overtrading Days"
          value={analysis.overtradingDays}
          subtitle={`of ${analysis.totalDays} days`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Avg Recovery"
          value={analysis.avgRecoveryTrades.toFixed(1)}
          subtitle="trades to recover"
          icon={Activity}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Avg Trades/Day"
          value={analysis.avgTradesPerDay.toFixed(1)}
          subtitle="average activity"
          icon={BarChart3}
          color="violet"
        />
        <StatCard
          title="Overtrading Rate"
          value={`${((analysis.overtradingDays / analysis.totalDays) * 100).toFixed(0)}%`}
          subtitle="days with excessive trades"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Emotional Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.revengeTradeCount > 0 && (
            <InsightCard
              type="danger"
              title="Revenge Trading Detected"
              description={`You've made ${analysis.revengeTradeCount} revenge trades (entering within 15 minutes of a loss). These trades resulted in ${formatValue(analysis.revengeTradeProfit)}.`}
            />
          )}
          {analysis.overtradingDays > analysis.totalDays * 0.2 && (
            <InsightCard
              type="warning"
              title="Overtrading Pattern"
              description={`${analysis.overtradingDays} of ${analysis.totalDays} trading days show overtrading (2x+ your average). Consider setting daily trade limits.`}
            />
          )}
          {analysis.avgRecoveryTrades > 5 && (
            <InsightCard
              type="warning"
              title="Slow Recovery"
              description={`It takes you an average of ${analysis.avgRecoveryTrades.toFixed(1)} trades to recover from drawdowns. Consider smaller position sizes.`}
            />
          )}
          {analysis.revengeTradeCount === 0 && analysis.overtradingDays === 0 && (
            <InsightCard
              type="success"
              title="Excellent Discipline"
              description="No revenge trading or overtrading patterns detected. You maintain good emotional control."
            />
          )}
        </div>
      </div>
    </div>
  )
}

function PerformanceBenchmarks({ trades, formatValue }: { trades: Trade[], formatValue: (v: number) => string }) {
  const analysis = useMemo(() => {
    if (trades.length === 0) return null

    const monthlyData: Record<string, { profit: number, trades: number, wins: number }> = {}
    const weeklyData: { week: string, profit: number, trades: number }[] = []

    trades.forEach((trade) => {
      const month = trade.date.substring(0, 7)
      if (!monthlyData[month]) {
        monthlyData[month] = { profit: 0, trades: 0, wins: 0 }
      }
      monthlyData[month].profit += trade.Profit
      monthlyData[month].trades++
      if (trade.Profit > 0) monthlyData[month].wins++
    })

    const months = Object.keys(monthlyData).sort()
    const currentMonth = months[months.length - 1]
    const avgMonthlyProfit = months.length > 1
      ? months.slice(0, -1).reduce((sum, m) => sum + monthlyData[m].profit, 0) / (months.length - 1)
      : monthlyData[currentMonth]?.profit || 0

    const currentMonthData = monthlyData[currentMonth] || { profit: 0, trades: 0, wins: 0 }
    const vsAverage = avgMonthlyProfit !== 0 
      ? ((currentMonthData.profit - avgMonthlyProfit) / Math.abs(avgMonthlyProfit)) * 100 
      : 0

    const winRates = Object.values(monthlyData).map(m => m.trades > 0 ? (m.wins / m.trades) * 100 : 0)
    const avgWinRate = winRates.length > 0 ? winRates.reduce((a, b) => a + b, 0) / winRates.length : 0
    const winRateVariance = winRates.length > 1
      ? Math.sqrt(winRates.reduce((sum, wr) => sum + Math.pow(wr - avgWinRate, 2), 0) / winRates.length)
      : 0

    const consistencyScore = Math.max(0, 100 - winRateVariance)

    const profitHistory = Object.values(monthlyData).map(m => m.profit)
    const profitableMonths = profitHistory.filter(p => p > 0).length
    const profitableMonthsPercent = months.length > 0 ? (profitableMonths / months.length) * 100 : 0

    const last30Trades = trades.slice(-30)
    const last30Profit = last30Trades.reduce((sum, t) => sum + t.Profit, 0)
    const last30Wins = last30Trades.filter(t => t.Profit > 0).length
    const last30WinRate = last30Trades.length > 0 ? (last30Wins / last30Trades.length) * 100 : 0

    return {
      currentMonth,
      currentMonthProfit: currentMonthData.profit,
      currentMonthTrades: currentMonthData.trades,
      currentMonthWinRate: currentMonthData.trades > 0 ? (currentMonthData.wins / currentMonthData.trades) * 100 : 0,
      avgMonthlyProfit,
      vsAverage,
      consistencyScore,
      profitableMonthsPercent,
      totalMonths: months.length,
      profitableMonths,
      last30Profit,
      last30WinRate,
      monthlyData,
    }
  }, [trades])

  if (!analysis || trades.length < 10) {
    return (
      <div className="text-center py-12">
        <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground">Need at least 10 trades for benchmark analysis</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Current Month P&L"
          value={formatValue(analysis.currentMonthProfit)}
          subtitle={`${analysis.currentMonthTrades} trades`}
          icon={LineChart}
          color={analysis.currentMonthProfit >= 0 ? "green" : "red"}
          trend={analysis.vsAverage >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Avg Monthly P&L"
          value={formatValue(analysis.avgMonthlyProfit)}
          subtitle="historical average"
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="vs Average"
          value={`${analysis.vsAverage >= 0 ? "+" : ""}${analysis.vsAverage.toFixed(0)}%`}
          subtitle="current vs avg"
          icon={TrendingUp}
          color={analysis.vsAverage >= 0 ? "green" : "red"}
        />
        <StatCard
          title="Consistency Score"
          value={`${analysis.consistencyScore.toFixed(0)}%`}
          subtitle="win rate stability"
          icon={Target}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Profitable Months"
          value={`${analysis.profitableMonths}/${analysis.totalMonths}`}
          subtitle={`${analysis.profitableMonthsPercent.toFixed(0)}% of months`}
          icon={Award}
          color="amber"
        />
        <StatCard
          title="Last 30 Trades P&L"
          value={formatValue(analysis.last30Profit)}
          subtitle="rolling performance"
          icon={Activity}
          color={analysis.last30Profit >= 0 ? "green" : "red"}
        />
        <StatCard
          title="Last 30 Win Rate"
          value={`${analysis.last30WinRate.toFixed(0)}%`}
          subtitle="recent performance"
          icon={PieChart}
          color={analysis.last30WinRate >= 50 ? "green" : "red"}
        />
        <StatCard
          title="Current Month WR"
          value={`${analysis.currentMonthWinRate.toFixed(0)}%`}
          subtitle="this month"
          icon={Zap}
          color={analysis.currentMonthWinRate >= 50 ? "green" : "amber"}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.vsAverage > 20 && (
            <InsightCard
              type="success"
              title="Outperforming Average"
              description={`You're ${analysis.vsAverage.toFixed(0)}% above your average monthly performance. Keep up the great work!`}
            />
          )}
          {analysis.vsAverage < -20 && (
            <InsightCard
              type="warning"
              title="Below Average Performance"
              description={`You're ${Math.abs(analysis.vsAverage).toFixed(0)}% below your average. Review your recent trades for patterns.`}
            />
          )}
          {analysis.consistencyScore >= 80 && (
            <InsightCard
              type="success"
              title="Highly Consistent"
              description={`Your ${analysis.consistencyScore.toFixed(0)}% consistency score shows stable performance across months.`}
            />
          )}
          {analysis.profitableMonthsPercent >= 70 && (
            <InsightCard
              type="success"
              title="Strong Profitability"
              description={`${analysis.profitableMonthsPercent.toFixed(0)}% of your months are profitable. Excellent long-term performance.`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function TradeQuality({ trades, formatValue }: { trades: Trade[], formatValue: (v: number) => string }) {
  const analysis = useMemo(() => {
    if (trades.length === 0) return null

    const qualityScores: { trade: Trade, score: number, rScore: number, planScore: number, execScore: number, issues: string[] }[] = []

    trades.forEach((trade) => {
      let rScore = 0
      let planScore = 0
      let execScore = 0
      const issues: string[] = []

      if (trade.StopLoss && trade.OpenPrice && trade.StopLoss !== 0) {
        const risk = Math.abs(trade.OpenPrice - trade.StopLoss)
        if (risk > 0) {
          const rMultiple = trade.Profit / risk
          if (rMultiple >= 2) {
            rScore = 40
          } else if (rMultiple >= 1) {
            rScore = 25
          } else if (rMultiple >= 0) {
            rScore = 10
          }
        }
      } else {
        issues.push("No R-multiple data")
      }

      if (trade.strategy && trade.strategy !== "Select" && trade.strategy !== "Unknown") {
        planScore += 10
      } else {
        issues.push("No strategy")
      }
      if (trade.StopLoss && trade.StopLoss !== 0) {
        planScore += 10
      } else {
        issues.push("No stop loss")
      }
      if (trade.TakeProfit && trade.TakeProfit !== 0) {
        planScore += 10
      } else {
        issues.push("No take profit")
      }

      if (trade.TakeProfit && trade.ClosePrice && trade.TakeProfit !== 0) {
        const hitTP = Math.abs(trade.ClosePrice - trade.TakeProfit) < Math.abs(trade.TakeProfit - trade.OpenPrice) * 0.05
        if (hitTP) {
          execScore += 20
        }
      }
      if (trade.Profit > 0) {
        execScore += 10
      }

      const totalScore = rScore + planScore + execScore
      qualityScores.push({ trade, score: totalScore, rScore, planScore, execScore, issues })
    })

    const avgScore = qualityScores.reduce((sum, t) => sum + t.score, 0) / qualityScores.length
    
    const scoreDistribution = {
      "0-20": qualityScores.filter(t => t.score <= 20).length,
      "21-40": qualityScores.filter(t => t.score > 20 && t.score <= 40).length,
      "41-60": qualityScores.filter(t => t.score > 40 && t.score <= 60).length,
      "61-80": qualityScores.filter(t => t.score > 60 && t.score <= 80).length,
      "81-100": qualityScores.filter(t => t.score > 80).length,
    }
    
    const highQualityTrades = qualityScores.filter(t => t.score >= 80)
    const lowQualityTrades = qualityScores.filter(t => t.score < 40)

    const highQualityProfit = highQualityTrades.reduce((sum, t) => sum + t.trade.Profit, 0)
    const lowQualityProfit = lowQualityTrades.reduce((sum, t) => sum + t.trade.Profit, 0)

    const highQualityWinRate = highQualityTrades.length > 0
      ? (highQualityTrades.filter(t => t.trade.Profit > 0).length / highQualityTrades.length) * 100
      : 0

    const lowQualityWinRate = lowQualityTrades.length > 0
      ? (lowQualityTrades.filter(t => t.trade.Profit > 0).length / lowQualityTrades.length) * 100
      : 0

    const issueFrequency: Record<string, number> = {}
    qualityScores.forEach((q) => {
      q.issues.forEach((issue) => {
        issueFrequency[issue] = (issueFrequency[issue] || 0) + 1
      })
    })

    const topIssues = Object.entries(issueFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    const recentTrades = qualityScores.slice(-20)
    const olderTrades = qualityScores.slice(0, -20)
    
    const recentAvgScore = recentTrades.length > 0
      ? recentTrades.reduce((sum, t) => sum + t.score, 0) / recentTrades.length
      : 0
    
    const olderAvgScore = olderTrades.length > 0
      ? olderTrades.reduce((sum, t) => sum + t.score, 0) / olderTrades.length
      : 0

    const improvement = recentAvgScore - olderAvgScore
    
    const recentScoredTrades = qualityScores.slice(-10).reverse()

    return {
      avgScore,
      scoreDistribution,
      highQualityCount: highQualityTrades.length,
      lowQualityCount: lowQualityTrades.length,
      highQualityProfit,
      lowQualityProfit,
      highQualityWinRate,
      lowQualityWinRate,
      topIssues,
      improvement,
      recentAvgScore,
      recentScoredTrades,
    }
  }, [trades])

  if (!analysis || trades.length < 5) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground">Need at least 5 trades for quality analysis</p>
      </div>
    )
  }

  const maxDistCount = Math.max(...Object.values(analysis.scoreDistribution))
  
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-violet-600/10 p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Average Quality Score</p>
        <div className={cn(
          "text-6xl font-bold",
          analysis.avgScore >= 70 ? "text-emerald-500" : analysis.avgScore >= 40 ? "text-amber-500" : "text-red-500"
        )}>
          {analysis.avgScore.toFixed(0)}
        </div>
        <p className="text-sm text-muted-foreground mt-2">out of 100 points</p>
        <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <span>R-Multiple: 40pts</span>
          <span>Plan Adherence: 30pts</span>
          <span>Execution: 30pts</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="High Quality Trades"
          value={analysis.highQualityCount}
          subtitle={`${analysis.highQualityWinRate.toFixed(0)}% win rate`}
          icon={Award}
          color="green"
        />
        <StatCard
          title="Low Quality Trades"
          value={analysis.lowQualityCount}
          subtitle={`${analysis.lowQualityWinRate.toFixed(0)}% win rate`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="High Quality P&L"
          value={formatValue(analysis.highQualityProfit)}
          subtitle="from quality setups"
          icon={TrendingUp}
          color={analysis.highQualityProfit >= 0 ? "green" : "red"}
        />
        <StatCard
          title="Quality Trend"
          value={`${analysis.improvement >= 0 ? "+" : ""}${analysis.improvement.toFixed(0)}`}
          subtitle="recent vs older"
          icon={TrendingUp}
          color={analysis.improvement >= 0 ? "green" : "red"}
          trend={analysis.improvement >= 0 ? "up" : "down"}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Score Distribution</h3>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-end justify-between gap-2 h-40">
            {Object.entries(analysis.scoreDistribution).map(([range, count]) => {
              const height = maxDistCount > 0 ? (count / maxDistCount) * 100 : 0
              const colors: Record<string, string> = {
                "0-20": "bg-red-500",
                "21-40": "bg-orange-500",
                "41-60": "bg-amber-500",
                "61-80": "bg-emerald-400",
                "81-100": "bg-emerald-500"
              }
              return (
                <div key={range} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    <span className="text-sm font-medium text-foreground mb-1">{count}</span>
                    <div 
                      className={cn("w-full rounded-t transition-all", colors[range])}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{range}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Trade Scores</h3>
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="grid grid-cols-6 gap-2 p-3 bg-muted/30 text-xs font-medium text-muted-foreground border-b border-border">
            <span>Date</span>
            <span>Symbol</span>
            <span className="text-center">R-Score</span>
            <span className="text-center">Plan</span>
            <span className="text-center">Exec</span>
            <span className="text-center">Total</span>
          </div>
          {analysis.recentScoredTrades.map((item, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 p-3 text-sm border-b border-border/50 last:border-0 hover:bg-muted/20">
              <span className="text-muted-foreground">{item.trade.date}</span>
              <span className="font-medium text-foreground truncate">{item.trade.Item || "N/A"}</span>
              <span className={cn("text-center font-medium", item.rScore >= 25 ? "text-emerald-500" : item.rScore > 0 ? "text-amber-500" : "text-muted-foreground")}>{item.rScore}/40</span>
              <span className={cn("text-center font-medium", item.planScore >= 20 ? "text-emerald-500" : item.planScore >= 10 ? "text-amber-500" : "text-muted-foreground")}>{item.planScore}/30</span>
              <span className={cn("text-center font-medium", item.execScore >= 20 ? "text-emerald-500" : item.execScore > 0 ? "text-amber-500" : "text-muted-foreground")}>{item.execScore}/30</span>
              <span className={cn(
                "text-center font-bold",
                item.score >= 70 ? "text-emerald-500" : item.score >= 40 ? "text-amber-500" : "text-red-500"
              )}>{item.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Common Issues</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.topIssues.map(([issue, count]) => (
            <div key={issue} className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{issue}</span>
                <span className="text-lg font-bold text-foreground">{count}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${(count / trades.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((count / trades.length) * 100).toFixed(0)}% of trades
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Quality Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.highQualityWinRate > analysis.lowQualityWinRate + 10 && (
            <InsightCard
              type="success"
              title="Quality = Better Results"
              description={`High quality trades win ${analysis.highQualityWinRate.toFixed(0)}% vs ${analysis.lowQualityWinRate.toFixed(0)}% for low quality. Focus on setup quality.`}
            />
          )}
          {analysis.improvement > 5 && (
            <InsightCard
              type="success"
              title="Improving Over Time"
              description={`Your recent trade quality is ${analysis.improvement.toFixed(0)}% higher than earlier trades. Great progress!`}
            />
          )}
          {analysis.topIssues.length > 0 && analysis.topIssues[0][1] > trades.length * 0.3 && (
            <InsightCard
              type="warning"
              title={`Common Issue: ${analysis.topIssues[0][0]}`}
              description={`${((analysis.topIssues[0][1] / trades.length) * 100).toFixed(0)}% of your trades have this issue. Addressing it could improve results.`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function CorrelationsAnalysis({ trades, formatValue }: { trades: Trade[], formatValue: (v: number) => string }) {
  const analysis = useMemo(() => {
    if (trades.length === 0) return null

    const symbolData: Record<string, { profit: number, count: number, wins: number }> = {}
    const strategyData: Record<string, { profit: number, count: number, wins: number }> = {}
    const symbolPairs: Record<string, { same: number, opposite: number }> = {}

    trades.forEach((trade) => {
      const symbol = trade.Item || "Unknown"
      const strategy = trade.strategy || "Unknown"

      if (!symbolData[symbol]) {
        symbolData[symbol] = { profit: 0, count: 0, wins: 0 }
      }
      symbolData[symbol].profit += trade.Profit
      symbolData[symbol].count++
      if (trade.Profit > 0) symbolData[symbol].wins++

      if (strategy !== "Select" && strategy !== "Unknown") {
        if (!strategyData[strategy]) {
          strategyData[strategy] = { profit: 0, count: 0, wins: 0 }
        }
        strategyData[strategy].profit += trade.Profit
        strategyData[strategy].count++
        if (trade.Profit > 0) strategyData[strategy].wins++
      }
    })

    const symbols = Object.keys(symbolData).filter(s => symbolData[s].count >= 3)
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const pair = `${symbols[i]} / ${symbols[j]}`
        symbolPairs[pair] = { same: 0, opposite: 0 }
      }
    }

    const dailySymbolResults: Record<string, Record<string, number>> = {}
    trades.forEach((trade) => {
      if (!dailySymbolResults[trade.date]) {
        dailySymbolResults[trade.date] = {}
      }
      const symbol = trade.Item || "Unknown"
      if (!dailySymbolResults[trade.date][symbol]) {
        dailySymbolResults[trade.date][symbol] = 0
      }
      dailySymbolResults[trade.date][symbol] += trade.Profit
    })

    Object.values(dailySymbolResults).forEach((dayResults) => {
      const daySymbols = Object.keys(dayResults)
      for (let i = 0; i < daySymbols.length; i++) {
        for (let j = i + 1; j < daySymbols.length; j++) {
          const pair = `${daySymbols[i]} / ${daySymbols[j]}`
          const reversePair = `${daySymbols[j]} / ${daySymbols[i]}`
          const pairKey = symbolPairs[pair] ? pair : symbolPairs[reversePair] ? reversePair : null
          
          if (pairKey) {
            const result1 = dayResults[daySymbols[i]]
            const result2 = dayResults[daySymbols[j]]
            
            if ((result1 > 0 && result2 > 0) || (result1 < 0 && result2 < 0)) {
              symbolPairs[pairKey].same++
            } else {
              symbolPairs[pairKey].opposite++
            }
          }
        }
      }
    })

    const correlatedPairs = Object.entries(symbolPairs)
      .filter(([_, data]) => data.same + data.opposite >= 3)
      .map(([pair, data]) => ({
        pair,
        correlation: data.same / (data.same + data.opposite),
        samples: data.same + data.opposite,
      }))
      .sort((a, b) => b.correlation - a.correlation)

    const topSymbols = Object.entries(symbolData)
      .filter(([_, data]) => data.count >= 3)
      .map(([symbol, data]) => ({
        symbol,
        winRate: (data.wins / data.count) * 100,
        profit: data.profit,
        count: data.count,
      }))
      .sort((a, b) => b.profit - a.profit)

    const topStrategies = Object.entries(strategyData)
      .filter(([_, data]) => data.count >= 3)
      .map(([strategy, data]) => ({
        strategy,
        winRate: (data.wins / data.count) * 100,
        profit: data.profit,
        count: data.count,
      }))
      .sort((a, b) => b.profit - a.profit)

    return {
      topSymbols,
      topStrategies,
      correlatedPairs,
    }
  }, [trades])

  if (!analysis || trades.length < 10) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground">Need at least 10 trades for correlation analysis</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Symbol Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.topSymbols.slice(0, 6).map((item) => (
            <div key={item.symbol} className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">{item.symbol}</h4>
                <span className={cn(
                  "text-sm font-bold",
                  item.profit >= 0 ? "text-emerald-500" : "text-red-500"
                )}>
                  {formatValue(item.profit)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className={cn(
                    "font-medium",
                    item.winRate >= 50 ? "text-emerald-500" : "text-red-500"
                  )}>{item.winRate.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trades</span>
                  <span className="text-foreground">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {analysis.topStrategies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Strategy Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.topStrategies.slice(0, 6).map((item) => (
              <div key={item.strategy} className="rounded-xl border border-border bg-card/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">{item.strategy}</h4>
                  <span className={cn(
                    "text-sm font-bold",
                    item.profit >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                    {formatValue(item.profit)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className={cn(
                      "font-medium",
                      item.winRate >= 50 ? "text-emerald-500" : "text-red-500"
                    )}>{item.winRate.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trades</span>
                    <span className="text-foreground">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.correlatedPairs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Symbol Correlations</h3>
          <p className="text-sm text-muted-foreground">
            How often symbols move together (win/lose on the same days)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.correlatedPairs.slice(0, 4).map((item) => (
              <div key={item.pair} className="rounded-xl border border-border bg-card/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{item.pair}</h4>
                  <span className={cn(
                    "text-sm font-bold",
                    item.correlation >= 0.6 ? "text-emerald-500" : item.correlation <= 0.4 ? "text-red-500" : "text-amber-500"
                  )}>
                    {(item.correlation * 100).toFixed(0)}% correlated
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full",
                      item.correlation >= 0.6 ? "bg-emerald-500" : item.correlation <= 0.4 ? "bg-red-500" : "bg-amber-500"
                    )}
                    style={{ width: `${item.correlation * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.samples} data points</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Correlation Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.topSymbols.length > 0 && analysis.topSymbols[0].profit > 0 && (
            <InsightCard
              type="success"
              title={`Best Symbol: ${analysis.topSymbols[0].symbol}`}
              description={`${analysis.topSymbols[0].winRate.toFixed(0)}% win rate with ${formatValue(analysis.topSymbols[0].profit)} profit across ${analysis.topSymbols[0].count} trades.`}
            />
          )}
          {analysis.topStrategies.length > 0 && analysis.topStrategies[0].profit > 0 && (
            <InsightCard
              type="success"
              title={`Best Strategy: ${analysis.topStrategies[0].strategy}`}
              description={`${analysis.topStrategies[0].winRate.toFixed(0)}% win rate with ${formatValue(analysis.topStrategies[0].profit)} profit across ${analysis.topStrategies[0].count} trades.`}
            />
          )}
          {analysis.correlatedPairs.length > 0 && analysis.correlatedPairs[0].correlation >= 0.7 && (
            <InsightCard
              type="info"
              title="Highly Correlated Pair"
              description={`${analysis.correlatedPairs[0].pair} move together ${(analysis.correlatedPairs[0].correlation * 100).toFixed(0)}% of the time. Consider diversifying.`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SmartInsights({ trades, formatValue }: { trades: Trade[], formatValue: (v: number) => string }) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  
  const analysis = useMemo(() => {
    if (trades.length === 0) return null

    const symbolData: Record<string, { profit: number, count: number, wins: number }> = {}
    const strategyData: Record<string, { profit: number, count: number, wins: number }> = {}
    const dayData: Record<number, { profit: number, count: number, wins: number }> = {}
    const hourData: Record<number, { profit: number, count: number, wins: number }> = {}
    const dailyTrades: Record<string, Trade[]> = {}
    
    for (let i = 0; i < 7; i++) {
      dayData[i] = { profit: 0, count: 0, wins: 0 }
    }
    for (let i = 0; i < 24; i++) {
      hourData[i] = { profit: 0, count: 0, wins: 0 }
    }

    let totalWaitTime = 0
    let waitTimeCount = 0
    let quickTrades = 0
    let quickTradeWins = 0
    let slowTrades = 0
    let slowTradeWins = 0

    trades.forEach((trade, index) => {
      const symbol = trade.Item || "Unknown"
      const strategy = trade.strategy || "Unknown"
      const tradeDate = new Date(trade.date)
      const dayOfWeek = tradeDate.getDay()
      
      if (!symbolData[symbol]) symbolData[symbol] = { profit: 0, count: 0, wins: 0 }
      symbolData[symbol].profit += trade.Profit
      symbolData[symbol].count++
      if (trade.Profit > 0) symbolData[symbol].wins++

      if (strategy !== "Select" && strategy !== "Unknown") {
        if (!strategyData[strategy]) strategyData[strategy] = { profit: 0, count: 0, wins: 0 }
        strategyData[strategy].profit += trade.Profit
        strategyData[strategy].count++
        if (trade.Profit > 0) strategyData[strategy].wins++
      }

      dayData[dayOfWeek].profit += trade.Profit
      dayData[dayOfWeek].count++
      if (trade.Profit > 0) dayData[dayOfWeek].wins++

      const time = trade.time || (trade.OpenTime ? trade.OpenTime.split(" ")[1] || trade.OpenTime.split("T")[1] : null)
      if (time) {
        const hour = parseInt(time.split(":")[0], 10)
        if (!isNaN(hour)) {
          hourData[hour].profit += trade.Profit
          hourData[hour].count++
          if (trade.Profit > 0) hourData[hour].wins++
        }
      }

      if (!dailyTrades[trade.date]) dailyTrades[trade.date] = []
      dailyTrades[trade.date].push(trade)
    })

    Object.values(dailyTrades).forEach((dayTrades) => {
      for (let i = 1; i < dayTrades.length; i++) {
        const prevTrade = dayTrades[i - 1]
        const currTrade = dayTrades[i]
        const prevTime = prevTrade.CloseTime?.split(" ")[1] || prevTrade.time || "00:00"
        const currTime = currTrade.OpenTime?.split(" ")[1] || currTrade.time || "00:00"
        
        const prevMinutes = parseInt(prevTime.split(":")[0]) * 60 + parseInt(prevTime.split(":")[1] || "0")
        const currMinutes = parseInt(currTime.split(":")[0]) * 60 + parseInt(currTime.split(":")[1] || "0")
        const waitTime = currMinutes - prevMinutes
        
        if (waitTime > 0 && waitTime < 120) {
          totalWaitTime += waitTime
          waitTimeCount++
          
          if (waitTime < 5) {
            quickTrades++
            if (currTrade.Profit > 0) quickTradeWins++
          } else {
            slowTrades++
            if (currTrade.Profit > 0) slowTradeWins++
          }
        }
      }
    })

    const topSymbol = Object.entries(symbolData)
      .filter(([_, d]) => d.count >= 5)
      .sort((a, b) => b[1].profit - a[1].profit)[0]

    const topStrategy = Object.entries(strategyData)
      .filter(([_, d]) => d.count >= 3)
      .sort((a, b) => b[1].profit - a[1].profit)[0]

    const bestDay = Object.entries(dayData)
      .filter(([_, d]) => d.count >= 3)
      .sort((a, b) => (b[1].wins / b[1].count) - (a[1].wins / a[1].count))[0]

    const worstDay = Object.entries(dayData)
      .filter(([_, d]) => d.count >= 3)
      .sort((a, b) => (a[1].wins / a[1].count) - (b[1].wins / b[1].count))[0]

    const morningTrades = Object.entries(hourData)
      .filter(([h]) => parseInt(h) >= 6 && parseInt(h) < 12)
      .reduce((sum, [_, d]) => sum + d.count, 0)
    const afternoonTrades = Object.entries(hourData)
      .filter(([h]) => parseInt(h) >= 12 && parseInt(h) < 18)
      .reduce((sum, [_, d]) => sum + d.count, 0)
    const eveningTrades = Object.entries(hourData)
      .filter(([h]) => parseInt(h) >= 18 || parseInt(h) < 6)
      .reduce((sum, [_, d]) => sum + d.count, 0)

    let tradingStyle = "all-day"
    if (morningTrades > afternoonTrades * 1.5 && morningTrades > eveningTrades * 1.5) {
      tradingStyle = "morning"
    } else if (afternoonTrades > morningTrades * 1.5 && afternoonTrades > eveningTrades * 1.5) {
      tradingStyle = "afternoon"
    } else if (eveningTrades > morningTrades * 1.5 && eveningTrades > afternoonTrades * 1.5) {
      tradingStyle = "evening"
    }

    const avgWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 0
    const quickWinRate = quickTrades > 0 ? (quickTradeWins / quickTrades) * 100 : 0
    const slowWinRate = slowTrades > 0 ? (slowTradeWins / slowTrades) * 100 : 0

    const tips: { text: string, type: "success" | "warning" | "info" }[] = []

    if (slowWinRate > quickWinRate + 15 && slowTrades >= 5 && quickTrades >= 5) {
      tips.push({
        text: `You win ${slowWinRate.toFixed(0)}% when waiting 5+ minutes between trades vs ${quickWinRate.toFixed(0)}% for quick entries.`,
        type: "success"
      })
    }

    if (worstDay && bestDay && parseInt(worstDay[0]) !== parseInt(bestDay[0])) {
      const worstWinRate = (worstDay[1].wins / worstDay[1].count) * 100
      const bestWinRate = (bestDay[1].wins / bestDay[1].count) * 100
      if (bestWinRate - worstWinRate >= 20) {
        tips.push({
          text: `${dayNames[parseInt(worstDay[0])]}s are your worst day (${worstWinRate.toFixed(0)}% WR) - consider reducing size.`,
          type: "warning"
        })
      }
    }

    const afternoonHours = Object.entries(hourData).filter(([h]) => parseInt(h) >= 15 && parseInt(h) <= 17)
    const morningHours = Object.entries(hourData).filter(([h]) => parseInt(h) >= 9 && parseInt(h) <= 11)
    
    const afternoonWinRate = afternoonHours.reduce((sum, [_, d]) => sum + d.wins, 0) / 
      Math.max(1, afternoonHours.reduce((sum, [_, d]) => sum + d.count, 0)) * 100
    const morningWinRate = morningHours.reduce((sum, [_, d]) => sum + d.wins, 0) / 
      Math.max(1, morningHours.reduce((sum, [_, d]) => sum + d.count, 0)) * 100

    if (morningWinRate > afternoonWinRate + 25 && morningHours.reduce((s, [_, d]) => s + d.count, 0) >= 5) {
      tips.push({
        text: `Your win rate drops ${(morningWinRate - afternoonWinRate).toFixed(0)}% after 3 PM. Consider stopping earlier.`,
        type: "warning"
      })
    }

    if (topSymbol && topSymbol[1].count >= 10) {
      const winRate = (topSymbol[1].wins / topSymbol[1].count) * 100
      if (winRate >= 60) {
        tips.push({
          text: `${topSymbol[0]} is your edge with ${winRate.toFixed(0)}% win rate. Focus here.`,
          type: "success"
        })
      }
    }

    if (topStrategy && topStrategy[1].count >= 5) {
      const winRate = (topStrategy[1].wins / topStrategy[1].count) * 100
      if (winRate >= 55) {
        tips.push({
          text: `Your ${topStrategy[0]} strategy has ${winRate.toFixed(0)}% win rate - stick with it.`,
          type: "success"
        })
      }
    }

    let tradingDNA = "You're a "
    if (tradingStyle === "morning") tradingDNA += "morning trader"
    else if (tradingStyle === "afternoon") tradingDNA += "afternoon trader"
    else if (tradingStyle === "evening") tradingDNA += "evening/night trader"
    else tradingDNA += "flexible trader"
    
    if (topSymbol) {
      tradingDNA += ` who excels with ${topSymbol[0]}`
    }
    if (topStrategy) {
      const isScalp = topStrategy[0].toLowerCase().includes("scalp") || avgWaitTime < 15
      if (isScalp) {
        tradingDNA += " scalps"
      } else {
        tradingDNA += ` using ${topStrategy[0]}`
      }
    }
    tradingDNA += "."

    return {
      tradingDNA,
      dayData,
      tips,
      topSymbol,
      topStrategy,
      bestDay: bestDay ? { day: parseInt(bestDay[0]), ...bestDay[1] } : null,
      worstDay: worstDay ? { day: parseInt(worstDay[0]), ...worstDay[1] } : null,
      tradingStyle,
    }
  }, [trades])

  if (!analysis || trades.length < 15) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground">Need at least 15 trades for smart insights</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-violet-600/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-violet-500" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Your Trading DNA</h3>
            <p className="text-sm text-muted-foreground">Personalized profile based on your trading patterns</p>
          </div>
        </div>
        <p className="text-xl font-medium text-foreground">
          {analysis.tradingDNA}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Weekly Performance Pattern</h3>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
            const data = analysis.dayData[dayIndex]
            const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0
            const isBest = analysis.bestDay?.day === dayIndex
            const isWorst = analysis.worstDay?.day === dayIndex
            
            return (
              <div 
                key={dayIndex}
                className={cn(
                  "rounded-xl border p-4 text-center",
                  isBest ? "border-emerald-500/30 bg-emerald-500/5" :
                  isWorst ? "border-red-500/30 bg-red-500/5" :
                  "border-border bg-card/50"
                )}
              >
                <div className="text-sm font-medium text-foreground mb-1">
                  {dayNames[dayIndex].slice(0, 3)}
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  data.count === 0 ? "text-muted-foreground" :
                  winRate >= 55 ? "text-emerald-500" :
                  winRate >= 45 ? "text-amber-500" :
                  "text-red-500"
                )}>
                  {data.count > 0 ? `${winRate.toFixed(0)}%` : "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.count} trades
                </div>
                {isBest && <div className="text-xs text-emerald-500 mt-1">Best</div>}
                {isWorst && data.count >= 3 && <div className="text-xs text-red-500 mt-1">Worst</div>}
              </div>
            )
          })}
        </div>
      </div>

      {analysis.tips.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Personalized Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.tips.map((tip, i) => (
              <InsightCard
                key={i}
                type={tip.type}
                title={tip.type === "success" ? "Edge Identified" : tip.type === "warning" ? "Area to Improve" : "Insight"}
                description={tip.text}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.topSymbol && (
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-violet-500" />
              <h4 className="font-medium text-foreground">Top Instrument</h4>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{analysis.topSymbol[0]}</div>
            <div className="flex gap-4 text-sm">
              <span className={cn(
                (analysis.topSymbol[1].wins / analysis.topSymbol[1].count) * 100 >= 50 ? "text-emerald-500" : "text-red-500"
              )}>
                {((analysis.topSymbol[1].wins / analysis.topSymbol[1].count) * 100).toFixed(0)}% WR
              </span>
              <span className={analysis.topSymbol[1].profit >= 0 ? "text-emerald-500" : "text-red-500"}>
                {formatValue(analysis.topSymbol[1].profit)}
              </span>
              <span className="text-muted-foreground">{analysis.topSymbol[1].count} trades</span>
            </div>
          </div>
        )}
        
        {analysis.topStrategy && (
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-5 h-5 text-violet-500" />
              <h4 className="font-medium text-foreground">Top Strategy</h4>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{analysis.topStrategy[0]}</div>
            <div className="flex gap-4 text-sm">
              <span className={cn(
                (analysis.topStrategy[1].wins / analysis.topStrategy[1].count) * 100 >= 50 ? "text-emerald-500" : "text-red-500"
              )}>
                {((analysis.topStrategy[1].wins / analysis.topStrategy[1].count) * 100).toFixed(0)}% WR
              </span>
              <span className={analysis.topStrategy[1].profit >= 0 ? "text-emerald-500" : "text-red-500"}>
                {formatValue(analysis.topStrategy[1].profit)}
              </span>
              <span className="text-muted-foreground">{analysis.topStrategy[1].count} trades</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
