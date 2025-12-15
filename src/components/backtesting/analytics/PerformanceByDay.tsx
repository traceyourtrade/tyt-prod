'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
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
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
          Performance by day
        </h3>
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" horizontal={false} />
            <XAxis 
              type="number"
              stroke="var(--af-text-disabled, #52525b)"
              tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <YAxis 
              type="category"
              dataKey="day"
              stroke="var(--af-text-disabled, #52525b)"
              tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              width={40}
            />
            <ReferenceLine x={0} stroke="rgba(255, 255, 255, 0.2)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--af-bg-elevated, #12141a)',
                border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                color: 'var(--af-text-primary, #f4f4f5)'
              }}
              formatter={(value: number, name: string, props: any) => {
                const day = props.payload;
                return [
                  <div key="tooltip" className="space-y-1">
                    <div>P&L: ${value.toLocaleString()}</div>
                    <div>Win Rate: {day.winRate.toFixed(0)}%</div>
                    <div>Trades: {day.totalTrades}</div>
                  </div>,
                  ''
                ];
              }}
            />
            <Bar dataKey="totalPnl" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.isPositive ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-end gap-2 mt-3">
        {chartData.filter(d => d.totalTrades > 0).map(d => (
          <div 
            key={d.day}
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: d.winRate >= 50 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: d.winRate >= 50 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'
            }}
          >
            {d.day}: {d.winRate.toFixed(0)}%
          </div>
        ))}
      </div>
    </motion.div>
  );
}
