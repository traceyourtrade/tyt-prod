'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
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
      className="rounded-2xl p-5 overflow-hidden"
      style={{ 
        background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
        border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
            Performance by time
          </h3>
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
        </div>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
          className="px-3 py-1.5 text-sm rounded-lg cursor-pointer"
          style={{ 
            backgroundColor: 'var(--af-bg-base, #0c0d10)',
            border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
            color: 'var(--af-text-primary, #f4f4f5)'
          }}
        >
          {METRIC_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
            <XAxis 
              dataKey="hour" 
              stroke="var(--af-text-disabled, #52525b)"
              tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <YAxis 
              stroke="var(--af-text-disabled, #52525b)"
              tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tickFormatter={(v) => selectedMetric === 'totalPnl' ? `${(v / 1000).toFixed(1)}k` : v.toString()}
            />
            {selectedMetric === 'totalPnl' && (
              <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.2)" />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--af-bg-elevated, #12141a)',
                border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                color: 'var(--af-text-primary, #f4f4f5)'
              }}
              formatter={(value: number) => [formatValue(value), METRIC_OPTIONS.find(o => o.value === selectedMetric)?.label]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={selectedMetric === 'totalPnl' 
                    ? entry.isPositive ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'
                    : 'var(--af-accent-teal, #14b8a6)'
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
