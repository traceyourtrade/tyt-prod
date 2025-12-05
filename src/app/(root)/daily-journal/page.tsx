"use client"
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  Calendar, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Trophy,
  Target,
  Zap,
  BarChart3,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAccountDetails from "@/store/accountdetails";
import useCurrencyStore, { formatCurrencyValue, formatCompactCurrency } from "@/store/currencyStore";
import QuickStats from "@/components/daily-journal/QuickStat";
import JRContent from "@/components/daily-journal/JRContent";

interface Trade {
  date: string;
  time: string;
  Profit: number;
  [key: string]: any;
}

interface Account {
  tradeData?: Trade[];
  [key: string]: any;
}

const DailyJournal = () => {
  const { selectedAccounts } = useAccountDetails();
  const { currency, exchangeRate } = useCurrencyStore();
  
  const [dailyData, setDailyData] = useState<Trade[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showMobileStats, setShowMobileStats] = useState(false);

  const today = new Date();
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const processData = () => {
      const allTrades = (selectedAccounts as Account[]).flatMap(account => account.tradeData || []);
      const sortedTrades = allTrades.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
      setDailyData(sortedTrades);
    };
    if (selectedAccounts?.length) processData();
  }, [selectedAccounts]);

  const filteredDailyData = useMemo(() => {
    let data = dailyData;

    switch (selectedFilter) {
      case 'profitHighToLow':
        data = [...data].sort((a, b) => b.Profit - a.Profit);
        break;
      case 'profitLowToHigh':
        data = [...data].sort((a, b) => a.Profit - b.Profit);
        break;
      case 'onlyProfit':
        data = data.filter(trade => trade.Profit > 0);
        break;
      case 'onlyLoss':
        data = data.filter(trade => trade.Profit < 0);
        break;
      default:
        break;
    }

    if (selectedStartDate && selectedEndDate) {
      data = data.filter(trade => {
        const tradeDate = new Date(trade.date);
        const tradeDay = new Date(tradeDate.getFullYear(), tradeDate.getMonth(), tradeDate.getDate());
        return tradeDay >= selectedStartDate && tradeDay <= selectedEndDate;
      });
    }

    return data;
  }, [dailyData, selectedFilter, selectedStartDate, selectedEndDate]);

  const stats = useMemo(() => {
    const winners = filteredDailyData.filter(t => t.Profit > 0).length;
    const losers = filteredDailyData.filter(t => t.Profit < 0).length;
    const totalPnL = filteredDailyData.reduce((sum, t) => sum + (t.Profit || 0), 0);
    const winRate = filteredDailyData.length ? Math.round((winners / filteredDailyData.length) * 100) : 0;
    
    let currentStreak = 0;
    let maxStreak = 0;
    for (const trade of [...filteredDailyData].reverse()) {
      if (trade.Profit > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    const tradingDays = new Set(filteredDailyData.map(t => t.date)).size;
    
    return { winners, losers, totalPnL, winRate, currentStreak, maxStreak, tradingDays, totalTrades: filteredDailyData.length };
  }, [filteredDailyData]);

  const groupedTrades = (selectedAccounts as Account[]).flatMap(acc => acc.tradeData || [])
    .reduce((acc: { [key: string]: { date: string; profit: number; trades: number } }, trade) => {
      if (!acc[trade.date]) acc[trade.date] = { date: trade.date, profit: 0, trades: 0 };
      acc[trade.date].profit += trade.Profit;
      acc[trade.date].trades += 1;
      return acc;
    }, {});

  const calendarData = Object.values(groupedTrades);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterOptions = [
    { value: 'all', label: 'All Trades', icon: BarChart3 },
    { value: 'profitHighToLow', label: 'Best First', icon: TrendingUp },
    { value: 'profitLowToHigh', label: 'Worst First', icon: TrendingDown },
    { value: 'onlyProfit', label: 'Winners Only', icon: Trophy },
    { value: 'onlyLoss', label: 'Losers Only', icon: Target },
  ];

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(prev => prev - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(prev => prev + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(selectedYear, selectedMonth, day);
    if (clickedDate > today) return;

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(clickedDate);
      setTempEndDate(null);
    } else {
      if (clickedDate < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(clickedDate);
      } else {
        setTempEndDate(clickedDate);
      }
    }
  };

  const applyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setSelectedStartDate(tempStartDate);
      setSelectedEndDate(tempEndDate);
      setIsCalendarOpen(false);
    }
  };

  const clearDateRange = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  const getHeatColor = (profit: number) => {
    if (profit > 200) return "bg-profit text-white";
    if (profit > 0) return "bg-profit/40 text-profit";
    if (profit < -200) return "bg-loss text-white";
    if (profit < 0) return "bg-loss/40 text-loss";
    return "";
  };

  const getMotivationalMessage = () => {
    if (stats.currentStreak >= 5) return "You're on fire!";
    if (stats.winRate >= 70) return "Trading machine!";
    if (stats.winRate >= 50) return "Keep it up!";
    if (stats.totalTrades === 0) return "Ready to trade?";
    return "Stay focused!";
  };

  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDay = firstDayOfMonth(selectedYear, selectedMonth);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-9" />);
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find(d => d.date === dateStr);
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const isDisabled = currentDate > today;
      const isSelected = tempStartDate && currentDate.getTime() === tempStartDate.getTime();
      const isEnd = tempEndDate && currentDate.getTime() === tempEndDate.getTime();
      const isInRange = tempStartDate && tempEndDate && currentDate > tempStartDate && currentDate < tempEndDate;

      cells.push(
        <button
          key={day}
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
          className={cn(
            "h-9 rounded-lg text-sm font-medium transition-all relative",
            isDisabled && "text-muted-foreground/30 cursor-not-allowed",
            !isDisabled && "cursor-pointer hover:bg-muted",
            (isSelected || isEnd) && "bg-primary text-primary-foreground",
            isInRange && "bg-primary/20",
            dayData && !isSelected && !isEnd && getHeatColor(dayData.profit)
          )}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Daily Journal</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  {getMotivationalMessage()}
                  {stats.currentStreak >= 3 && (
                    <span className="inline-flex items-center gap-1 text-orange-500">
                      <Flame className="w-3.5 h-3.5" />
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Mobile Stats Toggle */}
              <button
                onClick={() => setShowMobileStats(!showMobileStats)}
                className={cn(
                  "lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  "bg-card border border-border hover:bg-muted/50",
                  showMobileStats && "bg-primary/10 border-primary/30 text-primary"
                )}
              >
                <Zap className="w-4 h-4" />
                <span>Stats</span>
              </button>

              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    "bg-card border border-border hover:bg-muted/50",
                    isFilterOpen && "border-primary/30 ring-2 ring-primary/10"
                  )}
                >
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="hidden sm:inline text-foreground">
                    {filterOptions.find(f => f.value === selectedFilter)?.label || 'Filter'}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isFilterOpen && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-1.5">
                        {filterOptions.map((option) => {
                          const Icon = option.icon;
                          const isActive = selectedFilter === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedFilter(option.value);
                                setIsFilterOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                                isActive 
                                  ? "bg-primary/10 text-primary" 
                                  : "text-foreground hover:bg-muted/50"
                              )}
                            >
                              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                              <span className="font-medium">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Calendar Button */}
              <div className="relative" ref={calendarRef}>
                <button
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    "bg-card border border-border hover:bg-muted/50",
                    isCalendarOpen && "border-primary/30 ring-2 ring-primary/10",
                    selectedStartDate && selectedEndDate && "bg-primary/10 border-primary/30"
                  )}
                >
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="hidden sm:inline text-foreground">
                    {selectedStartDate && selectedEndDate 
                      ? `${selectedStartDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${selectedEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                      : 'Date Range'
                    }
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isCalendarOpen && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {isCalendarOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-[300px] bg-card border border-border rounded-xl shadow-xl p-4 z-50"
                    >
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={handlePrevMonth}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-semibold text-foreground">
                          {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={handleNextMonth}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Weekday Headers */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                          <div key={i} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-profit" />
                          <span className="text-xs text-muted-foreground">Profit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-loss" />
                          <span className="text-xs text-muted-foreground">Loss</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={clearDateRange}
                          className="flex-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={applyDateRange}
                          disabled={!tempStartDate || !tempEndDate}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stats Panel */}
      <AnimatePresence>
        {showMobileStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-b border-border bg-muted/20"
          >
            <div className="p-4">
              <QuickStats dailyData={filteredDailyData} streak={stats.currentStreak} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* Trade Entries */}
        <div className="p-4 sm:p-6 min-h-screen">
          <JRContent dailyData={filteredDailyData} />
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block border-l border-border sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto bg-muted/10">
          <div className="p-5 space-y-4">
            {/* Period P&L Card */}
            <div className="bg-card border border-border rounded-2xl p-5 overflow-hidden relative">
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1",
                stats.totalPnL >= 0 ? "bg-gradient-to-r from-profit/50 via-profit to-profit/50" : "bg-gradient-to-r from-loss/50 via-loss to-loss/50"
              )} />
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Period</span>
                {stats.currentStreak >= 3 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                    <Flame className="w-3.5 h-3.5" />
                    {stats.currentStreak} streak
                  </span>
                )}
              </div>
              <div className={cn(
                "text-4xl font-bold tracking-tight mt-2",
                stats.totalPnL >= 0 ? "text-profit" : "text-loss"
              )}>
                {formatCurrencyValue(stats.totalPnL, currency, exchangeRate)}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-profit" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{stats.winners}</p>
                    <p className="text-[10px] text-muted-foreground">wins</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-loss/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-loss" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{stats.losers}</p>
                    <p className="text-[10px] text-muted-foreground">losses</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Calendar
                </h3>
                <div className="flex items-center gap-0.5">
                  <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <span className="text-xs font-medium text-muted-foreground px-2 min-w-[80px] text-center">
                    {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="h-6 flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const days = daysInMonth(selectedYear, selectedMonth);
                  const firstDay = firstDayOfMonth(selectedYear, selectedMonth);
                  const cells = [];

                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<div key={`e-${i}`} className="h-8" />);
                  }

                  for (let day = 1; day <= days; day++) {
                    const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                    const dayData = calendarData.find(d => d.date === dateStr);
                    
                    cells.push(
                      <div
                        key={day}
                        className={cn(
                          "h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-pointer",
                          dayData ? getHeatColor(dayData.profit) : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {day}
                      </div>
                    );
                  }

                  return cells;
                })()}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-profit" />
                  <span className="text-[10px] text-muted-foreground">Profit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-loss" />
                  <span className="text-[10px] text-muted-foreground">Loss</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <QuickStats dailyData={filteredDailyData} streak={stats.maxStreak} />

            {/* Best Streak Card */}
            {stats.maxStreak >= 2 && (
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">Best Streak: {stats.maxStreak} wins</p>
                    <p className="text-xs text-muted-foreground">Keep pushing your limits!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyJournal;
