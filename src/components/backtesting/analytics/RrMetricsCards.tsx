'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RrMetrics } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  metrics: RrMetrics;
}

export default function RrMetricsCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Average RR</p>
            <span className="text-2xl font-bold text-foreground">
              {metrics.averageRR.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Max RR</p>
            <span className="text-2xl font-bold text-foreground">
              {metrics.maxRR.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="h-12 flex items-end gap-1">
          {[0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.9, 0.5].map((h, i) => (
            <div 
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-blue-500 to-teal-500"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ideal Average RR</p>
            <span className="text-2xl font-bold text-foreground">
              {metrics.idealAverageRR.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Max Ideal RR</p>
            <span className="text-2xl font-bold text-foreground">
              {metrics.maxIdealRR.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="h-12 flex items-end gap-1">
          {[0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.8, 0.6].map((h, i) => (
            <div 
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-teal-500 to-emerald-400"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "rounded-2xl border p-4 min-w-0 overflow-hidden",
          "bg-card border-border",
          "dark:bg-zinc-900/50 dark:border-white/[0.08]"
        )}
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Could have profit/BE</p>
        <span className="text-4xl font-bold text-foreground">
          {metrics.couldHaveProfitBE}
        </span>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Max Ideal RR</p>
      </motion.div>
    </div>
  );
}
