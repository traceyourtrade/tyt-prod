"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, TrendingUp, BarChart3, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import datesforcal from "@/store/datesforcal";

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

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(num);
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

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
        <div key={`empty-${i}`} className="aspect-square sm:aspect-auto sm:h-[72px] rounded-xl bg-[#1a1a1a]" />
      );
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find((d) => d.date === dateStr);

      const hasTrades = dayData && dayData.tradeLength > 0;
      const isProfit = dayData && dayData.profit > 0;
      const isLoss = dayData && dayData.profit < 0;

      cells.push(
        <div
          key={day}
          className={cn(
            "aspect-square sm:aspect-auto sm:h-[72px] rounded-xl flex flex-col justify-center items-center cursor-pointer transition-all duration-200 relative overflow-hidden",
            hasTrades
              ? isProfit
                ? "bg-[#065f46] border border-[#10b981]"
                : isLoss
                  ? "bg-[#7f1d1d] border border-[#ef4444]"
                  : "bg-[#1e1e1e] border border-[#333]"
              : "bg-[#1a1a1a] hover:bg-[#222]"
          )}
          onClick={() => {
            setShowTr();
            document.body.classList.add("no-scroll");
            setDataDate(selectedYear, selectedMonth, day);
          }}
        >
          <span className={cn(
            "text-[10px] sm:text-xs font-medium",
            hasTrades ? "text-white/80" : "text-gray-500"
          )}>
            {day}
          </span>
          {hasTrades && (
            <>
              <span className={cn(
                "text-[10px] sm:text-base font-bold",
                isProfit ? "text-emerald-400" : isLoss ? "text-red-400" : "text-gray-400"
              )}>
                ${formatCurrency(Math.abs(dayData.profit))}
              </span>
              <span className="text-[8px] sm:text-[10px] text-gray-300/70 hidden sm:block">
                {dayData.tradeLength} trades
              </span>
            </>
          )}
        </div>
      );
    }

    return cells;
  };

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
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 sm:p-5 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={handlePrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1e1e1e] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownVisible(!isDropdownVisible)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#1e1e1e] transition-colors"
          >
            <span className="text-base sm:text-lg font-semibold text-white">
              {monthName}
            </span>
            <span className="text-base sm:text-lg text-gray-400">
              {selectedYear}
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isDropdownVisible && "rotate-180"
            )} />
          </button>

          {isDropdownVisible && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl z-50 p-3 w-56">
              <div className="flex items-center justify-center mb-2">
                <button
                  onClick={() => setShowYearView(!showYearView)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {showYearView ? monthName : selectedYear}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {!showYearView ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => (
                    <button
                      key={i}
                      className={cn(
                        "px-2 py-1.5 text-xs rounded-lg transition-colors font-medium",
                        i === selectedMonth
                          ? "bg-white text-black"
                          : "hover:bg-[#252525] text-gray-300"
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
                  className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto"
                  ref={yearContainerRef}
                >
                  {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => 2000 + i).map(
                    (year) => (
                      <button
                        key={year}
                        className={cn(
                          "px-2 py-1.5 text-xs rounded-lg transition-colors font-medium",
                          year === selectedYear
                            ? "bg-white text-black year-active"
                            : "hover:bg-[#252525] text-gray-300"
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
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1e1e1e] transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1 sm:mb-2">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <div key={day} className="text-center text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {renderCalendar()}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-[#262626]">
        <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingUp className={cn(
              "w-3.5 h-3.5",
              monthlyStats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
            )} />
            <span className="text-[10px] sm:text-xs text-gray-400">Monthly P&L</span>
          </div>
          <p className={cn(
            "text-sm sm:text-lg font-bold",
            monthlyStats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {monthlyStats.totalPnL >= 0 ? "+" : "-"}${formatCurrency(Math.abs(monthlyStats.totalPnL))}
          </p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] sm:text-xs text-gray-400">Total Trades</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-white">
            {monthlyStats.totalTrades}
          </p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] sm:text-xs text-gray-400">Win Rate</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-white">
            {monthlyStats.winRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
