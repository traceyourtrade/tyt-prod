'use client';

import { useState } from 'react';
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

  const filteredData = timeRange === 'day' && data.length > 10 
    ? data.slice(-10) 
    : data;

  const gainPercent = initialBalance > 0 ? ((totalPnl / initialBalance) * 100).toFixed(2) : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 overflow-hidden"
      style={{ 
        background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
        border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
            Profit and Loss
          </h3>
          <p className="text-xs" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Over time</p>
        </div>
        <div 
          className="flex rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))' }}
        >
          <button
            onClick={() => setTimeRange('all')}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ 
              backgroundColor: timeRange === 'all' ? 'var(--af-bg-hover, #1e222d)' : 'transparent',
              color: timeRange === 'all' ? 'var(--af-text-primary, #f4f4f5)' : 'var(--af-text-disabled, #52525b)'
            }}
          >
            All
          </button>
          <button
            onClick={() => setTimeRange('day')}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ 
              backgroundColor: timeRange === 'day' ? 'var(--af-bg-hover, #1e222d)' : 'transparent',
              color: timeRange === 'day' ? 'var(--af-text-primary, #f4f4f5)' : 'var(--af-text-disabled, #52525b)'
            }}
          >
            Day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Total PnL</span>
            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold" style={{ color: totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)' }}>
              ${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span 
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ 
                backgroundColor: totalPnl >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'
              }}
            >
              {totalPnl >= 0 ? '+' : ''}{gainPercent}%
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Account Balance</span>
            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span 
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ 
                backgroundColor: totalPnl >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'
              }}
            >
              {totalPnl >= 0 ? '+' : ''}{gainPercent}%
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Win Rate</span>
            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
            {winRate.toFixed(2)}%
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Total Trades</span>
            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
            {totalTrades}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Breakeven Trades</span>
            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
            {breakEvenTrades}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Breakeven Threshold</span>
            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number"
              defaultValue={0}
              className="w-16 px-2 py-1 text-sm rounded"
              style={{ 
                backgroundColor: 'var(--af-bg-base, #0c0d10)',
                border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                color: 'var(--af-text-primary, #f4f4f5)'
              }}
            />
            <button 
              className="px-2 py-1 text-xs rounded"
              style={{ 
                backgroundColor: 'var(--af-bg-hover, #1e222d)',
                color: 'var(--af-text-muted, #a1a1aa)'
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className="h-64">
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
              stroke="var(--af-text-disabled, #52525b)"
              tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <YAxis 
              stroke="var(--af-text-disabled, #52525b)"
              tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--af-bg-elevated, #12141a)',
                border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                color: 'var(--af-text-primary, #f4f4f5)'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'}
              strokeWidth={2}
              fill="url(#pnlGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
