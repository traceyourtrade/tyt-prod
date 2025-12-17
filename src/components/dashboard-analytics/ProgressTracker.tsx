'use client';

import React, { useMemo, useState } from "react";
import { Activity, Info, ChevronLeft, ChevronRight } from "lucide-react";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";
import { cn } from "@/lib/utils";

interface TradeData {
  date: string;
  Profit: number;
  [key: string]: unknown;
}

interface ProgressTrackerProps {
  trades: TradeData[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ trades }) => {
  const { currency, exchangeRate } = useCurrencyStore();
  const [hoveredDay, setHoveredDay] = useState<{ date: string; trades: number; pnl: number; x: number; y: number } | null>(null);
  
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const tradesByDate = useMemo(() => {
    const map: { [key: string]: { count: number; pnl: number } } = {};
    trades.forEach(trade => {
      const date = new Date(trade.date).toISOString().split('T')[0];
      if (!map[date]) {
        map[date] = { count: 0, pnl: 0 };
      }
      map[date].count++;
      map[date].pnl += trade.Profit || 0;
    });
    return map;
  }, [trades]);

  const weeks = useMemo(() => {
    const result: { date: Date; dateStr: string }[][] = [];
    const startDate = new Date(viewYear, 0, 1);
    const endDate = new Date(viewYear, 11, 31);
    
    const firstSunday = new Date(startDate);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());
    
    let currentDate = new Date(firstSunday);
    let currentWeek: { date: Date; dateStr: string }[] = [];
    
    while (currentDate <= endDate || currentWeek.length > 0) {
      currentWeek.push({
        date: new Date(currentDate),
        dateStr: currentDate.toISOString().split('T')[0],
      });
      
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      
      if (currentDate > endDate && currentWeek.length === 0) break;
    }
    
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    
    return result;
  }, [viewYear]);

  const getColorIntensity = (dateStr: string) => {
    const data = tradesByDate[dateStr];
    if (!data) return 'bg-muted/30';
    
    if (data.pnl > 0) {
      if (data.pnl > 500) return 'bg-emerald-500';
      if (data.pnl > 200) return 'bg-emerald-500/70';
      if (data.pnl > 50) return 'bg-emerald-500/50';
      return 'bg-emerald-500/30';
    } else if (data.pnl < 0) {
      if (data.pnl < -500) return 'bg-red-500';
      if (data.pnl < -200) return 'bg-red-500/70';
      if (data.pnl < -50) return 'bg-red-500/50';
      return 'bg-red-500/30';
    }
    return 'bg-muted/50';
  };

  const handleMouseEnter = (e: React.MouseEvent, dateStr: string) => {
    const data = tradesByDate[dateStr];
    if (data) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredDay({
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        trades: data.count,
        pnl: data.pnl,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  };

  const totalTradingDays = Object.keys(tradesByDate).filter(d => d.startsWith(viewYear.toString())).length;
  const profitDays = Object.entries(tradesByDate).filter(([d, v]) => d.startsWith(viewYear.toString()) && v.pnl > 0).length;

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Progress Tracker</h3>
            <p className="text-xs text-muted-foreground">{profitDays}/{totalTradingDays} profitable days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewYear(y => y - 1)}
            className="p-1 rounded hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground font-medium min-w-[40px] text-center">{viewYear}</span>
          <button
            onClick={() => setViewYear(y => y + 1)}
            disabled={viewYear >= now.getFullYear()}
            className="p-1 rounded hover:bg-muted/50 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <div className="flex flex-col gap-1 mr-1">
            {days.filter((_, i) => i % 2 === 1).map(day => (
              <div key={day} className="h-[11px] text-[9px] text-muted-foreground leading-[11px]">
                {day}
              </div>
            ))}
          </div>
          
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) => {
                  const isCurrentYear = day.date.getFullYear() === viewYear;
                  const isFuture = day.date > now;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "w-[11px] h-[11px] rounded-sm transition-all cursor-pointer",
                        isCurrentYear && !isFuture ? getColorIntensity(day.dateStr) : 'bg-transparent',
                        isCurrentYear && !isFuture && "hover:ring-1 hover:ring-foreground/20"
                      )}
                      onMouseEnter={(e) => isCurrentYear && !isFuture && handleMouseEnter(e, day.dateStr)}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-[11px] h-[11px] rounded-sm bg-red-500" />
              <div className="w-[11px] h-[11px] rounded-sm bg-red-500/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-muted/30" />
              <div className="w-[11px] h-[11px] rounded-sm bg-emerald-500/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
          <a href="#" className="text-[10px] text-blue-500 hover:underline">View more</a>
        </div>
      </div>

      {hoveredDay && (
        <div 
          className="fixed z-50 bg-card border border-border rounded-lg shadow-xl px-3 py-2 pointer-events-none"
          style={{
            left: hoveredDay.x,
            top: hoveredDay.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-[10px] text-muted-foreground">{hoveredDay.date}</p>
          <p className="text-xs font-medium">{hoveredDay.trades} trades</p>
          <p className={cn(
            "text-xs font-bold",
            hoveredDay.pnl >= 0 ? "text-profit" : "text-loss"
          )}>
            {formatCompactCurrency(hoveredDay.pnl, currency, exchangeRate)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
