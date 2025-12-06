'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, BarChart3, Trophy, Target } from 'lucide-react';

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

interface Trade {
  date: string;
  Profit: number;
  Item: string;
  [key: string]: unknown;
}

interface GroupedTrade {
  date: string;
  trades: Trade[];
  profit: number;
  tradeLength: number;
  [key: string]: unknown;
}

const DashboardWeek: React.FC = () => {
  const { setShowTr, setDataDate } = calendarPopUp();
  const { selectedAccounts } = useModeFilteredAccounts();
  const { currency, exchangeRate } = useCurrencyStore();

  const groupedTrades = (selectedAccounts as Account[]).flatMap((acc) => acc.tradeData || [])
    .reduce((acc: { [key: string]: GroupedTrade }, trade: Trade) => {
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

  const weeklyProfit = useMemo(() => {
    return thisWeekData.reduce((total, day) => total + day.profit, 0);
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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full min-h-screen bg-background">
      <DashWidgets
        data={PNLcumulative}
        pnl={parseFloat(allTrades.reduce((sum, trade) => sum + (trade.Profit || 0), 0).toFixed(2))}
        winrate={parseFloat(((allTrades.filter(trade => trade.Profit > 0).length / allTrades.length * 100) || 0).toFixed(2))}
        winners={winCount}
        losers={lossCount}
        profitF={calculateProfitFactor(allTrades)}
        avgProfits={parseFloat(metrics.avgWin)}
        avgLoses={parseFloat(metrics.avgLoss)}
        rrRatio={metrics.rrRatio}
        accBal={parseFloat(calculateBalance(selectedAccounts).toFixed(2))}
        totalProfits={0}
        totalLoses={0}
      />

      <div className="px-4 pb-6 space-y-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">Weekly Overview</h2>
                <p className="text-sm text-muted-foreground">{currentMonth} {currentYear}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold text-foreground">
                Week {currentWeekIndex + 1}
              </span>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevWeek}
                  className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </motion.button>

                <div className="relative" ref={datePickerRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleDatePicker}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 transition-colors flex items-center gap-2"
                  >
                    <span>{currentMonth.slice(0, 3)} {currentYear}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showDatePicker ? "rotate-90" : ""}`} />
                  </motion.button>

                  <AnimatePresence>
                    {showDatePicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl p-4 shadow-xl min-w-[280px]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => setSelectedYear(y => y - 1)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <span className="text-sm font-semibold text-foreground">{selectedYear}</span>
                          <button
                            onClick={() => setSelectedYear(y => y + 1)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {monthNames.map((month, idx) => (
                            <motion.button
                              key={month}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleMonthSelect(idx)}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                idx === currentDate.getMonth() && selectedYear === currentDate.getFullYear()
                                  ? "bg-primary text-primary-foreground"
                                  : "text-foreground hover:bg-muted"
                              }`}
                            >
                              {month.slice(0, 3)}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextWeek}
                  className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7">
                {dayNames.map((day, i) => (
                  <div key={i} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {currentWeek.map((date, index) => {
                  const dayData = date ? getDayData(date) : null;
                  const isToday = date && date.toDateString() === new Date().toDateString();

                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: date ? 1.02 : 1 }}
                      whileTap={{ scale: date ? 0.98 : 1 }}
                      onClick={() => handleDateClick(date)}
                      disabled={!date}
                      className={`relative min-h-[100px] p-3 border-r border-b border-border last:border-r-0 transition-all flex flex-col items-center justify-center gap-1 ${
                        !date
                          ? "bg-muted/20 cursor-default"
                          : dayData
                            ? dayData.profit >= 0
                              ? "bg-profit/10 hover:bg-profit/15"
                              : "bg-loss/10 hover:bg-loss/15"
                            : "hover:bg-muted/30"
                      } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                    >
                      {date && (
                        <>
                          <span className={`text-lg font-bold ${
                            dayData
                              ? dayData.profit >= 0
                                ? "text-profit"
                                : "text-loss"
                              : "text-foreground"
                          }`}>
                            {date.getDate()}
                          </span>
                          {dayData && (
                            <>
                              <span className={`text-sm font-semibold ${
                                dayData.profit >= 0 ? "text-profit" : "text-loss"
                              }`}>
                                {formatCompactCurrency(dayData.profit, currency, exchangeRate)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {dayData.tradeLength} trade{dayData.tradeLength !== 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Total Trades</span>
                </div>
                <p className="text-xl font-bold text-foreground">{allTrades.length}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${weeklyProfit >= 0 ? "bg-profit/10" : "bg-loss/10"}`}>
                    <TrendingUp className={`w-3.5 h-3.5 ${weeklyProfit >= 0 ? "text-profit" : "text-loss"}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Weekly P&L</span>
                </div>
                <p className={`text-xl font-bold ${weeklyProfit >= 0 ? "text-profit" : "text-loss"}`}>
                  {formatCompactCurrency(weeklyProfit, currency, exchangeRate)}
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
          </div>

          <div className="space-y-5">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Cumulative P&L
              </h3>
              <div className="h-[180px]">
                <PnLDailyChart data={PNLcumulative} />
              </div>
            </div>

            <TradesWidget data={allTrades} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWeek;
