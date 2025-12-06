"use client"

import React, { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react'
import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts'
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL'
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics'
import LineChartCard from '@/components/reports/charts/LineChartCard'
import YearlyCalendar from './components/YearlyCalendar'
import MonthlyCalendarWithPnL from './components/MonthlyCalendarWithPnL'
import PnLPerWeekChart from './components/PnLPerWeekChart'
import { calculateWeeklyPnL } from '@/utils/reports/calculateWeeklyPnL'
import { getDailyPnL } from '@/utils/reports/getDailyPnL'
import StatTable from '../overview/StatTable'

interface Trade {
  date: string
  Profit: number
  [key: string]: any
}

const CalendarMain = () => {
  const { selectedAccounts } = useModeFilteredAccounts()
  const trades = selectedAccounts.flatMap((account: any) => account.tradeData || [])
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear())
  const currentYear = new Date().getFullYear()
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())

  const netDailyPnL = getDailyPnL(trades, "net_pnl")

  const isCurrentMonth = (dateString: string): boolean => {
    const date = new Date(dateString)
    return date.getFullYear() === displayYear && date.getMonth() === selectedMonth
  }

  const thisMonthData = trades.filter((trade: Trade) => isCurrentMonth(trade.date))
  const cumulativePnLData = calculateCumulativePnL(thisMonthData)
  const metrics = calculatePerformanceMetrics(thisMonthData)

  const winCount = thisMonthData.filter((trade: Trade) => trade.Profit > 0).length || 0
  const lossCount = thisMonthData.filter((trade: Trade) => trade.Profit < 0).length || 0
  const totalTrades = winCount + lossCount
  const winRate = totalTrades > 0 ? ((winCount / totalTrades) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Year Navigation Card */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Year Overview</h3>
          </div>

          {/* Year Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDisplayYear((prev) => prev - 1)}
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground min-w-[60px] text-center">
              {displayYear}
            </span>
            <button
              onClick={() => setDisplayYear((prev) => prev + 1)}
              disabled={currentYear <= displayYear}
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Yearly Calendar */}
        <div className="p-4">
          <YearlyCalendar
            currentYear={displayYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            data={netDailyPnL}
          />
        </div>
      </div>

      {/* Monthly View & Weekly P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyCalendarWithPnL
            year={displayYear}
            monthIndex={selectedMonth}
            data={netDailyPnL}
          />
        </div>
        <div className="lg:col-span-1">
          <PnLPerWeekChart
            year={displayYear}
            month={selectedMonth}
            data={calculateWeeklyPnL(selectedMonth, displayYear, thisMonthData)}
          />
        </div>
      </div>

      {/* Cumulative P&L Chart */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Daily Net Cumulative P&L</h3>
            <span className="text-xs text-muted-foreground uppercase">All Dates</span>
          </div>
        </div>
        <div className="p-4">
          <div className="h-72">
            <LineChartCard
              data={cumulativePnLData}
              yLabel="Daily Net P&L"
              xLabel="Date"
            />
          </div>
        </div>
      </div>

      {/* Win/Loss Distribution */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <PieChartIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Trade Distribution</h3>
            <span className="text-xs text-muted-foreground uppercase">This Month</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Win Rate Card */}
            <div className="bg-muted/30 rounded-xl p-6 border border-border text-center">
              <div className="text-3xl font-bold text-primary mb-1">{winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>

            {/* Wins Card */}
            <div className="bg-profit/5 rounded-xl p-6 border border-profit/20 text-center">
              <div className="text-3xl font-bold text-profit mb-1">{winCount}</div>
              <div className="text-sm text-muted-foreground">Winning Trades</div>
            </div>

            {/* Losses Card */}
            <div className="bg-loss/5 rounded-xl p-6 border border-loss/20 text-center">
              <div className="text-3xl font-bold text-loss mb-1">{lossCount}</div>
              <div className="text-sm text-muted-foreground">Losing Trades</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Statistics</h3>
            <span className="text-xs text-muted-foreground uppercase">This Month</span>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <StatTable trades={thisMonthData} metrics={metrics} />
        </div>
      </div>
    </div>
  )
}

export default CalendarMain
