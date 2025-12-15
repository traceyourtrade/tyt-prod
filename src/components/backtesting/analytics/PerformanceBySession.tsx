'use client';

import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
          Performance by session
        </h3>
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric, i) => (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl p-4 overflow-hidden"
            style={{ 
              background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
              border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{metric.label}</h4>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
            </div>
            
            <div className="h-36">
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
                    tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 10 }}
                  />
                  <Radar
                    name={metric.label}
                    dataKey="value"
                    stroke="var(--af-accent-blue, #3b82f6)"
                    fill="var(--af-accent-blue, #3b82f6)"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--af-accent-blue, #3b82f6)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--af-bg-elevated, #12141a)',
                      border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                      borderRadius: '8px',
                      color: 'var(--af-text-primary, #f4f4f5)'
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
