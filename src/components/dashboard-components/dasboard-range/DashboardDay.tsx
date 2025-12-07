'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Clock } from "lucide-react";

import DashWidgets from "../dashboard-widgets/DashboardWidget";
import TradesWidget from "../TradesWidget";
import PnLchartDaily from "./Graphs/PnLDailyChart";
import VeriticalBarGraph from "./Graphs/VerticalBarGraph";

import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts';
import useCurrencyStore, { formatCurrencyValue } from "@/store/currencyStore";
import { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance } from '@/utils/dashboard-calculations/dashboardCalculations';

interface TradeData {
  date: string;
  Profit: number;
  time?: string;
  Item?: string;
  OpenTime?: string;
  Type?: string;
  [key: string]: unknown;
}

interface Account {
  tradeData?: TradeData[];
}

interface GroupedTrade {
  date: string;
  trades: TradeData[];
  profit: number;
  tradeLength: number;
}

const DashboardDay: React.FC = () => {
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

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const calendarRef = useRef<HTMLDivElement>(null);
  const today = formatDate(new Date());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    const formattedDate = formatDate(newDate);
    if (days === 1 && formattedDate > today) return;
    setSelectedDate(formattedDate);
  };

  const todayData = useMemo(() => {
    return selectedAccounts.flatMap(acc =>
      acc.tradeData?.filter(trade => trade.date === selectedDate) || []
    );
  }, [selectedAccounts, selectedDate]);

  const data = useMemo(() => {
    let cumulativeProfit = 0;
    return [
      { time: "", value: 0, Item: "" },
      ...todayData.map(trade => {
        cumulativeProfit += trade.Profit;
        return {
          time: (trade.time || "00:00").slice(0, 5),
          value: parseFloat(cumulativeProfit.toFixed(2)),
          Item: trade.Item || "-"
        };
      })
    ];
  }, [todayData]);

  const nonCumulativeData = useMemo(() => [
    { time: "", value: 0, Item: "" },
    ...todayData.map(trade => ({
      time: (trade.time || "00:00").slice(0, 5),
      value: parseFloat(trade.Profit.toFixed(2)),
      Item: trade.Item || "-",
    })),
  ], [todayData]);

  const winrate = todayData.length ? ((todayData.filter(t => t.Profit > 0).length / todayData.length) * 100).toFixed(2) : "0.00";
  const metrics = calculateRiskRewardRatio(todayData);
  const totalPnL = todayData.reduce((total, { Profit }) => total + Profit, 0);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const getDayProfit = (day: number): number | null => {
    const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const dayData = calendarData.find((d) => d.date === dateStr);
    return dayData ? dayData.profit : null;
  };

  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const cells: React.ReactElement[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8" />);
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const profit = getDayProfit(day);
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === today;

      cells.push(
        <button
          key={day}
          onClick={() => {
            setSelectedDate(dateStr);
            setShowCalendar(false);
          }}
          className={`h-8 w-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
            isSelected
              ? "bg-primary text-primary-foreground"
              : profit !== null
                ? profit >= 0
                  ? "bg-profit/20 text-profit hover:bg-profit/30"
                  : "bg-loss/20 text-loss hover:bg-loss/30"
                : isToday
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const selectedDateObj = new Date(selectedDate);
  const formattedDisplayDate = selectedDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const dashWidgetProps = {
    data,
    pnl: parseFloat(totalPnL.toFixed(2)),
    winrate: parseFloat(winrate),
    winners: todayData.filter(t => t.Profit > 0).length,
    losers: todayData.filter(t => t.Profit < 0).length,
    profitF: calculateProfitFactor(todayData),
    avgProfits: parseFloat(metrics.avgWin),
    avgLoses: parseFloat(metrics.avgLoss),
    rrRatio: metrics.rrRatio,
    accBal: parseFloat(calculateBalance(selectedAccounts).toFixed(2)),
    totalProfits: todayData.reduce((sum, t) => t.Profit > 0 ? sum + t.Profit : sum, 0),
    totalLoses: todayData.reduce((sum, t) => t.Profit < 0 ? sum + t.Profit : sum, 0),
  };

  return (
    <div className="space-y-4">
      <DashWidgets {...dashWidgetProps} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Date Navigation Header */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Daily Overview</h2>
                  <p className="text-sm text-muted-foreground">{formattedDisplayDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeDate(-1)}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>

                <div className="relative" ref={calendarRef}>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 transition-colors flex items-center gap-1"
                  >
                    <span>{selectedDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showCalendar ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl p-4 shadow-xl min-w-[280px]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={handlePrevMonth}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <span className="text-sm font-semibold text-foreground">
                            {new Date(selectedYear, selectedMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </span>
                          <button
                            onClick={handleNextMonth}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                            <div key={i} className="h-6 flex items-center justify-center text-xs font-medium text-muted-foreground">
                              {d}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {renderCalendar()}
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-sm bg-profit" />
                            <span className="text-xs text-muted-foreground">Profit</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-sm bg-loss" />
                            <span className="text-xs text-muted-foreground">Loss</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => changeDate(1)}
                  disabled={selectedDate === today}
                  className={`w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors ${selectedDate === today ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Cumulative P&L Chart */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Cumulative P&L
            </h3>
            <div className="h-[180px]">
              <PnLchartDaily data={data} />
            </div>
          </div>

          {/* Trade History Table */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Trade History
            </h3>

            {todayData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">No trades on this day</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Time</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Symbol</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Side</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {todayData.map((trade, index) => (
                      <tr key={index} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 text-sm text-foreground">{trade.OpenTime || trade.time}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded bg-muted text-xs font-medium text-foreground">
                            {trade.Item}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            trade.Type === "Long" || trade.Type === "buy" ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
                          }`}>
                            {trade.Type}
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 text-right text-sm font-semibold ${
                          trade.Profit >= 0 ? "text-profit" : "text-loss"
                        }`}>
                          {formatCurrencyValue(trade.Profit, currency, exchangeRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              Trade Distribution
            </h3>
            <div className="h-[160px]">
              <VeriticalBarGraph data={nonCumulativeData.filter((_, index) => index !== 0)} />
            </div>
          </div>

          <TradesWidget data={todayData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardDay;
