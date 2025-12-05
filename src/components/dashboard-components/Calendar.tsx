"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, TrendingUp, BarChart3, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import datesforcal from "@/store/datesforcal";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

interface Trade {
  date: string;
  Profit: number;
  [key: string]: unknown;
}

interface Account {
  tradeData?: Trade[];
  [key: string]: unknown;
}

interface GroupedTrade {
  date: string;
  trades: Trade[];
  profit: number;
  tradeLength: number;
}

const Calendar = () => {
  const { setShowTr, setDataDate } = calendarPopUp();
  const { setcalMonth, setcalYear } = datesforcal();
  const { selectedAccounts } = useAccountDetails();
  const { currency, exchangeRate } = useCurrencyStore();

  const groupedTrades = (selectedAccounts as Account[]).flatMap((acc) => acc.tradeData || [])
    .reduce((acc: Record<string, GroupedTrade>, trade: Trade) => {
      if (!acc[trade.date]) {
        acc[trade.date] = { date: trade.date, trades: [], profit: 0, tradeLength: 0 };
      }
      acc[trade.date].trades.push(trade);
      acc[trade.date].profit += trade.Profit;
      acc[trade.date].tradeLength += 1;
      return acc;
    }, {});

  const calendarData = Object.values(groupedTrades) as GroupedTrade[];

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showYearView, setShowYearView] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const yearContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDropdownVisible && showYearView && yearContainerRef.current) {
      const activeYearElement = yearContainerRef.current.querySelector(".year-active");
      if (activeYearElement) {
        yearContainerRef.current.scrollTop =
          (activeYearElement as HTMLElement).offsetTop - yearContainerRef.current.offsetTop - 40;
      }
    }
  }, [isDropdownVisible, showYearView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrencyDisplay = (num: number) => {
    return formatCompactCurrency(Math.abs(num), currency, exchangeRate);
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const calculateWeeklyProfits = (year: number, month: number) => {
    const days = daysInMonth(year, month);
    const weeks: number[] = [];
    let weekProfit = 0;

    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find((d) => d.date === dateStr);

      if (dayData) {
        weekProfit += dayData.profit;
      }

      if (new Date(year, month, day).getDay() === 6 || day === days) {
        weeks.push(weekProfit);
        weekProfit = 0;
      }
    }
    return weeks;
  };

  const monthlyStats = useMemo(() => {
    const monthStart = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-01`;
    const monthEnd = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${daysInMonth(selectedYear, selectedMonth).toString().padStart(2, "0")}`;
    
    let totalPnL = 0;
    let totalTrades = 0;
    let tradingDays = 0;
    let winningDays = 0;

    calendarData.forEach((day) => {
      if (day.date >= monthStart && day.date <= monthEnd) {
        totalPnL += day.profit;
        totalTrades += day.tradeLength;
        tradingDays += 1;
        if (day.profit > 0) winningDays += 1;
      }
    });

    const winRate = tradingDays > 0 ? Math.round((winningDays / tradingDays) * 100) : 0;

    return { totalPnL, totalTrades, tradingDays, winRate };
  }, [calendarData, selectedYear, selectedMonth]);

  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(
        <div key={`empty-${i}`} className="aspect-square sm:h-[80px] sm:aspect-auto rounded-xl bg-muted/20" />
      );
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find((d) => d.date === dateStr);

      const hasTrades = dayData && dayData.tradeLength > 0;
      const isProfit = dayData && dayData.profit > 0;
      const isLoss = dayData && dayData.profit < 0;

      const getProfitBgClass = () => {
        if (!hasTrades) return "bg-muted/20 hover:bg-muted/40";
        if (isProfit) return "bg-profit/10 border border-profit/20 hover:border-profit/40 hover:bg-profit/15";
        if (isLoss) return "bg-loss/10 border border-loss/20 hover:border-loss/40 hover:bg-loss/15";
        return "bg-card/80 border border-border/50 hover:border-border hover:bg-card";
      };

      cells.push(
        <div
          key={day}
          className={cn(
            "aspect-square sm:h-[80px] sm:aspect-auto rounded-xl flex flex-col justify-center items-center cursor-pointer transition-all duration-200 relative",
            getProfitBgClass()
          )}
          onClick={() => {
            setShowTr();
            document.body.classList.add("no-scroll");
            setDataDate(selectedYear, selectedMonth, day);
          }}
        >
          <span className={cn(
            "text-[10px] sm:text-xs font-medium",
            hasTrades ? "text-foreground/70" : "text-muted-foreground/60"
          )}>
            {day}
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
        </div>
      );
    }

    return cells;
  };

  const weeklyProfits = calculateWeeklyProfits(selectedYear, selectedMonth);

  const handlePrevMonth = () => {
    setIsDropdownVisible(false);
    if (selectedMonth === 0) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(11);
      setcalYear(selectedYear - 1);
      setcalMonth(12);
    } else {
      setSelectedMonth((prev) => prev - 1);
      setcalYear(selectedYear);
      setcalMonth(selectedMonth);
    }
  };

  const handleNextMonth = () => {
    setIsDropdownVisible(false);
    if (selectedMonth === 11) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(0);
      setcalYear(selectedYear + 1);
      setcalMonth(1);
    } else {
      setSelectedMonth((prev) => prev + 1);
      setcalYear(selectedYear);
      setcalMonth(selectedMonth + 2);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long" });

  return (
    <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-5 overflow-hidden">
      <div className="flex justify-between items-center mb-4 sm:mb-5">
        <button 
          onClick={handlePrevMonth}
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
              {monthName}
            </span>
            <span className="text-base sm:text-lg text-muted-foreground">
              {selectedYear}
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
                  {showYearView ? monthName : selectedYear}
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
                        i === selectedMonth
                          ? "bg-foreground text-background"
                          : "hover:bg-muted text-foreground"
                      )}
                      onClick={() => {
                        setSelectedMonth(i);
                        setcalMonth(i + 1);
                        setIsDropdownVisible(false);
                      }}
                    >
                      {new Date(0, i).toLocaleString("default", { month: "short" })}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto scrollbar-thin"
                  ref={yearContainerRef}
                >
                  {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => 2000 + i).map(
                    (year) => (
                      <button
                        key={year}
                        className={cn(
                          "px-2 py-2 text-xs rounded-lg transition-colors font-medium",
                          year === selectedYear
                            ? "bg-foreground text-background year-active"
                            : "hover:bg-muted text-foreground"
                        )}
                        onClick={() => {
                          setSelectedYear(year);
                          setcalYear(year);
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
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 sm:gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1 sm:mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-[8px] sm:text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider py-1 sm:py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {renderCalendar()}
          </div>
        </div>

        <div className="hidden sm:flex w-[72px] flex-col gap-1.5 pt-8">
          {weeklyProfits.map((profit, index) => (
            <div
              key={index}
              className={cn(
                "h-[80px] rounded-xl flex flex-col items-center justify-center text-center transition-all",
                profit !== 0 
                  ? "bg-card/80 border border-border/50" 
                  : "bg-muted/20"
              )}
            >
              <span className="text-[9px] text-muted-foreground/70 font-medium">Week {index + 1}</span>
              <span className={cn(
                "text-xs font-bold mt-0.5",
                profit > 0 ? "text-profit" : profit < 0 ? "text-loss" : "text-muted-foreground/50"
              )}>
                {profit !== 0 ? formatCurrencyDisplay(profit) : formatCompactCurrency(0, currency, exchangeRate)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-border/50">
        <div className="bg-muted/20 rounded-xl p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
            <TrendingUp className={cn(
              "w-3 h-3 sm:w-3.5 sm:h-3.5",
              monthlyStats.totalPnL >= 0 ? "text-profit" : "text-loss"
            )} />
            <span className="text-[9px] sm:text-xs text-muted-foreground">Monthly P&L</span>
          </div>
          <p className={cn(
            "text-sm sm:text-lg font-bold",
            monthlyStats.totalPnL >= 0 ? "text-profit" : "text-loss"
          )}>
            {monthlyStats.totalPnL >= 0 ? "+" : "-"}{formatCurrencyDisplay(monthlyStats.totalPnL)}
          </p>
        </div>

        <div className="bg-muted/20 rounded-xl p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
            <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
            <span className="text-[9px] sm:text-xs text-muted-foreground">Total Trades</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-foreground">
            {monthlyStats.totalTrades}
          </p>
        </div>

        <div className="bg-muted/20 rounded-xl p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
            <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
            <span className="text-[9px] sm:text-xs text-muted-foreground">Win Rate</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-foreground">
            {monthlyStats.winRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
