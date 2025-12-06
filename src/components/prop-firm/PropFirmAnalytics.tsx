"use client"

import { useMemo } from "react"
import { TrendingUp, BarChart3, Clock, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts"
import usePropFirmStore from "@/store/propFirmStore"

interface Trade {
  date: string
  Profit: number
  Item: string
  Type: string
  [key: string]: unknown
}

function ChartCard({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string
  icon: any
  children: React.ReactNode 
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border backdrop-blur-sm",
      "bg-white dark:bg-transparent",
      "bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/5 dark:to-white/[0.02]",
      "border-gray-200 dark:border-white/10",
      "p-4"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20"
        )}>
          <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function TradeRow({ trade, index }: { trade: Trade; index: number }) {
  return (
    <div className={cn(
      "flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0",
      "hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
          trade.Profit >= 0 
            ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
            : "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400"
        )}>
          {index + 1}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{trade.Item}</p>
          <p className="text-xs text-gray-500 dark:text-white/50">{trade.date} • {trade.Type}</p>
        </div>
      </div>
      <p className={cn(
        "text-sm font-bold tabular-nums",
        trade.Profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}>
        {trade.Profit >= 0 ? "+" : ""}{trade.Profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </p>
    </div>
  )
}

export default function PropFirmAnalytics() {
  const { selectedAccounts } = useModeFilteredAccounts()
  const { settings } = usePropFirmStore()

  const chartData = useMemo(() => {
    const trades = selectedAccounts.flatMap(acc => acc.tradeData || []) as Trade[]
    
    const challengeStart = settings.challengeStartDate ? new Date(settings.challengeStartDate) : new Date(0)
    const filteredTrades = trades.filter(t => new Date(t.date) >= challengeStart)
    
    const sortedTrades = [...filteredTrades].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let cumulative = settings.startingBalance
    const dailyData: Record<string, number> = {}
    
    sortedTrades.forEach(trade => {
      cumulative += trade.Profit || 0
      dailyData[trade.date] = cumulative
    })

    return Object.entries(dailyData).map(([date, value]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value,
      profit: value - settings.startingBalance
    }))
  }, [selectedAccounts, settings])

  const recentTrades = useMemo(() => {
    const trades = selectedAccounts.flatMap(acc => acc.tradeData || []) as Trade[]
    const challengeStart = settings.challengeStartDate ? new Date(settings.challengeStartDate) : new Date(0)
    
    return trades
      .filter(t => new Date(t.date) >= challengeStart)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [selectedAccounts, settings])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-500 dark:text-white/50 mb-1">{label}</p>
        <p className={cn(
          "text-sm font-bold",
          payload[0].value >= settings.startingBalance ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        )}>
          ${payload[0].value?.toLocaleString()}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <ChartCard title="Equity Curve" icon={TrendingUp}>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                    className="dark:[&_text]:fill-white/50 dark:[&_line]:stroke-white/10"
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    className="dark:[&_text]:fill-white/50 dark:[&_line]:stroke-white/10"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fill="url(#equityGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-white/40 text-sm">
                No trading data available
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Recent Trades" icon={List}>
        <div className="space-y-1">
          {recentTrades.length > 0 ? (
            recentTrades.map((trade, index) => (
              <TradeRow key={`${trade.date}-${index}`} trade={trade} index={index} />
            ))
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-white/40 text-sm">
              No trades yet
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  )
}
