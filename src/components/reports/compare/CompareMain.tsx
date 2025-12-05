"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { GitCompare, Play, PieChart, TrendingUp } from 'lucide-react'
import { PieChart as MUIPieChart } from '@mui/x-charts/PieChart'
import { useDrawingArea } from '@mui/x-charts/hooks'
import { styled } from '@mui/material/styles'
import TradeGroupForm from './TradeGroupForm'
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import useAccountDetails from '@/store/accountdetails'
import LineChartCard from '../charts/LineChartCard'
import { formatCompactNumber } from '@/utils/formatNumber'

interface Trade {
  Item: string
  Profit: number
  Commission?: number
  Swap?: number
  OpenTime: string
  Type?: string
  Side?: string
}

interface PerformanceMetrics {
  netPnL: number
  avgDailyVolume: number
  avgTradeWinLoss: number
  maxTradeProfit: number
  maxTradeLoss: number
  avgNetTradePnL: number
  profitFactor: number
  avgHoldTime: string
}

interface FormValues {
  symbol: string
  startDate: string
  endDate: string
  tradeType: string
  tradePL: string
}

interface EnteredValues {
  group1: FormValues
  group2: FormValues
}

interface PieChartData {
  label: string
  value: number
  color: string
}

const CompareMain = () => {
  const { selectedAccounts } = useAccountDetails()
  const allTrades = selectedAccounts.flatMap((account: any) => account.tradeData || [])
  const [group1Trades, setGroup1Trades] = useState<Trade[]>([])
  const [group2Trades, setGroup2Trades] = useState<Trade[]>([])
  const [group1Metrics, setGroup1Metrics] = useState<PerformanceMetrics | null>(null)
  const [group2Metrics, setGroup2Metrics] = useState<PerformanceMetrics | null>(null)
  const [chartColors, setChartColors] = useState({ profit: '', loss: '', text: '' })
  const showStats = group1Metrics && group2Metrics

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement)
      setChartColors({
        profit: computedStyle.getPropertyValue('--chart-profit').trim() || '#22C55E',
        loss: computedStyle.getPropertyValue('--chart-loss').trim() || '#EF4444',
        text: computedStyle.getPropertyValue('--foreground').trim() || '#ffffff',
      })
    }
  }, [])

  const [enteredValues, setEnteredValues] = useState<EnteredValues>({
    group1: {
      symbol: '',
      startDate: '01-01-2000',
      endDate: new Date().toLocaleDateString('en-IN'),
      tradeType: 'buy',
      tradePL: 'win',
    },
    group2: {
      symbol: '',
      startDate: '01-01-2000',
      endDate: new Date().toLocaleDateString('en-IN'),
      tradeType: 'buy',
      tradePL: 'win',
    }
  })

  const handleInputChange = (group: keyof EnteredValues, field: keyof FormValues, value: string) => {
    setEnteredValues(prevValues => {
      const updatingGroup = prevValues[group]
      const updatedGroup = {
        ...updatingGroup,
        [field]: value
      }
      return { ...prevValues, [group]: updatedGroup }
    })
  }

  const handleCompare = () => {
    setGroup1Metrics(null)
    setGroup2Metrics(null)

    const group1TempTrades = allTrades.filter((trade: Trade) =>
      trade.Item.toLowerCase() === enteredValues.group1.symbol.toLowerCase()
    )

    const group2TempTrades = allTrades.filter((trade: Trade) =>
      trade.Item.toLowerCase() === enteredValues.group2.symbol.toLowerCase()
    )

    setGroup1Trades(group1TempTrades.length > 0 ? group1TempTrades : allTrades)
    setGroup2Trades(group2TempTrades.length > 0 ? group2TempTrades : allTrades)
  }

  useEffect(() => {
    if (group1Trades.length > 0) {
      setGroup1Metrics(calculatePerformanceMetrics(group1Trades))
    }
    if (group2Trades.length > 0) {
      setGroup2Metrics(calculatePerformanceMetrics(group2Trades))
    }
  }, [group1Trades, group2Trades])

  const data1: PieChartData[] = [
    { label: 'Win Trades', value: group1Trades.filter(trade => trade.Profit > 0).length || 0, color: chartColors.profit },
    { label: 'Loss Trades', value: group1Trades.filter(trade => trade.Profit < 0).length || 0, color: chartColors.loss }
  ]

  const data2: PieChartData[] = [
    { label: 'Win Trades', value: group2Trades.filter(trade => trade.Profit > 0).length || 0, color: chartColors.profit },
    { label: 'Loss Trades', value: group2Trades.filter(trade => trade.Profit < 0).length || 0, color: chartColors.loss }
  ]

  const PieCenterLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { width, height, left, top } = useDrawingArea()
    return (
      <StyledText x={left + width / 2} y={top + height / 2}>
        {children}
      </StyledText>
    )
  }

  const StyledText = styled('text')(() => ({
    fill: chartColors.text,
    textAnchor: 'middle',
    dominantBaseline: 'central',
    fontSize: 16,
    fontWeight: 600,
  }))

  const settings = {
    margin: { right: 20 },
    width: 280,
    height: 280,
    hideLegend: false,
  }

  const getStats = (trades: Trade[], metrics: PerformanceMetrics | null) => {
    if (!trades || !metrics) return []

    const totalCommissions = trades.reduce((sum, trade) => sum + (trade.Commission || 0), 0)
    const totalSwap = trades.reduce((sum, trade) => sum + (trade.Swap || 0), 0)

    return [
      { label: 'Total P&L', value: `$${metrics.netPnL.toFixed(2)}`, highlight: true, isProfit: metrics.netPnL >= 0 },
      { label: 'Average daily volume', value: formatCompactNumber(metrics.avgDailyVolume, 2) },
      { label: 'Average winning trade', value: `$${metrics.avgTradeWinLoss.toFixed(2)}` },
      { label: 'Average losing trade', value: `-$${Math.abs(metrics.avgTradeWinLoss).toFixed(2)}` },
      { label: 'Total number of trades', value: trades.length.toString() },
      { label: 'Number of winning trades', value: trades.filter(t => (t.Profit || 0) > 0).length.toString() },
      { label: 'Number of losing trades', value: trades.filter(t => (t.Profit || 0) < 0).length.toString() },
      { label: 'Number of break even trades', value: trades.filter(t => (t.Profit || 0) === 0).length.toString() },
      { label: 'Max consecutive wins', value: 'N/A' },
      { label: 'Max consecutive losses', value: 'N/A' },
      { label: 'Total commissions', value: `$${totalCommissions.toFixed(2)}` },
      { label: 'Total fees', value: '$0' },
      { label: 'Total swap', value: `$${totalSwap.toFixed(2)}` },
      { label: 'Largest profit', value: `$${metrics.maxTradeProfit.toFixed(2)}`, highlight: true, isProfit: true },
      { label: 'Largest loss', value: `$${metrics.maxTradeLoss.toFixed(2)}`, highlight: true, isProfit: false },
      { label: 'Average hold time (All trades)', value: metrics.avgHoldTime },
      { label: 'Average hold time (Winning trades)', value: 'N/A' },
      { label: 'Average hold time (Losing trades)', value: 'N/A' },
      { label: 'Average hold time (Scratch trades)', value: 'N/A' },
      { label: 'Average trade P&L', value: `$${metrics.avgNetTradePnL.toFixed(2)}` },
      { label: 'Profit factor', value: metrics.profitFactor.toFixed(2) },
    ]
  }

  const group1Stats = getStats(group1Trades, group1Metrics)
  const group2Stats = getStats(group2Trades, group2Metrics)

  const pieChartComp = (data: PieChartData[]) => {
    return (
      <div className="flex justify-center">
        <MUIPieChart
          series={[{ innerRadius: 60, outerRadius: 90, data }]}
          {...settings}
          sx={{
            '& .MuiChartsLegend-root': { 
              color: 'var(--foreground)' 
            },
            '& .MuiChartsLegend-label': { 
              fill: 'var(--foreground)',
              fontSize: '12px'
            },
          }}
        >
          <PieCenterLabel>Trades</PieCenterLabel>
        </MUIPieChart>
      </div>
    )
  }

  const StatsList = ({ stats, group }: { stats: any[]; group: string }) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <GitCompare className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Statistics ({group})</h3>
          <span className="text-xs text-muted-foreground uppercase">All Dates</span>
        </div>
      </div>
      <div className="p-4 space-y-0">
        {stats.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors px-2 rounded">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className={`text-sm font-medium ${
              item.highlight
                ? item.isProfit ? 'text-profit' : 'text-loss'
                : 'text-foreground'
            }`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const EvaluationCard = ({ data, group, title }: { data: PieChartData[]; group: string; title: string }) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <PieChart className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title} ({group})</h3>
          <span className="text-xs text-muted-foreground uppercase">All Dates</span>
        </div>
      </div>
      <div className="p-4">
        {pieChartComp(data)}
      </div>
    </div>
  )

  const ChartCard = ({ trades, group }: { trades: Trade[]; group: string }) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Cumulative P&L ({group})</h3>
          <span className="text-xs text-muted-foreground uppercase">All Dates</span>
        </div>
      </div>
      <div className="p-4">
        <div className="h-64">
          <LineChartCard
            xLabel="Date"
            yLabel="Daily Net Cumulative P&L"
            data={calculateCumulativePnL(trades)}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TradeGroupForm
          title={`Group #1 (${group1Trades.length} Trades Matched)`}
          values={enteredValues}
          updateValues={handleInputChange}
          group="group1"
        />
        <TradeGroupForm
          title={`Group #2 (${group2Trades.length} Trades Matched)`}
          values={enteredValues}
          updateValues={handleInputChange}
          group="group2"
        />
      </div>

      {/* Apply Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCompare}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Play className="h-4 w-4" />
          Apply Comparison
        </button>
      </div>

      {/* Results */}
      {showStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Group 1 Column */}
          <div className="space-y-4">
            <StatsList stats={group1Stats} group="Group #1" />
            <EvaluationCard data={data1} group="Group #1" title="Overall Evaluation" />
            <ChartCard trades={group1Trades} group="Group #1" />
          </div>

          {/* Group 2 Column */}
          <div className="space-y-4">
            <StatsList stats={group2Stats} group="Group #2" />
            <EvaluationCard data={data2} group="Group #2" title="Overall Evaluation" />
            <ChartCard trades={group2Trades} group="Group #2" />
          </div>
        </div>
      )}
    </div>
  )
}

export default CompareMain
