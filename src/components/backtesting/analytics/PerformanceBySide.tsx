'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import type { SidePerformance } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  data: SidePerformance[];
}

const COLORS = {
  long: '#3b82f6',
  short: '#14b8a6'
};

export default function PerformanceBySide({ data }: Props) {
  const totalTradesData = data.map(d => ({
    name: d.side === 'long' ? 'Buy' : 'Sell',
    value: d.totalTrades,
    side: d.side
  }));

  const winRateData = data.map(d => ({
    name: d.side === 'long' ? 'Buy' : 'Sell',
    value: d.winRate,
    side: d.side
  }));

  const total = data.reduce((sum, d) => sum + d.totalTrades, 0);
  const longPercent = total > 0 ? ((data.find(d => d.side === 'long')?.totalTrades || 0) / total * 100) : 0;
  const shortPercent = total > 0 ? ((data.find(d => d.side === 'short')?.totalTrades || 0) / total * 100) : 0;

  const longWinRate = data.find(d => d.side === 'long')?.winRate || 0;
  const shortWinRate = data.find(d => d.side === 'short')?.winRate || 0;

  return (
    <div className="min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Performance by side
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl border p-3 sm:p-4 min-w-0 overflow-hidden",
            "bg-card border-border",
            "dark:bg-zinc-900/50 dark:border-white/[0.08]"
          )}
        >
          <h4 className="font-medium text-foreground mb-2 text-sm sm:text-base">Total Trades</h4>
          
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Buy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-xs text-muted-foreground">Sell</span>
            </div>
          </div>

          <div className="h-[140px] sm:h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalTradesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {totalTradesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.side as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs text-teal-500">{shortPercent.toFixed(1)}%</div>
                <div className="text-xs text-blue-500">{longPercent.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "rounded-2xl border p-3 sm:p-4 min-w-0 overflow-hidden",
            "bg-card border-border",
            "dark:bg-zinc-900/50 dark:border-white/[0.08]"
          )}
        >
          <h4 className="font-medium text-foreground mb-2 text-sm sm:text-base">Win Rate</h4>
          
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Buy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-xs text-muted-foreground">Sell</span>
            </div>
          </div>

          <div className="h-[140px] sm:h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {winRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.side as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs text-teal-500">{shortWinRate.toFixed(0)}%</div>
                <div className="text-xs text-blue-500">{longWinRate.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
