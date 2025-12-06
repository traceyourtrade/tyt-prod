'use client';

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, ArrowRightLeft, X, TrendingUp, BarChart3, Trophy, Target } from "lucide-react";

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

interface Trade {
  date: string;
  Profit: number;
  time?: string;
  Item?: string;
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
    if (!date) return "Select date";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderCalendarGrid = (year: number, month: number) => {
    const days = generateCalendarDays(year, month);
    return (
      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-9" />;
          }
          const date = new Date(year, month, day);
          const isDisabled = date > today;
          const isSelected = isSelectedDate(day, month, year);
          const inRange = isInRange(day, month, year);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <motion.button
              key={day}
              whileHover={{ scale: isDisabled ? 1 : 1.1 }}
              whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              onClick={() => !isDisabled && handleDateClick(day, month, year)}
              onMouseEnter={() => {
                if (tempStart && !tempEnd && !isDisabled) {
                  setHoverDate(date);
                }
              }}
              disabled={isDisabled}
              className={`h-9 w-full rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                isDisabled
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : isSelected
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : inRange
                      ? "bg-primary/20 text-primary"
                      : isToday
                        ? "ring-1 ring-primary text-foreground"
                        : "text-foreground hover:bg-muted"
              }`}
            >
              {day}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="px-4 pt-4 pb-2">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">Custom Date Range</h2>
                <p className="text-sm text-muted-foreground">
                  {startDate && endDate
                    ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`
                    : "Select a date range to analyze"}
                </p>
              </div>
            </div>

            <div className="relative" ref={calendarRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {formatDateDisplay(startDate)}
                </span>
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {formatDateDisplay(endDate)}
                </span>
              </motion.button>

              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl p-5 shadow-xl"
                  >
                    <div className="flex gap-6">
                      <div className="min-w-[260px]">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => handlePrevMonth('left')}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <span className="text-sm font-semibold text-foreground">
                            {monthNames[leftMonth]} {leftYear}
                          </span>
                          <button
                            onClick={() => handleNextMonth('left')}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        {renderCalendarGrid(leftYear, leftMonth)}
                      </div>

                      <div className="w-px bg-border" />

                      <div className="min-w-[260px]">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => handlePrevMonth('right')}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <span className="text-sm font-semibold text-foreground">
                            {monthNames[rightMonth]} {rightYear}
                          </span>
                          <button
                            onClick={() => handleNextMonth('right')}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        {renderCalendarGrid(rightYear, rightMonth)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                          className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleApply}
                          disabled={!tempStart || !tempEnd}
                          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Apply
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <DashWidgets
        data={processedData}
        pnl={parseFloat(totalPnL.toFixed(2))}
        winrate={parseFloat(winrate.toFixed(2))}
        winners={winCount}
        losers={lossCount}
        profitF={calculateProfitFactor(displayTrades)}
        avgProfits={parseFloat(metrics.avgWin)}
        avgLoses={parseFloat(metrics.avgLoss)}
        rrRatio={metrics.rrRatio}
        accBal={parseFloat(calculateBalance(selectedAccounts).toFixed(2))}
        totalProfits={0}
        totalLoses={0}
      />

      <div className="px-4 pb-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Total Trades</span>
                </div>
                <p className="text-xl font-bold text-foreground">{displayTrades.length}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${totalPnL >= 0 ? "bg-profit/10" : "bg-loss/10"}`}>
                    <TrendingUp className={`w-3.5 h-3.5 ${totalPnL >= 0 ? "text-profit" : "text-loss"}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Net P&L</span>
                </div>
                <p className={`text-xl font-bold ${totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                  {formatCompactCurrency(totalPnL, currency, exchangeRate)}
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-profit/10 flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5 text-profit" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Winners</span>
                </div>
                <p className="text-xl font-bold text-profit">{winCount}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-loss/10 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-loss" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Losers</span>
                </div>
                <p className="text-xl font-bold text-loss">{lossCount}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Cumulative P&L
              </h3>
              <div className="h-[250px]">
                <PnLDailyChart data={processedData} />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <TradesWidget data={displayTrades} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustom;
