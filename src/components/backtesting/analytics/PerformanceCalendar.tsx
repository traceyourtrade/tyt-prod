'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
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
      className="rounded-2xl p-5 overflow-hidden"
      style={{ 
        background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
        border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
          Performance calendar
        </h3>
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as 'dollar' | 'percent')}
            className="px-3 py-1.5 text-sm rounded-lg cursor-pointer"
            style={{ 
              backgroundColor: 'var(--af-bg-base, #0c0d10)',
              border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
              color: 'var(--af-text-primary, #f4f4f5)'
            }}
          >
            <option value="dollar">Dollar Profit</option>
            <option value="percent">Percent Gain</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded hover:bg-[var(--af-bg-hover,#1e222d)] transition-colors"
              style={{ color: 'var(--af-text-muted, #a1a1aa)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded hover:bg-[var(--af-bg-hover,#1e222d)] transition-colors"
              style={{ color: 'var(--af-text-muted, #a1a1aa)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevYear}
              className="p-1 rounded hover:bg-[var(--af-bg-hover,#1e222d)] transition-colors"
              style={{ color: 'var(--af-text-muted, #a1a1aa)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-sm font-medium min-w-[50px] text-center" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
              {year}
            </span>
            <button
              onClick={nextYear}
              className="p-1 rounded hover:bg-[var(--af-bg-hover,#1e222d)] transition-colors"
              style={{ color: 'var(--af-text-muted, #a1a1aa)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="balanceMode" 
              checked={balanceMode === 'initial'}
              onChange={() => setBalanceMode('initial')}
              className="w-3 h-3 accent-[#3b82f6]"
            />
            <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Initial Balance</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="balanceMode" 
              checked={balanceMode === 'current'}
              onChange={() => setBalanceMode('current')}
              className="w-3 h-3 accent-[#3b82f6]"
            />
            <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Current Balance</span>
          </label>
        </div>

        <div 
          className="flex rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))' }}
        >
          <button
            onClick={() => setViewMode('month')}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ 
              backgroundColor: viewMode === 'month' ? 'var(--af-bg-hover, #1e222d)' : 'transparent',
              color: viewMode === 'month' ? 'var(--af-text-primary, #f4f4f5)' : 'var(--af-text-disabled, #52525b)'
            }}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('year')}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ 
              backgroundColor: viewMode === 'year' ? 'var(--af-bg-hover, #1e222d)' : 'transparent',
              color: viewMode === 'year' ? 'var(--af-text-primary, #f4f4f5)' : 'var(--af-text-disabled, #52525b)'
            }}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(day => (
          <div 
            key={day} 
            className="text-center text-xs font-medium py-2"
            style={{ color: 'var(--af-text-disabled, #52525b)' }}
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
              className="min-h-[80px] rounded-lg p-2 transition-colors"
              style={{ 
                backgroundColor: hasData 
                  ? day.pnl >= 0 
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)'
                  : 'var(--af-bg-hover, #1e222d)',
                opacity: day.isCurrentMonth ? 1 : 0.4
              }}
            >
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: 'var(--af-text-disabled, #52525b)' }}
              >
                {day.day}
              </div>
              {hasData && (
                <>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: day.pnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)' }}
                  >
                    {day.pnl >= 0 ? '' : '-'}{displayValue}
                  </div>
                  <div 
                    className="text-[10px] mt-0.5"
                    style={{ color: 'var(--af-text-muted, #a1a1aa)' }}
                  >
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
