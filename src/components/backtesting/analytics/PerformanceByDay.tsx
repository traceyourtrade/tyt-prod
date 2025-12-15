'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-5 min-w-0 overflow-hidden",
        "bg-card border-border",
        "dark:bg-zinc-900/50 dark:border-white/[0.08]"
      )}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Performance by day
      </h3>

      <div className="h-[256px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" horizontal={false} />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <YAxis 
              type="category"
              dataKey="day"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              width={40}
            />
            <ReferenceLine x={0} stroke="rgba(255, 255, 255, 0.2)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
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
                  fill={entry.isPositive ? '#10b981' : '#ef4444'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-end gap-2 mt-4">
        {chartData.filter(d => d.totalTrades > 0).map(d => (
          <div 
            key={d.day}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              d.winRate >= 50 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
            )}
          >
            {d.day}: {d.winRate.toFixed(0)}%
          </div>
        ))}
      </div>
    </motion.div>
  );
}
