'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '@/hooks/backtesting/useBacktestAnalytics';
import type { Trade } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  trades: Trade[];
  initialBalance: number;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PerformanceCalendar({ trades, initialBalance }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<'dollar' | 'percent'>('dollar');

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const result: CalendarDay[] = [];
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDay);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTrades = trades.filter(t => {
        const tradeDate = new Date(t.closedAt || t.openedAt);
        return tradeDate.toISOString().split('T')[0] === dateStr;
      });

      result.push({
        date: dateStr,
        day: date.getDate(),
        pnl: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        trades: dayTrades.length,
        isCurrentMonth: date.getMonth() === month
      });
    }

    return result;
  }, [currentDate, trades]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  };

  const nextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Calculate month summary
  const monthlyPnl = calendarData
    .filter(d => d.isCurrentMonth && d.trades > 0)
    .reduce((sum, d) => sum + d.pnl, 0);
  const monthlyTrades = calendarData
    .filter(d => d.isCurrentMonth)
    .reduce((sum, d) => sum + d.trades, 0);

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
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10",
              "border border-cyan-500/20"
            )}>
              <CalendarCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Performance Calendar</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {monthlyTrades} trades · <span className={monthlyPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {monthlyPnl >= 0 ? '+' : ''}${monthlyPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>
          
          {/* Display mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button
              onClick={() => setDisplayMode('dollar')}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200",
                displayMode === 'dollar'
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
            >
              $
            </button>
            <button
              onClick={() => setDisplayMode('percent')}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200",
                displayMode === 'percent'
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
            >
              %
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-white min-w-[90px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevYear}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-white min-w-[50px] text-center">
              {year}
            </span>
            <button
              onClick={nextYear}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-zinc-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarData.map((day, i) => {
            const hasTrades = day.trades > 0;
            const value = displayMode === 'dollar' 
              ? day.pnl
              : (day.pnl / initialBalance) * 100;
            
            return (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200",
                  day.isCurrentMonth 
                    ? hasTrades
                      ? day.pnl >= 0
                        ? "bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
                      : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]"
                    : "bg-transparent opacity-30"
                )}
              >
                <span className={cn(
                  "text-xs font-medium",
                  day.isCurrentMonth 
                    ? hasTrades
                      ? "text-white"
                      : "text-zinc-500"
                    : "text-zinc-600"
                )}>
                  {day.day}
                </span>
                {hasTrades && day.isCurrentMonth && (
                  <span className={cn(
                    "text-[10px] font-semibold mt-0.5",
                    day.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {displayMode === 'dollar' 
                      ? `${value >= 0 ? '+' : ''}$${Math.abs(value).toFixed(0)}`
                      : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
                    }
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
