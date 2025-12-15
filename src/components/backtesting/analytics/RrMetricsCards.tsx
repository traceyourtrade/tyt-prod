'use client';

import { motion } from 'framer-motion';
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
        className="rounded-2xl p-4 overflow-hidden"
        style={{ 
          background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
          border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Average RR</span>
              <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
              {metrics.averageRR.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Max RR</span>
              <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
              {metrics.maxRR.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="h-12 flex items-end gap-1">
          {[0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.9, 0.5].map((h, i) => (
            <div 
              key={i}
              className="flex-1 rounded-t"
              style={{ 
                height: `${h * 100}%`,
                background: 'linear-gradient(to top, var(--af-accent-blue, #3b82f6), var(--af-accent-teal, #14b8a6))'
              }}
            />
          ))}
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Ideal Average RR</span>
              <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
              {metrics.idealAverageRR.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Max Ideal RR</span>
              <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
              {metrics.maxIdealRR.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="h-12 flex items-end gap-1">
          {[0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.8, 0.6].map((h, i) => (
            <div 
              key={i}
              className="flex-1 rounded-t"
              style={{ 
                height: `${h * 100}%`,
                background: 'linear-gradient(to top, var(--af-accent-teal, #14b8a6), #34d399)'
              }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-4 overflow-hidden"
        style={{ 
          background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
          border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
        }}
      >
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Could have profit/BE</span>
          <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
        </div>
        <span className="text-4xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
          {metrics.couldHaveProfitBE}
        </span>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Max Ideal RR</span>
        </div>
      </motion.div>
    </div>
  );
}
