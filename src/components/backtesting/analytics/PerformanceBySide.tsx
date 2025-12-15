'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
          Performance by side
        </h3>
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 overflow-hidden"
          style={{ 
            background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
            border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>Total Trades</h4>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.long }} />
              <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Buy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.short }} />
              <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Sell</span>
            </div>
          </div>

          <div className="h-48 relative">
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
                    backgroundColor: 'var(--af-bg-elevated, #12141a)',
                    border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                    borderRadius: '8px',
                    color: 'var(--af-text-primary, #f4f4f5)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs mb-0.5" style={{ color: COLORS.short }}>{shortPercent.toFixed(1)}%</div>
                <div className="text-xs" style={{ color: COLORS.long }}>{longPercent.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-4 overflow-hidden"
          style={{ 
            background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
            border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>Win Rate</h4>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.long }} />
              <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Buy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.short }} />
              <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Sell</span>
            </div>
          </div>

          <div className="h-48 relative">
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
                    backgroundColor: 'var(--af-bg-elevated, #12141a)',
                    border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                    borderRadius: '8px',
                    color: 'var(--af-text-primary, #f4f4f5)'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs mb-0.5" style={{ color: COLORS.short }}>{shortWinRate.toFixed(0)}%</div>
                <div className="text-xs" style={{ color: COLORS.long }}>{longWinRate.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
