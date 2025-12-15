'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [balanceMode, setBalanceMode] = useState<'initial' | 'current'>('initial');
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const result: CalendarDay[] = [];
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDay);

    const closedTrades = trades.filter(t => t.status === 'closed');

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTrades = closedTrades.filter(t => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-5 min-w-0 overflow-hidden",
        "bg-card border-border",
        "dark:bg-zinc-900/50 dark:border-white/[0.08]"
      )}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Performance calendar
      </h3>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <select
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value as 'dollar' | 'percent')}
          className={cn(
            "px-3 py-1.5 text-sm rounded-lg cursor-pointer",
            "bg-background border border-border text-foreground",
            "dark:bg-zinc-900 dark:border-white/[0.08]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          )}
        >
          <option value="dollar">Dollar Profit</option>
          <option value="percent">Percent Gain</option>
        </select>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[100px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevYear}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[50px] text-center">
              {year}
            </span>
            <button
              onClick={nextYear}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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

        <div className="flex rounded-lg overflow-hidden border border-border dark:border-white/[0.08]">
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === 'month' 
                ? "bg-muted text-foreground" 
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === 'year' 
                ? "bg-muted text-foreground" 
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(day => (
          <div 
            key={day} 
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((day, i) => {
          const hasData = day.trades > 0;
          const displayValue = displayMode === 'dollar' 
            ? `$${Math.abs(day.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `${((day.pnl / initialBalance) * 100).toFixed(2)}%`;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[80px] rounded-lg p-2 transition-colors",
                hasData 
                  ? day.pnl >= 0 
                    ? "bg-profit/15"
                    : "bg-loss/15"
                  : "bg-muted",
                !day.isCurrentMonth && "opacity-40"
              )}
            >
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {day.day}
              </div>
              {hasData && (
                <>
                  <div className={cn(
                    "text-sm font-semibold",
                    day.pnl >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {day.pnl >= 0 ? '' : '-'}{displayValue}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {day.trades} trade{day.trades !== 1 ? 's' : ''}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
