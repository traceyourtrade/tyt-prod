"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Clock, 
  BarChart3, 
  Calendar,
  ArrowDownRight,
  Target,
  Activity,
  Layers,
  Timer,
  Zap
} from 'lucide-react'
import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import useCurrencyStore, { formatCompactCurrency } from '@/store/currencyStore'

export default function SummarySection({ trades = [] }: { trades?: any[] }) {
  const { selectedAccounts } = useModeFilteredAccounts()
  const { currency, exchangeRate } = useCurrencyStore()
  const [calculations, setCalculations] = useState<any>({
    netPnL: 0,
    winPercentage: 0,
    avgDailyWinPercentage: 0,
    profitFactor: 0,
    tradeExpectancy: 0,
    avgDailyWinLoss: 0,
    avgTradeWinLoss: 0,
    avgHoldTime: 'N/A',
    avgNetTradePnL: 0,
    avgDailyNetPnL: 0,
    avgPlannedRMultiple: 0,
    avgRealizedRMultiple: 0,
    avgDailyVolume: 0,
    loggedDays: 0,
    maxDailyNetDrawdown: 0,
    avgDailyNetDrawdown: 0,
    maxDailyProfit: 0,
    maxDailyLoss: 0,
    avgDailyHoldTime: '00H 00M',
    longsWinPercentage: 0,
    shortsWinPercentage: 0,
    maxTradeProfit: 0,
    maxTradeLoss: 0,
    maxTradeDuration: 0,
  })

  useEffect(() => {
    const processData = () => {
      const calc = calculatePerformanceMetrics(trades)
      setCalculations(calc)
    }
    if (trades?.length) processData()
  }, [trades])

  const formatValue = (value: any, isCurrency = false, suffix = '') => {
    if (value === null || value === undefined || isNaN(value)) {
      return isCurrency ? formatCompactCurrency(0, currency, exchangeRate) : `0${suffix}`
    }
    if (typeof value === 'number') {
      if (isCurrency) {
        return formatCompactCurrency(value, currency, exchangeRate)
      }
      return `${value.toFixed(2)}${suffix}`
    }
    return `${value}${suffix}`
  }

  const [activeTab, setActiveTab] = useState('Summary')

  const tabOptions = [
    { id: 'Summary', label: 'Summary', icon: Layers },
    { id: 'Days', label: 'Days', icon: Calendar },
    { id: 'Trades', label: 'Trades', icon: Zap },
  ]

  const summaryStats = [
    { 
      label: 'Net P&L', 
      value: formatValue(calculations.netPnL, true),
      icon: DollarSign,
      category: 'pnl',
      variant: (calculations.netPnL || 0) >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Win Rate', 
      value: formatValue(calculations.winPercentage, false, '%'),
      icon: Percent,
      category: 'performance',
    },
    { 
      label: 'Profit Factor', 
      value: formatValue(calculations.profitFactor),
      icon: Activity,
      category: 'performance',
    },
    { 
      label: 'Trade Expectancy', 
      value: formatValue(calculations.tradeExpectancy, true),
      icon: Target,
      category: 'performance',
      variant: (calculations.tradeExpectancy || 0) >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Avg Daily Win %', 
      value: formatValue(calculations.avgDailyWinPercentage, false, '%'),
      icon: TrendingUp,
      category: 'performance',
    },
    { 
      label: 'Avg Daily Win/Loss', 
      value: formatValue(calculations.avgDailyWinLoss, true),
      icon: BarChart3,
      category: 'performance',
    },
    { 
      label: 'Avg Trade Win/Loss', 
      value: formatValue(calculations.avgTradeWinLoss, true),
      icon: BarChart3,
      category: 'trades',
    },
    { 
      label: 'Avg Hold Time', 
      value: calculations.avgHoldTime ?? 'N/A',
      icon: Clock,
      category: 'time',
    },
    { 
      label: 'Avg Net Trade P&L', 
      value: formatValue(calculations.avgNetTradePnL, true),
      icon: DollarSign,
      category: 'pnl',
      variant: (calculations.avgNetTradePnL || 0) >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Avg Daily Net P&L', 
      value: formatValue(calculations.avgDailyNetPnL, true),
      icon: DollarSign,
      category: 'pnl',
      variant: (calculations.avgDailyNetPnL || 0) >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Planned R-Multiple', 
      value: `${calculations.avgPlannedRMultiple ?? 0}R`,
      icon: Target,
      category: 'risk',
    },
    { 
      label: 'Realized R-Multiple', 
      value: `${calculations.avgRealizedRMultiple ?? 0}R`,
      icon: Target,
      category: 'risk',
    },
    { 
      label: 'Avg Daily Volume', 
      value: formatValue(calculations.avgDailyVolume),
      icon: Activity,
      category: 'volume',
    },
    { 
      label: 'Logged Days', 
      value: (calculations.loggedDays ?? 0).toString(),
      icon: Calendar,
      category: 'time',
    },
    { 
      label: 'Max Daily Drawdown', 
      value: formatValue(calculations.maxDailyNetDrawdown, true),
      icon: ArrowDownRight,
      category: 'drawdown',
      variant: 'loss'
    },
    { 
      label: 'Avg Daily Drawdown', 
      value: formatValue(calculations.avgDailyNetDrawdown, true),
      icon: ArrowDownRight,
      category: 'drawdown',
      variant: 'loss'
    },
  ]

  const daysStats = [
    { 
      label: 'Avg Daily Win %', 
      value: formatValue(calculations.avgDailyWinPercentage, false, '%'),
      icon: TrendingUp,
    },
    { 
      label: 'Avg Daily Win/Loss', 
      value: formatValue(calculations.avgDailyWinLoss, true),
      icon: BarChart3,
    },
    { 
      label: 'Avg Daily Net P&L', 
      value: formatValue(calculations.avgDailyNetPnL, true),
      icon: DollarSign,
      variant: calculations.avgDailyNetPnL >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Largest Profitable Day', 
      value: formatValue(calculations.maxDailyProfit, true),
      icon: TrendingUp,
      variant: 'profit'
    },
    { 
      label: 'Largest Losing Day', 
      value: formatValue(calculations.maxDailyLoss, true),
      icon: ArrowDownRight,
      variant: 'loss'
    },
    { 
      label: 'Avg Trading Duration', 
      value: `${calculations.avgDailyHoldTime ?? ''}`,
      icon: Timer,
    },
    { 
      label: 'Logged Days', 
      value: (calculations.loggedDays ?? 0).toString(),
      icon: Calendar,
    },
    { 
      label: 'Max Daily Drawdown', 
      value: formatValue(calculations.maxDailyNetDrawdown, true),
      icon: ArrowDownRight,
      variant: 'loss'
    },
    { 
      label: 'Avg Daily Drawdown', 
      value: formatValue(calculations.avgDailyNetDrawdown, true),
      icon: ArrowDownRight,
      variant: 'loss'
    },
  ]

  const tradesStats = [
    { 
      label: 'Win Rate', 
      value: formatValue(calculations.winPercentage, false, '%'),
      icon: Percent,
    },
    { 
      label: 'Avg Trade Win/Loss', 
      value: formatValue(calculations.avgTradeWinLoss, true),
      icon: BarChart3,
    },
    { 
      label: 'Avg Net Trade P&L', 
      value: formatValue(calculations.avgNetTradePnL, true),
      icon: DollarSign,
      variant: calculations.avgNetTradePnL >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Trade Expectancy', 
      value: formatValue(calculations.tradeExpectancy, true),
      icon: Target,
      variant: calculations.tradeExpectancy >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Largest Profitable Trade', 
      value: formatValue(calculations.maxTradeProfit, true),
      icon: TrendingUp,
      variant: 'profit'
    },
    { 
      label: 'Largest Losing Trade', 
      value: formatValue(calculations.maxTradeLoss, true),
      icon: ArrowDownRight,
      variant: 'loss'
    },
    { 
      label: 'Avg Hold Time', 
      value: calculations.avgHoldTime ?? 'N/A',
      icon: Clock,
    },
    { 
      label: 'Longest Trade Duration', 
      value: `${calculations.maxTradeDuration ?? 0}`,
      icon: Timer,
    },
    { 
      label: 'Avg Daily Volume', 
      value: formatValue(calculations.avgDailyVolume),
      icon: Activity,
    },
  ]

  const getActiveStats = () => {
    switch (activeTab) {
      case 'Days': return daysStats
      case 'Trades': return tradesStats
      default: return summaryStats
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden"
    >
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Tab Header */}
      <div className="flex items-center gap-1 p-3 border-b border-border/50 bg-muted/20">
        {tabOptions.map((tab) => {
          const Icon = tab.icon
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Stats Grid */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {getActiveStats().map((stat, index) => {
              const Icon = stat.icon
              const variant = (stat as any).variant
              const valueColor = 
                variant === 'profit' ? 'text-profit' :
                variant === 'loss' ? 'text-loss' :
                'text-foreground'
              const iconBg = 
                variant === 'profit' ? 'bg-profit/10 text-profit' :
                variant === 'loss' ? 'bg-loss/10 text-loss' :
                'bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'

              return (
                <motion.div
                  key={`${activeTab}-${stat.label}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="group relative bg-muted/20 hover:bg-muted/40 border border-border/50 hover:border-border rounded-xl p-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${iconBg}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium truncate">{stat.label}</span>
                      </div>
                      <p className={`text-lg md:text-xl font-bold tracking-tight ${valueColor}`}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 pointer-events-none" />
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
