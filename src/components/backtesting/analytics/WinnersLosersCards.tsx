'use client';

import { motion } from 'framer-motion';
import type { WinLossStats } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  winners: WinLossStats;
  losers: WinLossStats;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

function StatRow({ label, value, isPercent = false, color }: { label: string; value: number | string; isPercent?: boolean; color?: string }) {
  const displayValue = typeof value === 'number' 
    ? isPercent 
      ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
      : value.toFixed(2)
    : value;

  return (
    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.05))' }}>
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>{label}</span>
        <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
      </div>
      <span className="text-sm font-medium" style={{ color: color || 'var(--af-text-primary, #f4f4f5)' }}>
        {displayValue}
      </span>
    </div>
  );
}

export default function WinnersLosersCards({ winners, losers }: Props) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
        Winners and Losers
      </h3>
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
          <h4 className="font-semibold mb-3" style={{ color: 'var(--af-profit, #10b981)' }}>Winners</h4>
          <StatRow label="Total winners" value={winners.total} />
          <StatRow label="Best win" value={winners.bestPercent} isPercent color="var(--af-profit, #10b981)" />
          <StatRow label="Average win" value={winners.averagePercent} isPercent color="var(--af-profit, #10b981)" />
          <StatRow label="Average duration" value={formatDuration(winners.averageDuration)} />
          <StatRow label="Max consecutive wins" value={winners.maxConsecutive} />
          <StatRow label="Avg consecutive wins" value={winners.avgConsecutive} />
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
          <h4 className="font-semibold mb-3" style={{ color: 'var(--af-loss, #ef4444)' }}>Losers</h4>
          <StatRow label="Total losers" value={losers.total} />
          <StatRow label="Worst loss" value={losers.bestPercent} isPercent color="var(--af-loss, #ef4444)" />
          <StatRow label="Average loss" value={losers.averagePercent} isPercent color="var(--af-loss, #ef4444)" />
          <StatRow label="Average duration" value={formatDuration(losers.averageDuration)} />
          <StatRow label="Max consecutive losses" value={losers.maxConsecutive} />
          <StatRow label="Avg consecutive losses" value={losers.avgConsecutive} />
        </motion.div>
      </div>
    </div>
  );
}
