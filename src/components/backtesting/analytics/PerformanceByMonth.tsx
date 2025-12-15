'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MonthPerformance } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  data: MonthPerformance[];
  initialBalance: number;
}

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'YTD'];

export default function PerformanceByMonth({ data, initialBalance }: Props) {
  const [calcMode, setCalcMode] = useState<'accumulated' | 'overall'>('accumulated');
  const [balanceMode, setBalanceMode] = useState<'initial' | 'current'>('initial');

  const years = [...new Set(data.map(d => d.year))].sort();
  if (years.length === 0) years.push(new Date().getFullYear());

  const getMonthValue = (year: number, month: number): MonthPerformance | undefined => {
    return data.find(d => d.year === year && d.month === month);
  };

  const getYTDValue = (year: number): number => {
    const yearData = data.filter(d => d.year === year);
    if (yearData.length === 0) return 0;
    return yearData[yearData.length - 1].overallGainPercent;
  };

  const getTotalValue = (): number => {
    if (data.length === 0) return 0;
    return data[data.length - 1].overallGainPercent;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-4 sm:p-5 min-w-0 overflow-hidden",
        "bg-card border-border",
        "dark:bg-zinc-900/50 dark:border-white/[0.08]"
      )}
    >
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
        Performance by month
      </h3>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="calcMode" 
              checked={calcMode === 'accumulated'}
              onChange={() => setCalcMode('accumulated')}
              className="w-3 h-3 accent-blue-500"
            />
            <span className="text-xs text-muted-foreground">Accum. Gains %</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="calcMode" 
              checked={calcMode === 'overall'}
              onChange={() => setCalcMode('overall')}
              className="w-3 h-3 accent-blue-500"
            />
            <span className="text-xs text-muted-foreground">Overall Gain %</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="balanceMode" 
              checked={balanceMode === 'initial'}
              onChange={() => setBalanceMode('initial')}
              className="w-3 h-3 accent-blue-500"
            />
            <span className="text-xs text-muted-foreground">Initial Balance</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="balanceMode" 
              checked={balanceMode === 'current'}
              onChange={() => setBalanceMode('current')}
              className="w-3 h-3 accent-blue-500"
            />
            <span className="text-xs text-muted-foreground">Current Balance</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              <th className="p-1 sm:p-2 text-left text-[10px] sm:text-xs font-medium text-muted-foreground"></th>
              {MONTHS.slice(1).map(month => (
                <th key={month} className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-medium text-muted-foreground">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map(year => (
              <tr key={year}>
                <td className="p-2 text-sm font-medium text-foreground">
                  {year}
                </td>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthData = getMonthValue(year, i);
                  const value = monthData 
                    ? (calcMode === 'accumulated' ? monthData.gainPercent : monthData.overallGainPercent)
                    : null;
                  
                  return (
                    <td key={i} className="p-1">
                      {value !== null ? (
                        <div className={cn(
                          "px-2 py-1.5 rounded text-xs font-medium text-center",
                          value >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
                        )}>
                          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                        </div>
                      ) : (
                        <div className="px-2 py-1.5 rounded text-xs text-center bg-muted text-muted-foreground">
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="p-1">
                  <div className={cn(
                    "px-2 py-1.5 rounded text-xs font-medium text-center",
                    getYTDValue(year) >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
                  )}>
                    {getYTDValue(year) >= 0 ? '+' : ''}{getYTDValue(year).toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4 gap-2">
        <div className="px-3 py-1.5 rounded text-sm bg-muted text-muted-foreground">
          Total
        </div>
        <div className={cn(
          "px-3 py-1.5 rounded text-sm font-medium",
          getTotalValue() >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
        )}>
          {getTotalValue() >= 0 ? '+' : ''}{getTotalValue().toFixed(2)}%
        </div>
      </div>
    </motion.div>
  );
}
