'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimePerformance } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  data: TimePerformance[];
}

type MetricType = 'totalPnl' | 'winRate' | 'totalTrades' | 'avgRR';

const METRIC_OPTIONS: { value: MetricType; label: string }[] = [
  { value: 'totalPnl', label: 'Total Profit/Loss' },
  { value: 'winRate', label: 'Win Rate' },
  { value: 'totalTrades', label: 'Total Trades' },
  { value: 'avgRR', label: 'Avg R:R' }
];

export default function PerformanceByTime({ data }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('totalPnl');

  const chartData = data.map(d => ({
    hour: `${d.hour}:00`,
    value: d[selectedMetric],
    isPositive: selectedMetric === 'totalPnl' ? d.totalPnl >= 0 : true
  }));

  const formatValue = (value: number) => {
    switch (selectedMetric) {
      case 'totalPnl':
        return `$${value.toLocaleString()}`;
      case 'winRate':
        return `${value.toFixed(1)}%`;
      case 'avgRR':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  // Find best performing hour (guard against empty data)
  const bestHour = data.length > 0 
    ? data.reduce((best, current) => current.totalPnl > best.totalPnl ? current : best, data[0])
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/40",
        "border border-white/[0.08]",
        "backdrop-blur-xl"
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-emerald-500/[0.03] pointer-events-none" />
      
      <div className="relative p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
              "border border-blue-500/20"
            )}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-white">Performance by Time</h3>
              {bestHour && bestHour.totalTrades > 0 && (
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">
                  Best hour: <span className="text-emerald-400">{bestHour.hour}:00</span>
                </p>
              )}
            </div>
          </div>
          
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
            className={cn(
              "px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg cursor-pointer w-full sm:w-auto",
              "bg-white/[0.05] border border-white/[0.08] text-zinc-300",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30",
              "transition-all duration-200"
            )}
          >
            {METRIC_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-[180px] sm:h-[220px] -mx-2 overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="15%">
              <defs>
                <linearGradient id="barGradientPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="barGradientNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="barGradientNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
              <XAxis 
                dataKey="hour" 
                stroke="transparent"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="transparent"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => selectedMetric === 'totalPnl' ? `${(v / 1000).toFixed(1)}k` : v.toString()}
                width={45}
              />
              {selectedMetric === 'totalPnl' && (
                <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.1)" />
              )}
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                contentStyle={{
                  backgroundColor: 'rgba(24, 24, 27, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  padding: '10px 14px'
                }}
                labelStyle={{ color: '#a1a1aa', fontSize: 12, marginBottom: 4 }}
                formatter={(value: number) => [
                  <span key="value" className="text-white font-medium">{formatValue(value)}</span>,
                  <span key="label" className="text-zinc-400">{METRIC_OPTIONS.find(o => o.value === selectedMetric)?.label}</span>
                ]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={selectedMetric === 'totalPnl' 
                      ? (entry.isPositive ? 'url(#barGradientPositive)' : 'url(#barGradientNegative)')
                      : 'url(#barGradientNeutral)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
