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

  const renderMonthCell = (year: number, monthIndex: number) => {
    const monthData = getMonthValue(year, monthIndex);
    const value = monthData 
      ? (calcMode === 'accumulated' ? monthData.gainPercent : monthData.overallGainPercent)
      : null;
    
    return (
      <div key={monthIndex} className="min-h-[28px] sm:min-h-[36px]">
        {value !== null ? (
          <div className={cn(
            "h-full rounded-md sm:rounded-lg flex items-center justify-center text-[9px] sm:text-xs font-semibold transition-all duration-200 px-1",
            value >= 0 
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
              : "bg-red-500/15 text-red-400 border border-red-500/20"
          )}>
            {value >= 0 ? '+' : ''}{value.toFixed(1)}%
          </div>
        ) : (
          <div className="h-full rounded-md sm:rounded-lg flex items-center justify-center text-[9px] sm:text-xs text-zinc-600 bg-white/[0.02] border border-white/[0.04]">
            —
          </div>
        )}
      </div>
    );
  };

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
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.01] via-transparent to-teal-500/[0.01] dark:from-amber-500/[0.02] dark:to-teal-500/[0.02] pointer-events-none" />
      
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
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">Performance by Month</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Monthly breakdown of your returns</p>
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

        {/* Mobile Layout - 2 rows of 6 months */}
        <div className="sm:hidden space-y-3">
          {years.map(year => (
            <div key={year} className="space-y-2">
              <div className="text-[11px] font-semibold text-zinc-300">{year}</div>
              
              {/* Row 1: Jan-Jun */}
              <div className="grid grid-cols-6 gap-1">
                {MONTHS.slice(0, 6).map((month, idx) => (
                  <div key={month} className="text-center text-[9px] font-medium text-zinc-500">{month}</div>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 6 }, (_, i) => renderMonthCell(year, i))}
              </div>
              
              {/* Row 2: Jul-Dec */}
              <div className="grid grid-cols-6 gap-1 mt-2">
                {MONTHS.slice(6, 12).map((month, idx) => (
                  <div key={month} className="text-center text-[9px] font-medium text-zinc-500">{month}</div>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 6 }, (_, i) => renderMonthCell(year, i + 6))}
              </div>
              
              {/* YTD */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] text-zinc-400">Year to Date</span>
                <div className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold",
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

        {/* Desktop Layout - Single row */}
        <div className="hidden sm:block overflow-x-auto -mx-5 px-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="min-w-[700px]">
            <div className="grid gap-1.5 mb-2" style={{ gridTemplateColumns: 'minmax(40px, 50px) repeat(12, 1fr) minmax(50px, 60px)' }}>
              <div />
              {MONTHS.map((month) => (
                <div key={month} className="text-center text-xs font-medium text-zinc-500">
                  {month}
                </div>
              ))}
              <div className="text-center text-xs font-medium text-zinc-400">YTD</div>
            </div>
            
            {years.map(year => (
              <div key={year} className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: 'minmax(40px, 50px) repeat(12, 1fr) minmax(50px, 60px)' }}>
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
