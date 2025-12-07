'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, TrendingUp, TrendingDown, Target, Flame, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

import DashWidgets from "../dashboard-widgets/DashboardWidget";
import PnLDailyChart from "./Graphs/PnLDailyChart";
import TradesWidget from '../TradesWidget';

import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts';
import calendarPopUp from '@/store/calendarPopUp';
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";
import { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance } from '@/utils/dashboard-calculations/dashboardCalculations';

interface TradeData {
  date: string;
  Profit: number;
  Item: string;
  [key: string]: unknown;
}

interface Account {
  tradeData?: TradeData[];
  [key: string]: unknown;
}

interface GroupedTrade {
  date: string;
  trades: TradeData[];
  profit: number;
  tradeLength: number;
}

const DashboardWeek: React.FC = () => {
  const { setShowTr, setDataDate } = calendarPopUp();
  const { selectedAccounts } = useModeFilteredAccounts();
  const { currency, exchangeRate } = useCurrencyStore();

  const groupedTrades = (selectedAccounts as Account[]).flatMap((acc) => acc.tradeData || [])
    .reduce((acc: { [key: string]: GroupedTrade }, trade: TradeData) => {
      if (!acc[trade.date]) acc[trade.date] = { date: trade.date, trades: [], profit: 0, tradeLength: 0 };
      acc[trade.date].trades.push(trade);
      acc[trade.date].profit += trade.Profit;
      acc[trade.date].tradeLength += 1;
      return acc;
    }, {});

  const calendarData = Object.values(groupedTrades);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [showYearView, setShowYearView] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDayData = (date: Date | null): GroupedTrade | null => {
    if (!date) return null;
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return calendarData.find(item => item.date === formattedDate) || null;
  };

  const getWeeksInMonth = (date: Date): (Date | null)[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    let currentDateIter = new Date(firstDay);

    for (let i = 0; i < firstDay.getDay(); i++) {
      currentWeek.push(null);
    }

    while (currentDateIter <= lastDay) {
      currentWeek.push(new Date(currentDateIter));
      if (currentDateIter.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const allWeeks = useMemo(() => getWeeksInMonth(currentDate), [currentDate]);
  const currentWeekIndex = useMemo(() => {
    const today = new Date();
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()) {
      return allWeeks.findIndex(week => 
        week.some(date => date && date.getDate() === today.getDate())
      );
    }
    return 0;
  }, [allWeeks, currentDate]);

  const [displayWeekIndex, setDisplayWeekIndex] = useState(currentWeekIndex >= 0 ? currentWeekIndex : 0);

  useEffect(() => {
    setDisplayWeekIndex(currentWeekIndex >= 0 ? currentWeekIndex : 0);
  }, [currentWeekIndex]);

  const currentWeek = allWeeks[displayWeekIndex] || [];
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();

  const handlePrevWeek = () => {
    if (displayWeekIndex > 0) {
      setDisplayWeekIndex(displayWeekIndex - 1);
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
      const newWeeks = getWeeksInMonth(newDate);
      setDisplayWeekIndex(newWeeks.length - 1);
    }
  };

  const handleNextWeek = () => {
    if (displayWeekIndex < allWeeks.length - 1) {
      setDisplayWeekIndex(displayWeekIndex + 1);
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
      setDisplayWeekIndex(0);
    }
  };

  const handleMonthSelect = (monthIdx: number) => {
    const newDate = new Date(selectedYear, monthIdx, 1);
    setCurrentDate(newDate);
    setSelectedMonth(monthIdx);
    setDisplayWeekIndex(0);
    setIsDropdownVisible(false);
    setShowYearView(false);
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setShowTr();
    document.body.classList.add("no-scroll");
    setDataDate(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const thisWeekData = useMemo(() => {
    return currentWeek
      .filter((date): date is Date => date !== null)
      .map(date => getDayData(date))
      .filter((data): data is GroupedTrade => data !== null);
  }, [currentWeek, calendarData]);

  const allTrades = thisWeekData.flatMap(day => day.trades);

  const calculateCumulativePNL = () => {
    const cumulativePNL = [{ time: "", value: 0 }];
    let runningTotal = 0;

    const dailySums: { [key: string]: number } = {};
    thisWeekData.forEach(day => {
      dailySums[day.date] = (dailySums[day.date] || 0) + day.profit;
    });

    Object.entries(dailySums)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .forEach(([date, profit]) => {
        runningTotal += profit;
        cumulativePNL.push({
          time: date,
          value: parseFloat(runningTotal.toFixed(2))
        });
      });

    return cumulativePNL;
  };

  const PNLcumulative = calculateCumulativePNL();
  const metrics = calculateRiskRewardRatio(allTrades);
  const winCount = allTrades.filter(t => t.Profit > 0).length;
  const lossCount = allTrades.filter(t => t.Profit < 0).length;

  const bestTrade = allTrades.length > 0 ? Math.max(...allTrades.map(t => t.Profit)) : 0;
  const worstTrade = allTrades.length > 0 ? Math.min(...allTrades.map(t => t.Profit)) : 0;
  const tradingDays = thisWeekData.length;

  const calculateStreak = () => {
    if (thisWeekData.length === 0) return { type: 'none', count: 0 };
    const sortedDays = [...thisWeekData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    const firstDayProfit = sortedDays[0]?.profit >= 0;
    for (const day of sortedDays) {
      if ((day.profit >= 0) === firstDayProfit) {
        streak++;
      } else {
        break;
      }
    }
    return { type: firstDayProfit ? 'win' : 'loss', count: streak };
  };
  const streak = calculateStreak();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dashWidgetProps = {
    data: PNLcumulative,
    pnl: parseFloat(allTrades.reduce((sum, trade) => sum + (trade.Profit || 0), 0).toFixed(2)),
    winrate: parseFloat(((allTrades.filter(trade => trade.Profit > 0).length / allTrades.length * 100) || 0).toFixed(2)),
    winners: winCount,
    losers: lossCount,
    profitF: calculateProfitFactor(allTrades),
    avgProfits: parseFloat(metrics.avgWin),
    avgLoses: parseFloat(metrics.avgLoss),
    rrRatio: metrics.rrRatio,
    accBal: parseFloat(calculateBalance(selectedAccounts).toFixed(2)),
    totalProfits: allTrades.reduce((sum, trade) => trade.Profit > 0 ? sum + trade.Profit : sum, 0),
    totalLoses: allTrades.reduce((sum, trade) => trade.Profit < 0 ? sum + trade.Profit : sum, 0),
  };

  const formatCurrencyDisplay = (num: number) => {
    return formatCompactCurrency(Math.abs(num), currency, exchangeRate);
  };

  return (
    <div className="space-y-4">
      <DashWidgets {...dashWidgetProps} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Week Calendar - Matching Monthly Calendar Design */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-5 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 sm:mb-5">
              <button 
                onClick={handlePrevWeek}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownVisible(!isDropdownVisible)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    Week {displayWeekIndex + 1}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-base sm:text-lg text-muted-foreground">
                    {currentMonth} {currentYear}
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isDropdownVisible && "rotate-180"
                  )} />
                </button>

                {isDropdownVisible && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 p-4 w-64">
                    <div className="flex items-center justify-center mb-3">
                      <button
                        onClick={() => setShowYearView(!showYearView)}
                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showYearView ? currentMonth : selectedYear}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                    {!showYearView ? (
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => (
                          <button
                            key={i}
                            className={cn(
                              "px-2 py-2 text-xs rounded-lg transition-colors font-medium",
                              i === currentDate.getMonth() && selectedYear === currentDate.getFullYear()
                                ? "bg-foreground text-background"
                                : "hover:bg-muted text-foreground"
                            )}
                            onClick={() => handleMonthSelect(i)}
                          >
                            {new Date(0, i).toLocaleString("default", { month: "short" })}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                        {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => 2000 + i).map(
                          (year) => (
                            <button
                              key={year}
                              className={cn(
                                "px-2 py-2 text-xs rounded-lg transition-colors font-medium",
                                year === selectedYear
                                  ? "bg-foreground text-background"
                                  : "hover:bg-muted text-foreground"
                              )}
                              onClick={() => {
                                setSelectedYear(year);
                                setShowYearView(false);
                              }}
                            >
                              {year}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={handleNextWeek}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1 sm:mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-[8px] sm:text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider py-1 sm:py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Week Days - Matching Monthly Calendar Cell Design */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {currentWeek.map((date, index) => {
                const dayData = date ? getDayData(date) : null;
                const isToday = date && date.toDateString() === new Date().toDateString();
                const hasTrades = dayData && dayData.tradeLength > 0;
                const isProfit = dayData && dayData.profit > 0;
                const isLoss = dayData && dayData.profit < 0;

                const getProfitBgClass = () => {
                  if (!date) return "bg-muted/20";
                  if (!hasTrades) return "bg-muted/20 hover:bg-muted/40";
                  if (isProfit) return "bg-profit/10 border border-profit/20 hover:border-profit/40 hover:bg-profit/15";
                  if (isLoss) return "bg-loss/10 border border-loss/20 hover:border-loss/40 hover:bg-loss/15";
                  return "bg-card/80 border border-border/50 hover:border-border hover:bg-card";
                };

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      "aspect-square sm:h-[100px] sm:aspect-auto rounded-xl flex flex-col justify-center items-center cursor-pointer transition-all duration-200 relative",
                      getProfitBgClass(),
                      isToday && "ring-2 ring-primary ring-inset"
                    )}
                  >
                    {date && (
                      <>
                        <span className={cn(
                          "text-[10px] sm:text-xs font-medium",
                          hasTrades ? "text-foreground/70" : "text-muted-foreground/60"
                        )}>
                          {date.getDate()}
                        </span>
                        {hasTrades && (
                          <>
                            <span className={cn(
                              "text-[10px] sm:text-sm font-bold mt-0.5",
                              isProfit ? "text-profit" : isLoss ? "text-loss" : "text-muted-foreground"
                            )}>
                              {formatCurrencyDisplay(dayData.profit)}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-muted-foreground/70 hidden sm:block">
                              {dayData.tradeLength} {dayData.tradeLength === 1 ? 'trade' : 'trades'}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          {/* Cumulative P&L Chart - No wrapper, using component's built-in header */}
          <PnLDailyChart data={PNLcumulative} />

          {/* Insight Tiles Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Avg Win */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-profit/10">
                  <TrendingUp className="w-3 h-3 text-profit" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Avg Win</span>
              </div>
              <p className="text-sm font-bold text-profit">
                {formatCompactCurrency(parseFloat(metrics.avgWin) || 0, currency, exchangeRate)}
              </p>
            </div>

            {/* Avg Loss */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-loss/10">
                  <TrendingDown className="w-3 h-3 text-loss" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Avg Loss</span>
              </div>
              <p className="text-sm font-bold text-loss">
                {formatCompactCurrency(Math.abs(parseFloat(metrics.avgLoss)) || 0, currency, exchangeRate)}
              </p>
            </div>

            {/* Best Trade */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-profit/10">
                  <Target className="w-3 h-3 text-profit" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Best Trade</span>
              </div>
              <p className={cn("text-sm font-bold", bestTrade >= 0 ? "text-profit" : "text-loss")}>
                {formatCompactCurrency(bestTrade, currency, exchangeRate)}
              </p>
            </div>

            {/* Worst Trade */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-loss/10">
                  <Target className="w-3 h-3 text-loss" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Worst Trade</span>
              </div>
              <p className={cn("text-sm font-bold", worstTrade >= 0 ? "text-profit" : "text-loss")}>
                {formatCompactCurrency(worstTrade, currency, exchangeRate)}
              </p>
            </div>

            {/* Current Streak */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn("p-1.5 rounded-lg", streak.type === 'win' ? "bg-profit/10" : streak.type === 'loss' ? "bg-loss/10" : "bg-muted/50")}>
                  <Flame className={cn("w-3 h-3", streak.type === 'win' ? "text-profit" : streak.type === 'loss' ? "text-loss" : "text-muted-foreground")} />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Streak</span>
              </div>
              <p className={cn("text-sm font-bold", streak.type === 'win' ? "text-profit" : streak.type === 'loss' ? "text-loss" : "text-muted-foreground")}>
                {streak.count > 0 ? `${streak.count} ${streak.type === 'win' ? 'Win' : 'Loss'}` : '-'}
              </p>
            </div>

            {/* Trading Days */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <BarChart3 className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Trading Days</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {tradingDays} / 7
              </p>
            </div>
          </div>

          <TradesWidget data={allTrades} />
        </div>
      </div>
    </div>
  );
};

export default DashboardWeek;
