'use client';

import React, { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, ArrowRightLeft, TrendingUp, TrendingDown, Target, Flame, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

import DashWidgets from "../dashboard-widgets/DashboardWidget";
import PnLDailyChart from "./Graphs/PnLDailyChart";
import TradesWidget from "../TradesWidget";

import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts';
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";
import { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance } from '@/utils/dashboard-calculations/dashboardCalculations';

interface TradeData {
  date: string;
  Profit: number;
  time?: string;
  Item?: string;
  Type?: string;
  [key: string]: unknown;
}

interface Account {
  tradeData?: TradeData[];
}

interface ProcessedData {
  time: string;
  value: number;
}

const DashboardCustom: React.FC = () => {
  const { selectedAccounts } = useModeFilteredAccounts();
  const { currency, exchangeRate } = useCurrencyStore();

  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [leftYear, setLeftYear] = useState<number>(new Date().getFullYear());
  const [leftMonth, setLeftMonth] = useState<number>(new Date().getMonth() - 1 < 0 ? 11 : new Date().getMonth() - 1);
  const [rightYear, setRightYear] = useState<number>(new Date().getFullYear());
  const [rightMonth, setRightMonth] = useState<number>(new Date().getMonth());

  const calendarRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allTrades = useMemo(() => {
    const trades = (selectedAccounts as Account[]).flatMap(account => account.tradeData || []);
    return trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedAccounts]);

  const displayTrades = useMemo(() => {
    if (!startDate || !endDate) return allTrades;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return allTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= start && tradeDate <= end;
    });
  }, [startDate, endDate, allTrades]);

  const processedData = useMemo(() => {
    let cumulativeProfit = 0;
    const profitByDate: { [key: string]: number } = {};
    displayTrades.forEach(trade => {
      profitByDate[trade.date] = (profitByDate[trade.date] || 0) + (trade.Profit || 0);
    });
    const result: ProcessedData[] = [{ time: "", value: 0 }];
    Object.entries(profitByDate)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(([date, profit]) => {
        cumulativeProfit += profit;
        result.push({ time: date, value: parseFloat(cumulativeProfit.toFixed(2)) });
      });
    return result;
  }, [displayTrades]);

  const totalPnL = displayTrades.reduce((sum, t) => sum + (t.Profit || 0), 0);
  const winCount = displayTrades.filter(t => t.Profit > 0).length;
  const lossCount = displayTrades.filter(t => t.Profit < 0).length;
  const winrate = displayTrades.length > 0 ? (winCount / displayTrades.length) * 100 : 0;
  const metrics = calculateRiskRewardRatio(displayTrades);

  const bestTrade = displayTrades.length > 0 ? Math.max(...displayTrades.map(t => t.Profit)) : 0;
  const worstTrade = displayTrades.length > 0 ? Math.min(...displayTrades.map(t => t.Profit)) : 0;

  const tradingDays = useMemo(() => {
    const uniqueDates = new Set(displayTrades.map(t => t.date));
    return uniqueDates.size;
  }, [displayTrades]);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const generateCalendarDays = (year: number, month: number): (number | null)[] => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    const clickedDate = new Date(year, month, day);
    if (clickedDate > today) return;

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(clickedDate);
      setTempEnd(null);
      setHoverDate(null);
    } else if (tempStart && !tempEnd) {
      if (clickedDate < tempStart) {
        setTempEnd(tempStart);
        setTempStart(clickedDate);
      } else {
        setTempEnd(clickedDate);
      }
    }
  };

  const isInRange = (day: number, month: number, year: number): boolean => {
    if (!tempStart) return false;
    const date = new Date(year, month, day);
    if (tempEnd) {
      return date > tempStart && date < tempEnd;
    }
    if (hoverDate && hoverDate > tempStart) {
      return date > tempStart && date <= hoverDate;
    }
    return false;
  };

  const isSelectedDate = (day: number, month: number, year: number): boolean => {
    const date = new Date(year, month, day);
    return (tempStart && date.getTime() === tempStart.getTime()) ||
           (tempEnd && date.getTime() === tempEnd.getTime()) || false;
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      setStartDate(tempStart);
      setEndDate(tempEnd);
      setShowCalendar(false);
    }
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    setStartDate(null);
    setEndDate(null);
    setShowCalendar(false);
  };

  const handlePrevMonth = (side: 'left' | 'right') => {
    if (side === 'left') {
      if (leftMonth === 0) {
        setLeftMonth(11);
        setLeftYear(y => y - 1);
      } else {
        setLeftMonth(m => m - 1);
      }
    } else {
      if (rightMonth === 0) {
        setRightMonth(11);
        setRightYear(y => y - 1);
      } else {
        setRightMonth(m => m - 1);
      }
    }
  };

  const handleNextMonth = (side: 'left' | 'right') => {
    if (side === 'left') {
      if (leftMonth === 11) {
        setLeftMonth(0);
        setLeftYear(y => y + 1);
      } else {
        setLeftMonth(m => m + 1);
      }
    } else {
      if (rightMonth === 11) {
        setRightMonth(0);
        setRightYear(y => y + 1);
      } else {
        setRightMonth(m => m + 1);
      }
    }
  };

  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return "Select";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderCalendarGrid = (year: number, month: number) => {
    const days = generateCalendarDays(year, month);
    return (
      <>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="h-6 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="h-7" />;
            }
            const dateObj = new Date(year, month, day);
            const isFuture = dateObj > today;
            const isRangeStart = tempStart && dateObj.getTime() === tempStart.getTime();
            const isRangeEnd = tempEnd && dateObj.getTime() === tempEnd.getTime();
            const inRange = isInRange(day, month, year);

            return (
              <button
                key={day}
                disabled={isFuture}
                onClick={() => handleDateClick(day, month, year)}
                onMouseEnter={() => {
                  if (tempStart && !tempEnd) {
                    setHoverDate(new Date(year, month, day));
                  }
                }}
                className={cn(
                  "h-7 w-7 rounded text-xs font-medium flex items-center justify-center transition-all",
                  isFuture && "text-muted-foreground/40 cursor-not-allowed",
                  !isFuture && !isRangeStart && !isRangeEnd && !inRange && "hover:bg-muted text-foreground",
                  isRangeStart && "bg-primary text-primary-foreground rounded-l-lg",
                  isRangeEnd && "bg-primary text-primary-foreground rounded-r-lg",
                  inRange && "bg-primary/20 text-foreground"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const dashWidgetProps = {
    data: processedData,
    pnl: parseFloat(totalPnL.toFixed(2)),
    winrate: parseFloat(winrate.toFixed(2)),
    winners: winCount,
    losers: lossCount,
    profitF: calculateProfitFactor(displayTrades),
    avgProfits: parseFloat(metrics.avgWin),
    avgLoses: parseFloat(metrics.avgLoss),
    rrRatio: metrics.rrRatio,
    accBal: parseFloat(calculateBalance(selectedAccounts).toFixed(2)),
    totalProfits: displayTrades.reduce((sum, trade) => trade.Profit > 0 ? sum + trade.Profit : sum, 0),
    totalLoses: displayTrades.reduce((sum, trade) => trade.Profit < 0 ? sum + trade.Profit : sum, 0),
  };

  return (
    <div className="space-y-4">
      <DashWidgets {...dashWidgetProps} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-4">
          {/* Date Range Picker Header */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 overflow-visible relative z-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Custom Date Range</h2>
                  <p className="text-sm text-muted-foreground">
                    {startDate && endDate
                      ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`
                      : "Select a date range to analyze"}
                  </p>
                </div>
              </div>

              <div className="relative" ref={calendarRef}>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-colors text-sm"
                >
                  <span className="font-medium text-foreground">
                    {formatDateDisplay(startDate)}
                  </span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {formatDateDisplay(endDate)}
                  </span>
                </button>

                <AnimatePresence>
                  {showCalendar && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl p-4 shadow-xl"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Left Calendar */}
                        <div className="min-w-[220px]">
                          <div className="flex items-center justify-between mb-3">
                            <button
                              onClick={() => handlePrevMonth('left')}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <span className="text-xs font-semibold text-foreground">
                              {monthNames[leftMonth]} {leftYear}
                            </span>
                            <button
                              onClick={() => handleNextMonth('left')}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                          {renderCalendarGrid(leftYear, leftMonth)}
                        </div>

                        <div className="hidden sm:block w-px bg-border" />

                        {/* Right Calendar */}
                        <div className="min-w-[220px]">
                          <div className="flex items-center justify-between mb-3">
                            <button
                              onClick={() => handlePrevMonth('right')}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <span className="text-xs font-semibold text-foreground">
                              {monthNames[rightMonth]} {rightYear}
                            </span>
                            <button
                              onClick={() => handleNextMonth('right')}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                          {renderCalendarGrid(rightYear, rightMonth)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-3 border-t border-border gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-1 rounded bg-muted text-foreground font-medium">
                            {formatDateDisplay(tempStart)}
                          </span>
                          <span>to</span>
                          <span className="px-2 py-1 rounded bg-muted text-foreground font-medium">
                            {formatDateDisplay(tempEnd)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleClear}
                            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleApply}
                            disabled={!tempStart || !tempEnd}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Cumulative P&L Chart */}
          <PnLDailyChart data={processedData} />

          {/* Insight Tiles - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded-lg bg-profit/10">
                  <TrendingUp className="w-3 h-3 text-profit" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Avg Win</span>
              </div>
              <p className="text-sm font-bold text-profit">
                {formatCompactCurrency(parseFloat(metrics.avgWin) || 0, currency, exchangeRate)}
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded-lg bg-loss/10">
                  <TrendingDown className="w-3 h-3 text-loss" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Avg Loss</span>
              </div>
              <p className="text-sm font-bold text-loss">
                {formatCompactCurrency(Math.abs(parseFloat(metrics.avgLoss)) || 0, currency, exchangeRate)}
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded-lg bg-profit/10">
                  <Target className="w-3 h-3 text-profit" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Best</span>
              </div>
              <p className={cn("text-sm font-bold", bestTrade >= 0 ? "text-profit" : "text-loss")}>
                {formatCompactCurrency(bestTrade, currency, exchangeRate)}
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded-lg bg-loss/10">
                  <Target className="w-3 h-3 text-loss" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Worst</span>
              </div>
              <p className={cn("text-sm font-bold", worstTrade >= 0 ? "text-profit" : "text-loss")}>
                {formatCompactCurrency(worstTrade, currency, exchangeRate)}
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded-lg bg-primary/10">
                  <BarChart3 className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Days</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {tradingDays}
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1 rounded-lg", totalPnL >= 0 ? "bg-profit/10" : "bg-loss/10")}>
                  <Flame className={cn("w-3 h-3", totalPnL >= 0 ? "text-profit" : "text-loss")} />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Trades</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {displayTrades.length}
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <TradesWidget data={displayTrades} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCustom;
