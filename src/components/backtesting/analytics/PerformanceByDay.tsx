'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayPerformance } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  data: DayPerformance[];
}

export default function PerformanceByDay({ data }: Props) {
  const sortedData = [...data].sort((a, b) => {
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return order.indexOf(a.day) - order.indexOf(b.day);
  });

  const chartData = sortedData.map(d => ({
    ...d,
    isPositive: d.totalPnl >= 0
  }));

  // Find best performing day (guard against empty data)
  const bestDay = data.length > 0 
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
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-rose-500/[0.03] pointer-events-none" />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-violet-500/20 to-violet-600/10",
            "border border-violet-500/20"
          )}>
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Performance by Day</h3>
            {bestDay && bestDay.totalTrades > 0 && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Best day: <span className="text-emerald-400">{bestDay.day}</span>
              </p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
              <defs>
                <linearGradient id="dayBarPositive" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="dayBarNegative" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" horizontal={false} />
              <XAxis 
                type="number"
                stroke="transparent"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <YAxis 
                type="category"
                dataKey="day"
                stroke="transparent"
                tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <ReferenceLine x={0} stroke="rgba(255, 255, 255, 0.1)" />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                contentStyle={{
                  backgroundColor: 'rgba(24, 24, 27, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  padding: '10px 14px'
                }}
                formatter={(value: number, name: string, props: any) => {
                  const day = props.payload;
                  return [
                    <div key="tooltip" className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-400 text-xs">P&L</span>
                        <span className={cn(
                          "font-semibold",
                          value >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          ${value.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-400 text-xs">Win Rate</span>
                        <span className="text-white">{day.winRate.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-400 text-xs">Trades</span>
                        <span className="text-white">{day.totalTrades}</span>
                      </div>
                    </div>,
                    ''
                  ];
                }}
              />
              <Bar dataKey="totalPnl" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.isPositive ? 'url(#dayBarPositive)' : 'url(#dayBarNegative)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win rate badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/[0.06]">
          {chartData.filter(d => d.totalTrades > 0).map(d => (
            <div 
              key={d.day}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium",
                "flex items-center gap-1.5",
                d.winRate >= 50 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              )}
            >
              <span className="text-zinc-400">{d.day}</span>
              <span>{d.winRate.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
