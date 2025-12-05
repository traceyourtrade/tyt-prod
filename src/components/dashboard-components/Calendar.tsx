"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-[80px] rounded-xl" />);
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find((d) => d.date === dateStr);

      cells.push(
        <div
          key={day}
          className={cn(
            "h-[80px] rounded-xl flex flex-col justify-center items-center relative cursor-pointer transition-all duration-200",
            dayData 
              ? "bg-card/80 border border-border/50 hover:border-border hover:bg-card" 
              : "bg-muted/20 hover:bg-muted/40"
          )}
          onClick={() => {
            setShowTr();
            document.body.classList.add("no-scroll");
            setDataDate(selectedYear, selectedMonth, day);
          }}
        >
          <span className={cn(
            "text-xs font-medium",
            dayData ? "text-foreground/70" : "text-muted-foreground/60"
          )}>
            {day}
          </span>
          {dayData && (
            <>
              <span className={cn(
                "text-sm font-bold mt-0.5",
                dayData.profit > 0 ? "text-profit" : 
                dayData.profit < 0 ? "text-loss" : "text-muted-foreground"
              )}>
                ${formatCurrency(Math.abs(dayData.profit))}
              </span>
              <span className="text-[9px] text-muted-foreground/70">
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
    <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePrevMonth}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownVisible(!isDropdownVisible)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <span className="text-lg font-semibold text-foreground">
              {monthName}
            </span>
            <span className="text-lg text-muted-foreground">
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

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNextMonth}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {renderCalendar()}
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="w-[72px] flex flex-col gap-1.5 pt-8">
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
                {profit !== 0 ? `$${formatCurrency(Math.abs(profit))}` : '$0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
