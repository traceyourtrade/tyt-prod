"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts";
import calendarPopUp from "@/store/calendarPopUp";
import datesforcal from "@/store/datesforcal";
import useDateRangeStore from "@/store/dateRangeStore";
import useCurrencyStore, {
  formatCompactCurrency,
  convertTradeCurrency,
} from "@/store/currencyStore";

interface Trade {
  date: string;
  Profit: number;
  Currency?: string;
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
  const { selectedRange, setViewingMonth } = useDateRangeStore();
  const { selectedAccounts } = useModeFilteredAccounts();
  const { currency, exchangeRate } = useCurrencyStore();

  const accountBalance = useMemo(() => {
    return (selectedAccounts as Account[]).reduce((sum, acc) => {
      const balance = Number((acc as any).accountBalance) || 0;
      return sum + balance;
    }, 0);
  }, [selectedAccounts]);

  const groupedTrades = (selectedAccounts as Account[])
    .flatMap((acc) => acc.tradeData || [])
    .reduce((acc: Record<string, GroupedTrade>, trade: Trade) => {
      if (!acc[trade.date]) {
        acc[trade.date] = {
          date: trade.date,
          trades: [],
          profit: 0,
          tradeLength: 0,
        };
      }
      acc[trade.date].trades.push(trade);
      const convertedProfit = convertTradeCurrency(
        trade.Profit,
        trade.Currency,
        currency,
        exchangeRate,
      );
      acc[trade.date].profit += convertedProfit;
      acc[trade.date].tradeLength += 1;
      return acc;
    }, {});

