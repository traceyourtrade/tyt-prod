'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const datePickerRef = useRef<HTMLDivElement>(null);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
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

    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }

    while (currentDateIter <= lastDay) {
      currentWeek.push(new Date(currentDateIter));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentDateIter = new Date(currentDateIter.setDate(currentDateIter.getDate() + 1));
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = useMemo(() => getWeeksInMonth(currentDate), [currentDate]);

  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(() => {
    const today = new Date();
    const weekIndex = weeks.findIndex(week =>
      week.some(day => day && day.getDate() === today.getDate() && day.getMonth() === today.getMonth())
    );
    return weekIndex !== -1 ? weekIndex : 0;
  });

  const currentWeek = weeks[currentWeekIndex] || [];
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const thisWeekData = useMemo(() => {
    return currentWeek
      .map(date => getDayData(date))
      .filter(Boolean) as GroupedTrade[];
  }, [currentWeek, calendarData]);

  const allTrades = useMemo(() => {
    return thisWeekData.flatMap(day => day.trades);
  }, [thisWeekData]);

  const handlePrevWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    } else {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setCurrentDate(prevMonth);
      const prevWeeks = getWeeksInMonth(prevMonth);
      setCurrentWeekIndex(prevWeeks.length - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    } else {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setCurrentDate(nextMonth);
      setCurrentWeekIndex(0);
    }
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setShowTr();
    document.body.classList.add("no-scroll");
    setDataDate(selectedYear, selectedMonth, date.getDate());
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
  };

  const handleMonthSelect = (monthIdx: number) => {
    const newDate = new Date(selectedYear, monthIdx, 1);
    setCurrentDate(newDate);
    setCurrentWeekIndex(0);
    setShowDatePicker(false);
  };

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

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

  return (
    <div className="space-y-4">
      <DashWidgets {...dashWidgetProps} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Week Navigation Header */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Week {currentWeekIndex + 1}</h2>
                  <p className="text-sm text-muted-foreground">{currentMonth} {currentYear}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevWeek}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>

                <div className="relative" ref={datePickerRef}>
                  <button
                    onClick={toggleDatePicker}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 transition-colors flex items-center gap-1"
                  >
                    <span>{currentMonth.slice(0, 3)} {currentYear}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showDatePicker ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showDatePicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl p-4 shadow-xl min-w-[260px]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => setSelectedYear(y => y - 1)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <span className="text-sm font-semibold text-foreground">{selectedYear}</span>
                          <button
                            onClick={() => setSelectedYear(y => y + 1)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {monthNames.map((month, idx) => (
                            <button
                              key={month}
                              onClick={() => handleMonthSelect(idx)}
                              className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                                idx === currentDate.getMonth() && selectedYear === currentDate.getFullYear()
                                  ? "bg-primary text-primary-foreground"
                                  : "text-foreground hover:bg-muted"
                              }`}
                            >
                              {month.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleNextWeek}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Week Calendar Grid */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {dayNames.map((day, i) => (
                <div key={i} className="py-2.5 text-center text-xs font-semibold text-muted-foreground tracking-wide bg-muted/30">
                  {day}
                </div>
              ))}
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7">
              {currentWeek.map((date, index) => {
                const dayData = date ? getDayData(date) : null;
                const isToday = date && date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    disabled={!date}
                    className={`relative min-h-[80px] sm:min-h-[100px] p-2 sm:p-3 border-r border-border last:border-r-0 transition-all flex flex-col items-center justify-center gap-0.5 ${
                      !date
                        ? "bg-muted/20 cursor-default"
                        : dayData
                          ? dayData.profit >= 0
                            ? "bg-profit/5 hover:bg-profit/10"
                            : "bg-loss/5 hover:bg-loss/10"
                          : "hover:bg-muted/30"
                    } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                  >
                    {date && (
                      <>
                        <span className={`text-base sm:text-lg font-bold ${
                          dayData
                            ? dayData.profit >= 0 ? "text-profit" : "text-loss"
                            : "text-foreground"
                        }`}>
                          {date.getDate()}
                        </span>
                        {dayData && (
                          <>
                            <span className={`text-xs sm:text-sm font-semibold ${
                              dayData.profit >= 0 ? "text-profit" : "text-loss"
                            }`}>
                              {formatCompactCurrency(dayData.profit, currency, exchangeRate)}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {dayData.tradeLength} trade{dayData.tradeLength !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              Net Cumulative P&L
            </h3>
            <div className="h-[160px]">
              <PnLDailyChart data={PNLcumulative} />
            </div>
          </div>

          <TradesWidget data={allTrades} />
        </div>
      </div>
    </div>
  );
};

export default DashboardWeek;
