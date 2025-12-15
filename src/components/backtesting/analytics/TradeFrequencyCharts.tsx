'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { TradeFrequency } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  daily: TradeFrequency[];
  weekly: TradeFrequency[];
  monthly: TradeFrequency[];
  avgDaily: number;
  avgWeekly: number;
  avgMonthly: number;
}

function FrequencyCard({ 
  title, 
  data, 
  avg 
}: { 
  title: string; 
  data: TradeFrequency[]; 
  avg: number; 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 overflow-hidden"
      style={{ 
        background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
        border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Avg</span>
          <span className="font-semibold" style={{ color: 'var(--af-accent-blue, #3b82f6)' }}>{avg.toFixed(2)}</span>
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" horizontal vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="var(--af-text-disabled, #52525b)"
              tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <YAxis 
              stroke="var(--af-text-disabled, #52525b)"
              tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <ReferenceLine 
              y={avg} 
              stroke="var(--af-accent-teal, #14b8a6)" 
              strokeDasharray="5 5" 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--af-bg-elevated, #12141a)',
                border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                color: 'var(--af-text-primary, #f4f4f5)'
              }}
              formatter={(value: number) => [value, 'Trades']}
            />
            <Bar 
              dataKey="count" 
              fill="var(--af-accent-blue, #3b82f6)" 
              radius={[4, 4, 0, 0]}
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default function TradeFrequencyCharts({ 
  daily, 
  weekly, 
  monthly, 
  avgDaily, 
  avgWeekly, 
  avgMonthly 
}: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
          Average trade frequency
        </h3>
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <FrequencyCard title="Trades / day" data={daily} avg={avgDaily} />
        <FrequencyCard title="Trades / week" data={weekly} avg={avgWeekly} />
        <FrequencyCard title="Trades / month" data={monthly} avg={avgMonthly} />
      </div>
    </div>
  );
}
