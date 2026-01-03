'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RrMetrics } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  metrics: RrMetrics;
}

export default function RrMetricsCards({ metrics }: Props) {
  const rrBars = useMemo(() => {
    const values = metrics.rrValues || [];
    if (values.length === 0) return [];
    const maxVal = Math.max(...values.map(Math.abs), 1);
    return values.map(v => Math.min(Math.abs(v) / maxVal, 1));
  }, [metrics.rrValues]);

  const idealRRBars = useMemo(() => {
    const values = metrics.idealRRValues || [];
    if (values.length === 0) return [];
    const maxVal = Math.max(...values, 1);
    return values.map(v => Math.min(v / maxVal, 1));
  }, [metrics.idealRRValues]);

  const rrColors = useMemo(() => {
    const values = metrics.rrValues || [];
    return values.map(v => v >= 0);
  }, [metrics.rrValues]);

  const hasRRData = rrBars.length > 0;
  const hasIdealRRData = idealRRBars.length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Average RR</p>
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {metrics.averageRR.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Max RR</p>
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {metrics.maxRR.toFixed(2)}
            </span>
          </div>
        </div>
        {hasRRData ? (
          <div className="h-12 flex items-end gap-1">
            {rrBars.map((h, i) => (
              <div 
                key={i}
                className={cn(
                  "flex-1 rounded-t bg-gradient-to-t",
                  rrColors[i] !== false ? "from-blue-500 to-teal-500" : "from-red-500 to-orange-400"
                )}
                style={{ height: `${Math.max(h * 100, 5)}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground">Complete trades with SL/TP to see data</p>
          </div>
        )}
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
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Ideal Average RR</p>
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {metrics.idealAverageRR.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Max Ideal RR</p>
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {metrics.maxIdealRR.toFixed(2)}
            </span>
          </div>
        </div>
        {hasIdealRRData ? (
          <div className="h-12 flex items-end gap-1">
            {idealRRBars.map((h, i) => (
              <div 
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-teal-500 to-emerald-400"
                style={{ height: `${Math.max(h * 100, 5)}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground">Complete trades with SL/TP to see data</p>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "rounded-2xl border p-3 sm:p-4 min-w-0 overflow-hidden",
          "bg-card border-border",
          "dark:bg-zinc-900/50 dark:border-white/[0.08]"
        )}
      >
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-2">Could have profit/BE</p>
        <span className="text-2xl sm:text-4xl font-bold text-foreground">
          {metrics.couldHaveProfitBE}
        </span>
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-2">Max Ideal RR</p>
      </motion.div>
    </div>
  );
}
