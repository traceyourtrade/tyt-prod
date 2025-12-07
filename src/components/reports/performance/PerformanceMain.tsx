"use client"

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Plus, 
  MoreHorizontal,
  ChevronDown,
  Zap,
  Target,
  Percent,
  DollarSign,
  Activity
} from 'lucide-react'
import LineChartCard from '@/components/reports/charts/LineChartCard'
import BarChartCard from '@/components/reports/charts/BarChartCard'
import SummarySection from './SummarySection'
import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts'
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import useCurrencyStore, { formatCompactCurrency } from '@/store/currencyStore'

type Props = {
  metric?: string
  type?: string
}

export default function PerformanceMain({ metric = 'pnl', type = 'gross' }: Props) {
  const { selectedAccounts } = useModeFilteredAccounts()
  const { currency, exchangeRate } = useCurrencyStore()
  const trades = selectedAccounts.flatMap((account: any) => account.tradeData || [])

  const netPLData = useMemo(() => calculateCumulativePnL(trades as any), [trades])
  const metrics = useMemo(() => calculatePerformanceMetrics(trades), [trades])

  const avgDailyData = useMemo(() => {
    const map: Record<string, { date: string; value: number; count: number }> = {}
    trades.forEach((trade: any) => {
      const date = trade.date
      if (!map[date]) map[date] = { date, value: 0, count: 0 }
      map[date].value += (trade.Profit || 0) + (trade.Commission || 0) + (trade.Swap || 0)
      map[date].count++
    })
    return Object.values(map).map((d) => ({ date: d.date, value: parseFloat((d.value / Math.max(1, d.count)).toFixed(2)) }))
  }, [trades])

  const heroStats = [
    {
      label: 'Net P&L',
      value: formatCompactCurrency(metrics.netPnL || 0, currency, exchangeRate),
      icon: DollarSign,
      change: metrics.netPnL >= 0 ? '+' : '',
      isPositive: metrics.netPnL >= 0,
      bgGradient: metrics.netPnL >= 0 ? 'from-profit/10 to-profit/5' : 'from-loss/10 to-loss/5',
      iconBg: metrics.netPnL >= 0 ? 'bg-profit/20' : 'bg-loss/20',
      iconColor: metrics.netPnL >= 0 ? 'text-profit' : 'text-loss',
    },
    {
      label: 'Win Rate',
      value: `${(metrics.winPercentage || 0).toFixed(1)}%`,
      icon: Percent,
      change: '',
      isPositive: (metrics.winPercentage || 0) >= 50,
      bgGradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
    },
    {
      label: 'Profit Factor',
      value: (metrics.profitFactor || 0).toFixed(2),
      icon: Activity,
      change: '',
      isPositive: (metrics.profitFactor || 0) >= 1,
      bgGradient: 'from-amber-500/10 to-amber-500/5',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Expectancy',
      value: formatCompactCurrency(metrics.tradeExpectancy || 0, currency, exchangeRate),
      icon: Target,
      change: metrics.tradeExpectancy >= 0 ? '+' : '',
      isPositive: metrics.tradeExpectancy >= 0,
      bgGradient: metrics.tradeExpectancy >= 0 ? 'from-profit/10 to-profit/5' : 'from-loss/10 to-loss/5',
      iconBg: metrics.tradeExpectancy >= 0 ? 'bg-profit/20' : 'bg-loss/20',
      iconColor: metrics.tradeExpectancy >= 0 ? 'text-profit' : 'text-loss',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {heroStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-xl border border-border/50 p-4 md:p-5 group hover:border-border transition-all duration-300`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              {stat.isPositive ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
            </div>
            
            <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
            <p className={`text-xl md:text-2xl font-bold tracking-tight ${stat.isPositive ? 'text-foreground' : 'text-foreground'}`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Net P&L Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-border transition-all duration-300"
        >
          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Net P&L</h3>
                <p className="text-xs text-muted-foreground">Cumulative performance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-colors">
                Day
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="h-64 md:h-72">
              <LineChartCard 
                data={netPLData as any} 
                xLabel="date" 
                yLabel="Net P&L" 
                styles={{}} 
              />
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                <span className="text-xs text-muted-foreground font-medium">Cumulative P&L</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Avg Daily Win/Loss Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-border transition-all duration-300"
        >
          <div className="h-0.5 bg-gradient-to-r from-transparent via-profit/40 to-transparent" />
          
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-profit/20 to-profit/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-profit" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Daily Performance</h3>
                <p className="text-xs text-muted-foreground">Average win/loss by day</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-colors">
                Day
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="h-64 md:h-72">
              <BarChartCard 
                data={avgDailyData as any} 
                xLabel="date" 
                yLabel="Avg Daily"
              />
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-profit shadow-sm shadow-profit/50" />
                <span className="text-xs text-muted-foreground font-medium">Profitable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-loss shadow-sm shadow-loss/50" />
                <span className="text-xs text-muted-foreground font-medium">Loss</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Summary Section */}
      <SummarySection trades={trades} />
    </div>
  )
}
