'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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

function StatRow({ label, value, isPercent = false, colorClass }: { label: string; value: number | string; isPercent?: boolean; colorClass?: string }) {
  const displayValue = typeof value === 'number' 
    ? isPercent 
      ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
      : value.toFixed(2)
    : value;

  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 dark:border-white/[0.05]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", colorClass || "text-foreground")}>
        {displayValue}
      </span>
    </div>
  );
}

export default function WinnersLosersCards({ winners, losers }: Props) {
  return (
    <div className="min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Winners and Losers
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl border p-4 min-w-0 overflow-hidden",
            "bg-card border-border",
            "dark:bg-zinc-900/50 dark:border-white/[0.08]"
          )}
        >
          <h4 className="font-semibold text-profit mb-3">Winners</h4>
          <StatRow label="Total winners" value={winners.total} />
          <StatRow label="Best win" value={winners.bestPercent} isPercent colorClass="text-profit" />
          <StatRow label="Average win" value={winners.averagePercent} isPercent colorClass="text-profit" />
          <StatRow label="Average duration" value={formatDuration(winners.averageDuration)} />
          <StatRow label="Max consecutive wins" value={winners.maxConsecutive} />
          <StatRow label="Avg consecutive wins" value={winners.avgConsecutive} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "rounded-2xl border p-4 min-w-0 overflow-hidden",
            "bg-card border-border",
            "dark:bg-zinc-900/50 dark:border-white/[0.08]"
          )}
        >
          <h4 className="font-semibold text-loss mb-3">Losers</h4>
          <StatRow label="Total losers" value={losers.total} />
          <StatRow label="Worst loss" value={losers.bestPercent} isPercent colorClass="text-loss" />
          <StatRow label="Average loss" value={losers.averagePercent} isPercent colorClass="text-loss" />
          <StatRow label="Average duration" value={formatDuration(losers.averageDuration)} />
          <StatRow label="Max consecutive losses" value={losers.maxConsecutive} />
          <StatRow label="Avg consecutive losses" value={losers.avgConsecutive} />
        </motion.div>
      </div>
    </div>
  );
}
