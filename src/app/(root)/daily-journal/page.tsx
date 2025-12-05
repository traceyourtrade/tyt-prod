"use client"
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  Calendar, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  X,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3
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

const DailyJournal = () => {
  const { selectedAccounts } = useAccountDetails();
  
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

  const groupedTrades = (selectedAccounts as Account[]).flatMap(acc => acc.tradeData || [])
    .reduce((acc: { [key: string]: { date: string; profit: number } }, trade) => {
      if (!acc[trade.date]) acc[trade.date] = { date: trade.date, profit: 0 };
      acc[trade.date].profit += trade.Profit;
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
    { value: 'profitHighToLow', label: 'Profit: High to Low', icon: TrendingUp },
    { value: 'profitLowToHigh', label: 'Profit: Low to High', icon: TrendingDown },
    { value: 'onlyProfit', label: 'Winners Only', icon: TrendingUp },
    { value: 'onlyLoss', label: 'Losers Only', icon: TrendingDown },
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
          whileHover={{ scale: isDisabled ? 1 : 1.05 }}
          whileTap={{ scale: isDisabled ? 1 : 0.95 }}
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
          className={`
            h-10 sm:h-12 rounded-xl text-sm font-medium transition-all relative
            ${isDisabled ? 'text-muted-foreground/30 cursor-not-allowed' : 'cursor-pointer hover:bg-muted'}
            ${isSelected || isEnd ? 'bg-primary text-primary-foreground' : ''}
            ${isInRange ? 'bg-primary/20' : ''}
            ${dayData && !isSelected && !isEnd ? dayData.profit > 0 ? 'bg-profit/20 text-profit' : dayData.profit < 0 ? 'bg-loss/20 text-loss' : '' : ''}
          `}
        >
          {day}
          {dayData && (
            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dayData.profit > 0 ? 'bg-profit' : 'bg-loss'}`} />
          )}
        </motion.button>
      );
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Toolbar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Daily Journal</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track and analyze your trades</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Stats Toggle */}
              <button
                onClick={() => setShowMobileStats(!showMobileStats)}
                className="lg:hidden flex items-center gap-2 px-3 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Target className="w-4 h-4 text-primary" />
                Stats
              </button>

              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">
                    {filterOptions.find(f => f.value === selectedFilter)?.label || 'Filter'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      {filterOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedFilter(option.value);
                              setIsFilterOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                              selectedFilter === option.value 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {option.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Calendar Button */}
              <div className="relative" ref={calendarRef}>
                <button
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">
                    {selectedStartDate && selectedEndDate 
                      ? `${selectedStartDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${selectedEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                      : 'Date Range'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCalendarOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-[320px] bg-card border border-border rounded-2xl shadow-xl p-4 z-50"
                    >
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={handlePrevMonth}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-semibold text-foreground">
                          {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={handleNextMonth}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
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
                      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-profit" />
                          <span className="text-xs text-muted-foreground">Profit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-loss" />
                          <span className="text-xs text-muted-foreground">Loss</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={clearDateRange}
                          className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={applyDateRange}
                          disabled={!tempStartDate || !tempEndDate}
                          className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="lg:hidden overflow-hidden border-b border-border"
          >
            <div className="p-4">
              <QuickStats dailyData={filteredDailyData} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        {/* Trade Entries */}
        <div className="p-4 sm:p-6 min-h-screen">
          <JRContent dailyData={filteredDailyData} />
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block border-l border-border sticky top-[81px] h-[calc(100vh-81px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Mini Calendar */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Calendar</h3>
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
                      <div
                        key={day}
                        className={`h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-pointer hover:bg-muted ${
                          dayData 
                            ? dayData.profit > 0 
                              ? 'bg-profit/20 text-profit' 
                              : 'bg-loss/20 text-loss'
                            : 'text-foreground'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  }

                  return cells;
                })()}
              </div>
            </div>

            {/* Quick Stats */}
            <QuickStats dailyData={filteredDailyData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyJournal;