  const calendarData = Object.values(groupedTrades) as GroupedTrade[];

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showYearView, setShowYearView] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [direction, setDirection] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const yearContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDropdownVisible && showYearView && yearContainerRef.current) {
      const activeYearElement =
        yearContainerRef.current.querySelector(".year-active");
      if (activeYearElement) {
        yearContainerRef.current.scrollTop =
          (activeYearElement as HTMLElement).offsetTop -
          yearContainerRef.current.offsetTop -
          40;
      }
    }
  }, [isDropdownVisible, showYearView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrencyDisplay = (
    num: number,
    preserveSign: boolean = false,
  ) => {
    const formatted = formatCompactCurrency(
      Math.abs(num),
      currency,
      exchangeRate,
      accountBalance,
      undefined,
      true,
    );
    if (preserveSign && num < 0) return `-${formatted}`;
    return formatted;
  };

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const getHeatmapColor = (
    profit: number,
    maxProfit: number,
    maxLoss: number,
  ) => {
    if (profit > 0) {
      const intensity = Math.min(profit / (maxProfit || 1), 1);
      if (intensity > 0.7)
        return "bg-emerald-500/30 dark:bg-emerald-500/25 border-emerald-500/50";
      if (intensity > 0.4)
        return "bg-emerald-500/20 dark:bg-emerald-500/15 border-emerald-500/30";
      return "bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/20";
    } else if (profit < 0) {
      const intensity = Math.min(
        Math.abs(profit) / (Math.abs(maxLoss) || 1),
        1,
      );
      if (intensity > 0.7)
        return "bg-red-500/30 dark:bg-red-500/25 border-red-500/50";
      if (intensity > 0.4)
        return "bg-red-500/20 dark:bg-red-500/15 border-red-500/30";
      return "bg-red-500/10 dark:bg-red-500/10 border-red-500/20";
    }
    return "bg-gray-100 dark:bg-[#262626] border-transparent";
  };

  const monthlyStats = useMemo(() => {
    const monthStart = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-01`;
    const monthEnd = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${daysInMonth(selectedYear, selectedMonth).toString().padStart(2, "0")}`;

    let totalPnL = 0;
    let totalTrades = 0;
    let tradingDays = 0;
    let winningDays = 0;
    let losingDays = 0;
    let bestDay = { date: "", profit: -Infinity };
    let worstDay = { date: "", profit: Infinity };
    let maxProfit = 0;
    let maxLoss = 0;
    let currentStreak = 0;
    let streakType: "win" | "loss" | null = null;

    const sortedDays = calendarData
      .filter((day) => day.date >= monthStart && day.date <= monthEnd)
      .sort((a, b) => a.date.localeCompare(b.date));

    sortedDays.forEach((day) => {
      totalPnL += day.profit;
      totalTrades += day.tradeLength;
      tradingDays += 1;

      if (day.profit > 0) {
        winningDays += 1;
        maxProfit = Math.max(maxProfit, day.profit);
      } else if (day.profit < 0) {
        losingDays += 1;
        maxLoss = Math.min(maxLoss, day.profit);
      }

      if (day.profit > bestDay.profit) {
        bestDay = { date: day.date, profit: day.profit };
      }
      if (day.profit < worstDay.profit) {
        worstDay = { date: day.date, profit: day.profit };
      }
    });

    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const day = sortedDays[i];
      if (streakType === null) {
        streakType = day.profit >= 0 ? "win" : "loss";
        currentStreak = 1;
      } else if (
        (streakType === "win" && day.profit >= 0) ||
        (streakType === "loss" && day.profit < 0)
      ) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    const winRate =
      tradingDays > 0 ? Math.round((winningDays / tradingDays) * 100) : 0;
    const avgDailyPnL = tradingDays > 0 ? totalPnL / tradingDays : 0;

    return {
      totalPnL,
      totalTrades,
      tradingDays,
      winRate,
      winningDays,
      losingDays,
      bestDay: bestDay.profit !== -Infinity ? bestDay : null,
      worstDay: worstDay.profit !== Infinity ? worstDay : null,
      maxProfit,
      maxLoss,
      currentStreak,
      streakType,
      avgDailyPnL,
    };
  }, [calendarData, selectedYear, selectedMonth]);

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
      cells.push(
        <div
          key={`empty-${i}`}
          className="aspect-square sm:h-[72px] sm:aspect-auto rounded-xl bg-gray-50/50 dark:bg-[#181818]"
        />,
      );
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find((d) => d.date === dateStr);

      const hasTrades = dayData && dayData.tradeLength > 0;
      const isProfit = dayData && dayData.profit > 0;
      const isLoss = dayData && dayData.profit < 0;
      const isToday = new Date().toISOString().split("T")[0] === dateStr;
      const isHovered = hoveredDay === day;

      const heatmapClass = hasTrades
        ? getHeatmapColor(
            dayData.profit,
            monthlyStats.maxProfit,
            monthlyStats.maxLoss,
          )
        : "bg-gray-100 dark:bg-[#202020] border-transparent hover:border-border/50";

      cells.push(
        <motion.div
          key={day}
          className={cn(
            "aspect-square sm:h-[72px] sm:aspect-auto rounded-xl flex flex-col justify-center items-center cursor-pointer transition-all duration-200 relative border group",
            heatmapClass,
            isToday &&
              "ring-2 ring-primary/50 ring-offset-1 ring-offset-background",
            isHovered && "scale-[1.02] shadow-lg z-10",
          )}
          onClick={() => {
            setShowTr();
            document.body.classList.add("no-scroll");
            setDataDate(selectedYear, selectedMonth, day);
          }}
          onMouseEnter={() => setHoveredDay(day)}
          onMouseLeave={() => setHoveredDay(null)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span
            className={cn(
              "text-[10px] sm:text-xs font-medium transition-colors",
              isToday
                ? "text-primary font-bold"
                : hasTrades
                  ? "text-foreground/80"
                  : "text-muted-foreground/50",
            )}
          >
            {day}
          </span>

          {hasTrades && (
            <>
              <span
                className={cn(
                  "text-[11px] sm:text-sm font-bold mt-0.5 transition-colors",
                  isProfit
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isLoss
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground",
                )}
              >
                {isProfit ? "+" : ""}
                {formatCurrencyDisplay(dayData.profit)}
              </span>

              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: Math.min(dayData.tradeLength, 5) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isProfit
                          ? "bg-emerald-500"
                          : isLoss
                            ? "bg-red-500"
                            : "bg-muted-foreground/50",
                      )}
                    />
                  ),
                )}
                {dayData.tradeLength > 5 && (
                  <span className="text-[8px] text-muted-foreground/70 ml-0.5">
                    +{dayData.tradeLength - 5}
                  </span>
                )}
              </div>
            </>
          )}

          {isHovered && hasTrades && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full z-50 bg-card border border-border rounded-lg shadow-xl px-3 py-2 min-w-[120px] pointer-events-none"
            >
              <div className="text-[10px] text-muted-foreground mb-1">
                {new Date(dateStr).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div
                className={cn(
                  "text-sm font-bold",
                  isProfit ? "text-emerald-500" : "text-red-500",
                )}
              >
                {isProfit ? "+" : "-"}
                {formatCurrencyDisplay(dayData.profit)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {dayData.tradeLength}{" "}
                {dayData.tradeLength === 1 ? "trade" : "trades"}
              </div>
            </motion.div>
          )}
        </motion.div>,
      );
    }

    return cells;
  };

  const weeklyProfits = calculateWeeklyProfits(selectedYear, selectedMonth);

  const handlePrevMonth = () => {
    setDirection(-1);
    setIsDropdownVisible(false);
    let newYear = selectedYear;
    let newMonth = selectedMonth;
    if (selectedMonth === 0) {
      newYear = selectedYear - 1;
      newMonth = 11;
      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
      setcalYear(newYear);
      setcalMonth(12);
    } else {
      newMonth = selectedMonth - 1;
      setSelectedMonth(newMonth);
      setcalYear(selectedYear);
      setcalMonth(selectedMonth);
    }
    if (selectedRange === "this_month") {
      setViewingMonth(new Date(newYear, newMonth, 1));
    }
  };

  const handleNextMonth = () => {
    setDirection(1);
    setIsDropdownVisible(false);
    let newYear = selectedYear;
    let newMonth = selectedMonth;
    if (selectedMonth === 11) {
      newYear = selectedYear + 1;
      newMonth = 0;
      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
      setcalYear(newYear);
      setcalMonth(1);
    } else {
      newMonth = selectedMonth + 1;
      setSelectedMonth(newMonth);
      setcalYear(selectedYear);
      setcalMonth(selectedMonth + 2);
    }
    if (selectedRange === "this_month") {
      setViewingMonth(new Date(newYear, newMonth, 1));
    }
  };

  const monthName = new Date(selectedYear, selectedMonth).toLocaleString(
    "default",
    { month: "long" },
  );

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="flex-1 bg-card backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border/50">
        <div className="flex justify-between items-center">
          <motion.button
            onClick={handlePrevMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>

          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setIsDropdownVisible(!isDropdownVisible)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold text-foreground">
                {monthName}
              </span>
              <span className="text-lg text-muted-foreground font-medium">
                {selectedYear}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isDropdownVisible && "rotate-180",
                )}
              />
            </motion.button>

            <AnimatePresence>
              {isDropdownVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 p-4 w-64"
                >
                  <div className="flex items-center justify-center mb-3">
                    <button
                      onClick={() => setShowYearView(!showYearView)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {showYearView ? monthName : selectedYear}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          showYearView && "rotate-180",
                        )}
                      />
                    </button>
                  </div>

                  {!showYearView ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {Array.from({ length: 12 }, (_, i) => (
                        <motion.button
                          key={i}
                          className={cn(
                            "px-2 py-2.5 text-xs rounded-lg transition-all font-medium",
                            i === selectedMonth
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-muted text-foreground",
                          )}
                          onClick={() => {
                            setSelectedMonth(i);
                            setcalMonth(i + 1);
                            setIsDropdownVisible(false);
                            if (selectedRange === "this_month") {
                              setViewingMonth(new Date(selectedYear, i, 1));
                            }
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {new Date(0, i).toLocaleString("default", {
                            month: "short",
                          })}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto scrollbar-thin"
                      ref={yearContainerRef}
                    >
                      {Array.from(
                        { length: new Date().getFullYear() - 2000 + 1 },
                        (_, i) => 2000 + i,
                      ).map((year) => (
                        <motion.button
                          key={year}
                          className={cn(
                            "px-2 py-2.5 text-xs rounded-lg transition-all font-medium",
                            year === selectedYear
                              ? "bg-primary text-primary-foreground shadow-md year-active"
                              : "hover:bg-muted text-foreground",
                          )}
                          onClick={() => {
                            setSelectedYear(year);
                            setcalYear(year);
                            setShowYearView(false);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {year}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={handleNextMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider py-1.5"
                >
                  {day}
                </div>
              ))}
            </div>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${selectedYear}-${selectedMonth}`}
                className="grid grid-cols-7 gap-1 sm:gap-1.5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {renderCalendar()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden sm:flex w-[68px] flex-col gap-1.5 pt-7">
            {weeklyProfits.map((profit, index) => (
              <motion.div
                key={index}
                className={cn(
                  "h-[72px] rounded-xl flex flex-col items-center justify-center text-center transition-all border",
                  profit > 0
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : profit < 0
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-muted/20 dark:bg-[#1a1a1a] border-transparent",
                )}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-[8px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                  W{index + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-bold mt-0.5",
                    profit > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : profit < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground/40",
                  )}
                >
                  {profit !== 0
                    ? (profit > 0 ? "+" : "-") + formatCurrencyDisplay(profit)
                    : "$0"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {(monthlyStats.bestDay || monthlyStats.worstDay) && (
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/30">
            {monthlyStats.bestDay && (
              <motion.div
                className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
                    Best Day
                  </span>
                </div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatCurrencyDisplay(monthlyStats.bestDay.profit)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(monthlyStats.bestDay.date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )}
                </p>
              </motion.div>
            )}
            {monthlyStats.worstDay && (
              <motion.div
                className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">
                    Worst Day
                  </span>
                </div>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  {formatCurrencyDisplay(monthlyStats.worstDay.profit, true)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(monthlyStats.worstDay.date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
