'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          Performance by time
        </h3>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-lg cursor-pointer",
            "bg-background border border-border text-foreground",
            "dark:bg-zinc-900 dark:border-white/[0.08]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          )}
        >
          {METRIC_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="h-[200px] sm:h-[256px] min-w-0 overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
            <XAxis 
              dataKey="hour" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tickFormatter={(v) => selectedMetric === 'totalPnl' ? `${(v / 1000).toFixed(1)}k` : v.toString()}
            />
            {selectedMetric === 'totalPnl' && (
              <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.2)" />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [formatValue(value), METRIC_OPTIONS.find(o => o.value === selectedMetric)?.label]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={selectedMetric === 'totalPnl' 
                    ? entry.isPositive ? '#10b981' : '#ef4444'
                    : '#14b8a6'
                  }
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
