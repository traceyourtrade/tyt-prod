'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthPerformance } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  data: MonthPerformance[];
  initialBalance: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PerformanceByMonth({ data, initialBalance }: Props) {
  const [calcMode, setCalcMode] = useState<'accumulated' | 'overall'>('accumulated');

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

  const totalValue = getTotalValue();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/40",
        "border border-white/[0.08]",
        "backdrop-blur-xl"
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] via-transparent to-teal-500/[0.02] pointer-events-none" />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
              "border border-amber-500/20"
            )}>
              <CalendarDays className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Performance by Month</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Monthly breakdown of your returns</p>
            </div>
          </div>
          
          {/* Toggle buttons */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button
              onClick={() => setCalcMode('accumulated')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                calcMode === 'accumulated'
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
            >
              Monthly Gains
            </button>
            <button
              onClick={() => setCalcMode('overall')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                calcMode === 'overall'
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
            >
              Cumulative
            </button>
          </div>
        </div>

        {/* Month grid */}
        <div className="overflow-x-auto -mx-5 px-5">
          <div className="min-w-[700px]">
            {/* Header row */}
            <div className="grid grid-cols-14 gap-1.5 mb-2">
              <div className="col-span-1" />
              {MONTHS.map(month => (
                <div key={month} className="text-center text-xs font-medium text-zinc-500">
                  {month}
                </div>
              ))}
              <div className="text-center text-xs font-medium text-zinc-400">YTD</div>
            </div>
            
            {/* Year rows */}
            {years.map(year => (
              <div key={year} className="grid grid-cols-14 gap-1.5 mb-1.5">
                <div className="flex items-center text-sm font-semibold text-zinc-300">
                  {year}
                </div>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthData = getMonthValue(year, i);
                  const value = monthData 
                    ? (calcMode === 'accumulated' ? monthData.gainPercent : monthData.overallGainPercent)
                    : null;
                  
                  return (
                    <div key={i} className="aspect-[2/1] min-h-[36px]">
                      {value !== null ? (
                        <div className={cn(
                          "h-full rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-200",
                          value >= 0 
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25" 
                            : "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
                        )}>
                          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                        </div>
                      ) : (
                        <div className="h-full rounded-lg flex items-center justify-center text-xs text-zinc-600 bg-white/[0.02] border border-white/[0.04]">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="aspect-[2/1] min-h-[36px]">
                  <div className={cn(
                    "h-full rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200",
                    getYTDValue(year) >= 0 
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                  )}>
                    {getYTDValue(year) >= 0 ? '+' : ''}{getYTDValue(year).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total summary */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-white/[0.06]">
          <span className="text-sm text-zinc-400">Total Return</span>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl",
            totalValue >= 0 
              ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30" 
              : "bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30"
          )}>
            {totalValue >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={cn(
              "text-lg font-bold",
              totalValue >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {totalValue >= 0 ? '+' : ''}{totalValue.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
