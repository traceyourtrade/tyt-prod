"use client"

import { useEffect, useState } from 'react'
import { 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Clock, 
  BarChart3, 
  Calendar,
  ArrowDownRight,
  Target,
  Activity
} from 'lucide-react'
import StatItem from './StatItem'
import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import useCurrencyStore, { formatCompactCurrency, currencySymbols } from '@/store/currencyStore'

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

  const stats = [
    { 
      label: 'Net P&L', 
      value: formatValue(calculations.netPnL, true),
      icon: <DollarSign className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Total profit and loss',
      variant: calculations.netPnL >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Win %', 
      value: formatValue(calculations.winPercentage, false, '%'),
      icon: <Percent className="h-4 w-4" />,
      isDays: false, 
      isTrades: true, 
      isSummary: true, 
      tooltip: 'Percentage of winning trades',
      variant: 'default'
    },
    { 
      label: 'Avg daily win %', 
      value: formatValue(calculations.avgDailyWinPercentage, false, '%'),
      icon: <TrendingUp className="h-4 w-4" />,
      isDays: true, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Average daily win percentage',
      variant: 'default'
    },
    { 
      label: 'Profit factor', 
      value: formatValue(calculations.profitFactor),
      icon: <Activity className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Gross profit / gross loss',
      variant: 'default'
    },
    { 
      label: 'Trade expectancy', 
      value: formatValue(calculations.tradeExpectancy, true),
      icon: <Target className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Expected value per trade',
      variant: calculations.tradeExpectancy >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Avg daily win/loss', 
      value: formatValue(calculations.avgDailyWinLoss, true),
      icon: <BarChart3 className="h-4 w-4" />,
      isDays: true, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Average win vs loss ratio',
      variant: 'default'
    },
    { 
      label: 'Avg trade win/loss', 
      value: formatValue(calculations.avgTradeWinLoss, true),
      icon: <BarChart3 className="h-4 w-4" />,
      isDays: false, 
      isTrades: true, 
      isSummary: true, 
      tooltip: 'Average trade outcome',
      variant: 'default'
    },
    { 
      label: 'Avg hold time', 
      value: calculations.avgHoldTime ?? 'N/A',
      icon: <Clock className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Average duration of trades',
      variant: 'default'
    },
    { 
      label: 'Avg net trade P&L', 
      value: formatValue(calculations.avgNetTradePnL, true),
      icon: <DollarSign className="h-4 w-4" />,
      isDays: false, 
      isTrades: true, 
      isSummary: true, 
      tooltip: 'Average profit per trade',
      variant: calculations.avgNetTradePnL >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Avg daily net P&L', 
      value: formatValue(calculations.avgDailyNetPnL, true),
      icon: <DollarSign className="h-4 w-4" />,
      isDays: true, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Average daily profit',
      variant: calculations.avgDailyNetPnL >= 0 ? 'profit' : 'loss'
    },
    { 
      label: 'Avg. planned r-multiple', 
      value: `${calculations.avgPlannedRMultiple ?? 0}R`,
      icon: <Target className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Planned risk-reward ratio',
      variant: 'default'
    },
    { 
      label: 'Avg. realized r-multiple', 
      value: `${calculations.avgRealizedRMultiple ?? 0}R`,
      icon: <Target className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Actual risk-reward ratio',
      variant: 'default'
    },
    { 
      label: 'Avg daily volume', 
      value: formatValue(calculations.avgDailyVolume),
      icon: <BarChart3 className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Average contracts/shares traded',
      variant: 'default'
    },
    { 
      label: 'Logged days', 
      value: (calculations.loggedDays ?? 0).toString(),
      icon: <Calendar className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Days with journal entries',
      variant: 'default'
    },
    { 
      label: 'Max daily net drawdown', 
      value: formatValue(calculations.maxDailyNetDrawdown, true),
      icon: <ArrowDownRight className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Maximum single-day loss',
      variant: 'loss'
    },
    { 
      label: 'Avg daily net drawdown', 
      value: formatValue(calculations.avgDailyNetDrawdown, true),
      icon: <ArrowDownRight className="h-4 w-4" />,
      isDays: false, 
      isTrades: false, 
      isSummary: true, 
      tooltip: 'Average daily drawdown',
      variant: 'loss'
    },
  ]

  const daysExtra = [
    { 
      label: 'Largest profitable day', 
      value: formatValue(calculations.maxDailyProfit, true),
      icon: <TrendingUp className="h-4 w-4" />,
      isDays: true, 
      isTrades: false, 
      tooltip: 'Largest single-day profit',
      variant: 'profit'
    },
    { 
      label: 'Largest losing day', 
      value: formatValue(calculations.maxDailyLoss, true),
      icon: <ArrowDownRight className="h-4 w-4" />,
      isDays: true, 
      isTrades: false, 
      tooltip: 'Largest single-day loss',
      variant: 'loss'
    },
  ]

  const tradesExtra = [
    { 
      label: 'Longest trade duration', 
      value: `${calculations.maxTradeDuration ?? 0}`,
      icon: <Clock className="h-4 w-4" />,
      isDays: false, 
      isTrades: true, 
      tooltip: 'Longest held trade',
      variant: 'default'
    },
    { 
      label: 'Trade expectancy', 
      value: formatValue(calculations.tradeExpectancy),
      icon: <Target className="h-4 w-4" />,
      isDays: false, 
      isTrades: true, 
      tooltip: 'Trade expectancy',
      variant: 'default'
    },
    { 
      label: 'Average trading days duration', 
      value: `${calculations.avgDailyHoldTime ?? ''}`,
      icon: <Clock className="h-4 w-4" />,
      isDays: true, 
      isTrades: false, 
      tooltip: 'Average trading days duration',
      variant: 'default'
    },
    { 
      label: 'Largest profitable trade', 
      value: formatValue(calculations.maxTradeProfit, true),
      icon: <TrendingUp className="h-4 w-4" />,
      isDays: false, 
      isTrades: true, 
      tooltip: 'Largest profit ever got in a single trade',
      variant: 'profit'
    },
    { 
      label: 'Largest Losing trade', 
      value: formatValue(calculations.maxTradeLoss, true),
      icon: <ArrowDownRight className="h-4 w-4" />,
      isDays: false, 
      isTrades: true, 
      tooltip: 'Largest loss ever got in a single trade',
      variant: 'loss'
    },
  ]

  const [activeTab, setActiveTab] = useState('Summary')

  const tabOptions = [
    { id: 'Summary', label: 'Summary' },
    { id: 'Days', label: 'Days' },
    { id: 'Trades', label: 'Trades' },
  ]

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
        {tabOptions.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[...stats, ...tradesExtra, ...daysExtra].map((stat, index) => {
            const s = stat as any
            if ((activeTab === 'Summary' && s.isSummary) || (activeTab === 'Days' && s.isDays) || (activeTab === 'Trades' && s.isTrades)) {
              return (
                <StatItem 
                  key={index} 
                  label={s.label} 
                  value={s.value} 
                  icon={s.icon}
                  infoTooltip={s.tooltip}
                  variant={s.variant}
                />
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}
