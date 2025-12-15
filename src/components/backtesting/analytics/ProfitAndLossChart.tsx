'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import type { EquityPoint } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  data: EquityPoint[];
  totalPnl: number;
  accountBalance: number;
  winRate: number;
  totalTrades: number;
  breakEvenTrades: number;
  initialBalance: number;
}

export default function ProfitAndLossChart({
  data,
  totalPnl,
  accountBalance,
  winRate,
  totalTrades,
  breakEvenTrades,
  initialBalance
}: Props) {
  const [timeRange, setTimeRange] = useState<'all' | 'day'>('all');

  const filteredData = useMemo(() => {
    if (timeRange === 'all' || data.length === 0) {
      return data;
    }
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const dayData = data.filter(point => point.timestamp >= oneDayAgo);
    
    if (dayData.length === 0 && data.length > 0) {
      return data.slice(-1);
    }
    
    return dayData;
  }, [data, timeRange]);

  const gainPercent = initialBalance > 0 ? ((totalPnl / initialBalance) * 100).toFixed(2) : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-4 sm:p-5 min-w-0 overflow-hidden",
        "bg-card border-border",
        "dark:bg-zinc-900/50 dark:border-white/[0.08]"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Profit and Loss
          </h3>
          <p className="text-xs text-muted-foreground">Over time</p>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-border dark:border-white/[0.08]">
          <button
            onClick={() => setTimeRange('all')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              timeRange === 'all' 
                ? "bg-muted text-foreground" 
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            onClick={() => setTimeRange('day')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              timeRange === 'day' 
                ? "bg-muted text-foreground" 
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Total PnL</p>
          <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
            <span className={cn("text-base sm:text-xl font-bold", totalPnl >= 0 ? "text-profit" : "text-loss")}>
              ${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={cn(
              "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded",
              totalPnl >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
            )}>
              {totalPnl >= 0 ? '+' : ''}{gainPercent}%
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Account Balance</p>
          <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
            <span className="text-base sm:text-xl font-bold text-foreground truncate">
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={cn(
              "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded hidden sm:inline",
              totalPnl >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
            )}>
              {totalPnl >= 0 ? '+' : ''}{gainPercent}%
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
          <span className="text-base sm:text-xl font-bold text-foreground">
            {winRate.toFixed(2)}%
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Trades</p>
          <span className="text-base sm:text-xl font-bold text-foreground">
            {totalTrades}
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Breakeven Trades</p>
          <span className="text-base sm:text-xl font-bold text-foreground">
            {breakEvenTrades}
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">BE Threshold</p>
          <div className="flex items-center gap-1 sm:gap-2">
            <input 
              type="number"
              defaultValue={0}
              className={cn(
                "w-12 sm:w-16 px-1 sm:px-2 py-1 text-xs sm:text-sm rounded",
                "bg-background border border-border text-foreground",
                "dark:bg-zinc-900 dark:border-white/[0.08]"
              )}
            />
            <button className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs rounded bg-muted text-muted-foreground hover:text-foreground transition-colors">
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className="h-[256px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={totalPnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={totalPnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={totalPnl >= 0 ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill="url(#pnlGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
