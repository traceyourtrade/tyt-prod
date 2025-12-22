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
const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

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
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] via-transparent to-teal-500/[0.02] pointer-events-none" />
      
      <div className="relative p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
              "border border-amber-500/20"
            )}>
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-white truncate">Performance by Month</h3>
              <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Monthly breakdown of your returns</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] self-start sm:self-auto">
            <button
              onClick={() => setCalcMode('accumulated')}
              className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all duration-200",
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
                "px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all duration-200",
                calcMode === 'overall'
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
            >
              Cumulative
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="min-w-[320px] sm:min-w-[700px]">
            <div className="grid gap-0.5 sm:gap-1.5 mb-1.5 sm:mb-2" style={{ gridTemplateColumns: 'minmax(32px, 40px) repeat(12, minmax(22px, 1fr)) minmax(32px, 50px)' }}>
              <div />
              {MONTHS.map((month, idx) => (
                <div key={month} className="text-center text-[9px] sm:text-xs font-medium text-zinc-500">
                  <span className="hidden sm:inline">{month}</span>
                  <span className="sm:hidden">{MONTHS_SHORT[idx]}</span>
                </div>
              ))}
              <div className="text-center text-[9px] sm:text-xs font-medium text-zinc-400">YTD</div>
            </div>
            
            {years.map(year => (
              <div key={year} className="grid gap-0.5 sm:gap-1.5 mb-1 sm:mb-1.5" style={{ gridTemplateColumns: 'minmax(32px, 40px) repeat(12, minmax(22px, 1fr)) minmax(32px, 50px)' }}>
                <div className="flex items-center text-[10px] sm:text-sm font-semibold text-zinc-300">
                  {year}
                </div>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthData = getMonthValue(year, i);
                  const value = monthData 
                    ? (calcMode === 'accumulated' ? monthData.gainPercent : monthData.overallGainPercent)
                    : null;
                  
                  return (
                    <div key={i} className="aspect-[1.5/1] sm:aspect-[2/1] min-h-[24px] sm:min-h-[36px]">
                      {value !== null ? (
                        <div className={cn(
                          "h-full rounded sm:rounded-lg flex items-center justify-center text-[8px] sm:text-xs font-semibold transition-all duration-200",
                          value >= 0 
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                            : "bg-red-500/15 text-red-400 border border-red-500/20"
                        )}>
                          <span className="hidden sm:inline">{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span>
                          <span className="sm:hidden">{value >= 0 ? '+' : ''}{value.toFixed(1)}%</span>
                        </div>
                      ) : (
                        <div className="h-full rounded sm:rounded-lg flex items-center justify-center text-[8px] sm:text-xs text-zinc-600 bg-white/[0.02] border border-white/[0.04]">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="aspect-[1.5/1] sm:aspect-[2/1] min-h-[24px] sm:min-h-[36px]">
                  <div className={cn(
                    "h-full rounded sm:rounded-lg flex items-center justify-center text-[8px] sm:text-xs font-bold transition-all duration-200",
                    getYTDValue(year) >= 0 
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                  )}>
                    <span className="hidden sm:inline">{getYTDValue(year) >= 0 ? '+' : ''}{getYTDValue(year).toFixed(2)}%</span>
                    <span className="sm:hidden">{getYTDValue(year) >= 0 ? '+' : ''}{getYTDValue(year).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/[0.06]">
          <span className="text-xs sm:text-sm text-zinc-400">Total Return</span>
          <div className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl",
            totalValue >= 0 
              ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30" 
              : "bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30"
          )}>
            {totalValue >= 0 ? (
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
            )}
            <span className={cn(
              "text-sm sm:text-lg font-bold",
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
