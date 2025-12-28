'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, BarChart3 } from 'lucide-react';
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
  avg,
  color,
  gradientId
}: { 
  title: string; 
  data: TradeFrequency[]; 
  avg: number;
  color: string;
  gradientId: string;
}) {
  return (
    <div className={cn(
      "relative rounded-xl overflow-hidden p-4",
      "bg-muted/30 border border-border",
      "dark:bg-white/[0.02] dark:border-white/[0.06]",
      "hover:bg-muted/50 dark:hover:bg-white/[0.04] transition-all duration-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Avg</span>
          <span className={cn("font-bold text-sm", color)}>{avg.toFixed(2)}</span>
        </div>
      </div>

      <div className="h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="25%">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" horizontal vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="transparent"
              tick={{ fill: '#52525b', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="transparent"
              tick={{ fill: '#52525b', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={25}
            />
            <ReferenceLine 
              y={avg} 
              stroke="#14b8a6" 
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
              contentStyle={{
                backgroundColor: 'rgba(24, 24, 27, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                padding: '8px 12px',
                fontSize: 12
              }}
              formatter={(value: number) => [
                <span key="v" className="text-white font-medium">{value} trades</span>,
                ''
              ]}
            />
            <Bar 
              dataKey="count" 
              fill={`url(#${gradientId})`}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
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
  const totalTrades = daily.length > 0 ? daily.reduce((sum, d) => sum + d.count, 0) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-card border border-border",
        "dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-zinc-900/60 dark:to-zinc-800/40",
        "dark:border-white/[0.08]",
        "backdrop-blur-xl"
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.01] via-transparent to-pink-500/[0.01] dark:from-indigo-500/[0.02] dark:to-pink-500/[0.02] pointer-events-none" />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-indigo-500/20 to-indigo-600/10",
            "border border-indigo-500/20"
          )}>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Trade Frequency</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {totalTrades} total trades analyzed
            </p>
          </div>
        </div>

        {/* Frequency cards grid */}
        <div className="grid grid-cols-1 gap-3">
          <FrequencyCard 
            title="Trades / Day" 
            data={daily} 
            avg={avgDaily}
            color="text-blue-400"
            gradientId="freqGradientDaily"
          />
          <FrequencyCard 
            title="Trades / Week" 
            data={weekly} 
            avg={avgWeekly}
            color="text-cyan-400"
            gradientId="freqGradientWeekly"
          />
          <FrequencyCard 
            title="Trades / Month" 
            data={monthly} 
            avg={avgMonthly}
            color="text-teal-400"
            gradientId="freqGradientMonthly"
          />
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
            <span className="text-xs text-zinc-400">Trade Count</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 border-t-2 border-dashed border-teal-500" />
            <span className="text-xs text-zinc-400">Average</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
