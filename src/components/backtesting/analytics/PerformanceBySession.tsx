'use client';

import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import type { SessionPerformance } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  data: SessionPerformance[];
}

const METRICS = [
  { key: 'winRate', label: 'Win Rate', format: (v: number) => `${v.toFixed(0)}%` },
  { key: 'totalTrades', label: 'Total Trades', format: (v: number) => v.toString() },
  { key: 'avgRR', label: 'Avg RR', format: (v: number) => v.toFixed(2) },
  { key: 'profit', label: 'Profit', format: (v: number) => `$${v.toFixed(0)}` }
];

export default function PerformanceBySession({ data }: Props) {
  const maxTrades = Math.max(...data.map(d => d.totalTrades), 1);
  const maxRR = Math.max(...data.map(d => Math.abs(d.avgRR)), 1);
  
  const profits = data.map(d => d.profit);
  const minProfit = Math.min(...profits);
  const maxProfit = Math.max(...profits);
  const profitRange = Math.max(Math.abs(minProfit), Math.abs(maxProfit), 1);

  const normalizeValue = (value: number, metric: string): number => {
    switch (metric) {
      case 'winRate':
        return Math.max(0, Math.min(100, value));
      case 'totalTrades':
        return Math.max(0, (value / maxTrades) * 100);
      case 'avgRR':
        return Math.max(0, (Math.abs(value) / maxRR) * 100);
      case 'profit':
        return Math.max(0, ((value + profitRange) / (2 * profitRange)) * 100);
      default:
        return Math.max(0, value);
    }
  };

  const createRadarData = (metric: keyof SessionPerformance) => {
    return data.map(d => ({
      session: d.session,
      value: normalizeValue(d[metric] as number, metric),
      actualValue: d[metric]
    }));
  };

  return (
    <div className="min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Performance by session
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {METRICS.map((metric, i) => (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={cn(
              "rounded-2xl border p-3 sm:p-4 min-w-0 overflow-hidden",
              "bg-card border-border",
              "dark:bg-zinc-900/50 dark:border-white/[0.08]"
            )}
          >
            <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">{metric.label}</h4>
            
            <div className="h-[140px] sm:h-[160px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  data={createRadarData(metric.key as keyof SessionPerformance)}
                  cx="50%" 
                  cy="50%"
                >
                  <PolarGrid 
                    stroke="rgba(255, 255, 255, 0.1)" 
                    strokeDasharray="3 3"
                  />
                  <PolarAngleAxis 
                    dataKey="session" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name={metric.label}
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      metric.format(props.payload.actualValue),
                      metric.label
                    ]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
