'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
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
      className={cn(
        "rounded-2xl border p-4 min-w-0 overflow-hidden",
        "bg-card border-border",
        "dark:bg-zinc-900/50 dark:border-white/[0.08]"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-foreground">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Avg</span>
          <span className="font-semibold text-blue-500">{avg.toFixed(2)}</span>
        </div>
      </div>

      <div className="h-[128px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" horizontal vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            />
            <ReferenceLine 
              y={avg} 
              stroke="#14b8a6" 
              strokeDasharray="5 5" 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [value, 'Trades']}
            />
            <Bar 
              dataKey="count" 
              fill="#3b82f6" 
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
    <div className="min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Average trade frequency
      </h3>

      <div className="grid md:grid-cols-3 gap-4">
        <FrequencyCard title="Trades / day" data={daily} avg={avgDaily} />
        <FrequencyCard title="Trades / week" data={weekly} avg={avgWeekly} />
        <FrequencyCard title="Trades / month" data={monthly} avg={avgMonthly} />
      </div>
    </div>
  );
}
