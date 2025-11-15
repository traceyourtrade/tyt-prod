"use client"

import { useEffect, useState } from 'react'
import StatItem from './StatItem'
import useAccountDetails from '@/store/accountdetails'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL'

export default function SummarySection({trades=[]}: {trades?: any[]}) {
  const { selectedAccounts } = useAccountDetails()
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

  const stats = [
    { label: 'Net P&L', value: `$${calculations.netPnL?.toFixed?.(2) ?? '0.00'}`, isDays: false, isTrades: false, isSummary: true, tooltip: 'Total profit and loss' },
    { label: 'Win %', value: `${(calculations.winPercentage ?? 0).toFixed(2)}%`, isDays: false, isTrades: true, isSummary: true, tooltip: 'Percentage of winning trades' },
    { label: 'Avg daily win %', value: `${(calculations.avgDailyWinPercentage ?? 0).toFixed(2)}%`, isDays: true, isTrades: false, isSummary: true, tooltip: 'Average daily win percentage' },
    { label: 'Profit factor', value: (calculations.profitFactor ?? 0).toFixed?.(2) ?? 0, isDays: false, isTrades: false, isSummary: true, tooltip: 'Gross profit / gross loss' },
    { label: 'Trade expectancy', value: `$${(calculations.tradeExpectancy ?? 0).toFixed?.(2) ?? 0}`, isDays: false, isTrades: false, isSummary: true, tooltip: 'Expected value per trade' },
    { label: 'Avg daily win/loss', value: `$${(calculations.avgDailyWinLoss ?? 0).toFixed?.(2) ?? 0}`, isDays: true, isTrades: false, isSummary: true, tooltip: 'Average win vs loss ratio' },
    { label: 'Avg trade win/loss', value: `$${(calculations.avgTradeWinLoss ?? 0).toFixed?.(2) ?? 0}`, isDays: false, isTrades: true, isSummary: true, tooltip: 'Average trade outcome' },
    { label: 'Avg hold time', value: calculations.avgHoldTime ?? 'N/A', isDays: false, isTrades: false, isSummary: true, tooltip: 'Average duration of trades' },
    { label: 'Avg net trade P&L', value: `$${(calculations.avgNetTradePnL ?? 0).toFixed?.(2) ?? 0}`, isDays: false, isTrades: true, isSummary: true, tooltip: 'Average profit per trade' },
    { label: 'Avg daily net P&L', value: `$${(calculations.avgDailyNetPnL ?? 0).toFixed?.(2) ?? 0}`, isDays: true, isTrades: false, isSummary: true, tooltip: 'Average daily profit' },
    { label: 'Avg. planned r-multiple', value: `${calculations.avgPlannedRMultiple ?? 0}R`, isDays: false, isTrades: false, isSummary: true, tooltip: 'Planned risk-reward ratio' },
    { label: 'Avg. realized r-multiple', value: `${calculations.avgRealizedRMultiple ?? 0}R`, isDays: false, isTrades: false, isSummary: true, tooltip: 'Actual risk-reward ratio' },
    { label: 'Avg daily volume', value: (calculations.avgDailyVolume ?? 0).toFixed?.(2) ?? 0, isDays: false, isTrades: false, isSummary: true, tooltip: 'Average contracts/shares traded' },
    { label: 'Logged days', value: (calculations.loggedDays ?? 0).toString(), isDays: false, isTrades: false, isSummary: true, tooltip: 'Days with journal entries' },
    { label: 'Max daily net drawdown', value: `$${(calculations.maxDailyNetDrawdown ?? 0).toFixed?.(2) ?? 0}`, isDays: false, isTrades: false, isSummary: true, tooltip: 'Maximum single-day loss' },
    { label: 'Avg daily net drawdown', value: `$${(calculations.avgDailyNetDrawdown ?? 0).toFixed?.(2) ?? 0}`, isDays: false, isTrades: false, isSummary: true, tooltip: 'Average daily drawdown' },
  ]

  const daysExtra = [
    { label: 'Largest profitable day', value: `$${(calculations.maxDailyProfit ?? 0).toFixed?.(2) ?? 0}`, isDays: true, isTrades: false, tooltip: 'Largest single-day profit' },
    { label: 'Largest losing day', value: `$${(calculations.maxDailyLoss ?? 0).toFixed?.(2) ?? 0}`, isDays: true, isTrades: false, tooltip: 'Largest single-day loss' },
  ]

  const tradesExtra = [
    { label: 'Longest trade duration', value: `${calculations.maxTradeDuration ?? 0}`, isDays: false, isTrades: true, tooltip: 'Longest held trade' },
    { label: 'Trade expectancy', value: `${(calculations.tradeExpectancy ?? 0).toFixed?.(2) ?? 0}`, isDays: false, isTrades: true, tooltip: 'Trade expectancy' },
    { label: 'Average trading days duration', value: `${calculations.avgDailyHoldTime ?? ''}`, isDays: true, isTrades: false, tooltip: 'Average trading days duration' },
    { label: 'Largest profitable trade', value: `$${(calculations.maxTradeProfit ?? 0).toFixed?.(2) ?? 0}`, isDays: false, isTrades: true, tooltip: 'Largest Profit ever got in a single day' },
    { label: 'Largest Losing trade', value: `$${(calculations.maxTradeLoss ?? 0).toFixed?.(2) ?? 0}`, isDays: false, isTrades: true, tooltip: 'Largest loss ever got in a single day' },
  ]

  const [activeTab, setActiveTab] = useState('Summary')

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('Summary')} className={`px-3 py-1 rounded-md ${activeTab === 'Summary' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-300 border border-[#333]'}`}>Summary</button>
        <button onClick={() => setActiveTab('Days')} className={`px-3 py-1 rounded-md ${activeTab === 'Days' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-300 border border-[#333]'}`}>Days</button>
        <button onClick={() => setActiveTab('Trades')} className={`px-3 py-1 rounded-md ${activeTab === 'Trades' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-300 border border-[#333]'}`}>Trades</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...stats, ...tradesExtra, ...daysExtra].map((stat, index) => {
          const s = stat as any
          if ((activeTab === 'Summary' && s.isSummary) || (activeTab === 'Days' && s.isDays) || (activeTab === 'Trades' && s.isTrades)) {
            return (
              <StatItem key={index} label={s.label} value={s.value} infoTooltip={s.tooltip} />
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
