"use client"
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  Calendar, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Award,
  Star
} from "lucide-react";
import useAccountDetails from "@/store/accountdetails";
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

const AnimatedCounter = ({ value, prefix = "", suffix = "", className = "" }: { value: number; prefix?: string; suffix?: string; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(2)}{suffix}
    </span>
  );
};

const FloatingParticle = ({ delay, seed }: { delay: number; seed: number }) => {
  const xStart = ((seed * 13) % 100);
  const xEnd = ((seed * 17) % 100);
  
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-primary/30"
      style={{ left: `${xStart}%` }}
      initial={{ opacity: 0, y: 100 }}
      animate={{
        opacity: [0, 0.6, 0],
        y: [100, -100],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

const DailyJournal = () => {
  const { selectedAccounts } = useAccountDetails();
  
  const [dailyData, setDailyData] = useState<Trade[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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
    { value: 'all', label: 'All Trades', icon: Sparkles },
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

  const getHeatIntensity = (profit: number, trades: number) => {
    if (profit > 500) return "bg-profit text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]";
    if (profit > 100) return "bg-profit/70 text-white";
    if (profit > 0) return "bg-profit/40 text-profit";
    if (profit < -500) return "bg-loss text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]";
    if (profit < -100) return "bg-loss/70 text-white";
    if (profit < 0) return "bg-loss/40 text-loss";
    return "";
  };

  const getMotivationalMessage = () => {
    if (stats.currentStreak >= 5) return { text: "You're on fire! 🔥", color: "text-orange-400" };
    if (stats.winRate >= 70) return { text: "Trading machine! 🎯", color: "text-profit" };
    if (stats.winRate >= 50) return { text: "Keep it up! 💪", color: "text-primary" };
    if (stats.totalTrades === 0) return { text: "Ready to trade? ⚡", color: "text-muted-foreground" };
    return { text: "Stay focused! 🧠", color: "text-muted-foreground" };
  };

  const motivation = getMotivationalMessage();

  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDay = firstDayOfMonth(selectedYear, selectedMonth);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10 sm:h-12" />);
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
        <motion.button
          key={day}
          whileHover={{ scale: isDisabled ? 1 : 1.1, rotateZ: isDisabled ? 0 : 2 }}
          whileTap={{ scale: isDisabled ? 1 : 0.95 }}
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
          className={`
            h-10 sm:h-12 rounded-xl text-sm font-medium transition-all relative
            ${isDisabled ? 'text-muted-foreground/30 cursor-not-allowed' : 'cursor-pointer hover:bg-muted'}
            ${isSelected || isEnd ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
            ${isInRange ? 'bg-primary/20' : ''}
            ${dayData && !isSelected && !isEnd ? getHeatIntensity(dayData.profit, dayData.trades) : ''}
          `}
        >
          {day}
          {dayData && dayData.trades > 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
              {dayData.trades}
            </span>
          )}
        </motion.button>
      );
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} seed={i + 1} />
        ))}
      </div>

      {/* Celebration Effect */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'][i % 4],
                  left: `${(i * 2) % 100}%`,
                }}
                initial={{ y: -20, opacity: 1 }}
                animate={{
                  y: "100vh",
                  opacity: 0,
                  rotate: (i * 50) % 720,
                }}
                transition={{ duration: 2 + (i % 3) * 0.5, delay: (i % 10) * 0.05 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Toolbar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title with Motivation */}
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Daily Journal</h1>
                  <motion.p 
                    key={motivation.text}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm font-medium ${motivation.color}`}
                  >
                    {motivation.text}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Streak & Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Streak Badge */}
              {stats.currentStreak > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Flame className="w-4 h-4 text-orange-500" />
                  </motion.div>
                  <span className="text-sm font-bold text-orange-500">{stats.currentStreak}</span>
                </motion.div>
              )}

              {/* Mobile Stats Toggle */}
              <button
                onClick={() => setShowMobileStats(!showMobileStats)}
                className="lg:hidden flex items-center gap-2 px-3 py-2.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all hover:scale-105"
              >
                <Zap className="w-4 h-4 text-primary" />
                Stats
              </button>

              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all"
                >
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">
                    {filterOptions.find(f => f.value === selectedFilter)?.label || 'Filter'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      {filterOptions.map((option, i) => {
                        const Icon = option.icon;
                        return (
                          <motion.button
                            key={option.value}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => {
                              setSelectedFilter(option.value);
                              setIsFilterOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                              selectedFilter === option.value 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {option.label}
                            {selectedFilter === option.value && (
                              <motion.div
                                layoutId="filterCheck"
                                className="ml-auto w-2 h-2 rounded-full bg-primary"
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Calendar Button */}
              <div className="relative" ref={calendarRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all"
                >
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">
                    {selectedStartDate && selectedEndDate 
                      ? `${selectedStartDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${selectedEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                      : 'Date Range'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isCalendarOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-[320px] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 z-50"
                    >
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handlePrevMonth}
                          className="p-2 rounded-xl hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </motion.button>
                        <span className="text-sm font-semibold text-foreground">
                          {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleNextMonth}
                          className="p-2 rounded-xl hover:bg-muted transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </motion.button>
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
                      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-profit shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                          <span className="text-xs text-muted-foreground">Profit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-loss shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                          <span className="text-xs text-muted-foreground">Loss</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={clearDateRange}
                          className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                        >
                          Clear
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={applyDateRange}
                          disabled={!tempStartDate || !tempEndDate}
                          className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-primary to-purple-500 text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Apply
                        </motion.button>
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
            className="lg:hidden overflow-hidden border-b border-border/50"
          >
            <div className="p-4">
              <QuickStats dailyData={filteredDailyData} streak={stats.currentStreak} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        {/* Trade Entries */}
        <div className="p-4 sm:p-6 min-h-screen">
          <JRContent dailyData={filteredDailyData} onCelebrate={() => setShowCelebration(true)} />
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block border-l border-border/50 sticky top-[81px] h-[calc(100vh-81px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Performance Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Period</span>
                  {stats.currentStreak >= 3 && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full"
                    >
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-xs font-bold text-orange-500">{stats.currentStreak} streak</span>
                    </motion.div>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${stats.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {stats.totalPnL >= 0 ? '+' : ''}${Math.abs(stats.totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-profit" />
                    <span className="text-sm text-foreground">{stats.winners} wins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-loss" />
                    <span className="text-sm text-foreground">{stats.losers} losses</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mini Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Heat Map
                </h3>
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <span className="text-xs font-medium text-muted-foreground px-2">
                    {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="h-6 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
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
                      <motion.div
                        key={day}
                        whileHover={{ scale: 1.1 }}
                        className={`h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all cursor-pointer relative ${
                          dayData 
                            ? getHeatIntensity(dayData.profit, dayData.trades)
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {day}
                      </motion.div>
                    );
                  }

                  return cells;
                })()}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <QuickStats dailyData={filteredDailyData} streak={stats.currentStreak} />

            {/* Achievement Teaser */}
            {stats.maxStreak >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Best Streak: {stats.maxStreak} wins</p>
                    <p className="text-xs text-muted-foreground">Keep pushing your limits!</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyJournal;
