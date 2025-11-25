'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import DashWidgets from "../dashboard-widgets/DashboardWidget";
import PnLDailyChart from "./Graphs/PnLDailyChart";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


// Stores
import useAccountDetails from '@/store/accountdetails';
import calendarPopUp from '@/store/calendarPopUp';

// Functions
import { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance } from '@/utils/dashboard-calculations/dashboardCalculations';
import TradesWidget from '../TradesWidget';
import { Key } from 'lucide-react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';

interface TradeData {
  date: string;
  Profit: number;
  [Key : string]: any;
}

interface Account {
  tradeData?: TradeData[];
  [Key : string]: any;
}

interface DayData {
  date: string;
  trades: TradeData[];
  profit: number;
  tradeLength: number;
  [Key : string]: any;
}

interface Trade {
  date: string;
  Profit: number;
  [Key : string]: any;
  // Add other trade properties as needed
}

interface GroupedTrade {
  date: string;
  trades: Trade[];
  profit: number;
  tradeLength: number;
  [Key : string]: any;
}


const DashboardWeek: React.FC = () => {
  const { setShowTr, setDataDate } = calendarPopUp();
  const { selectedAccounts } = useAccountDetails();

  const groupedTrades = selectedAccounts.flatMap((acc: Account) => acc.tradeData)
    .reduce((acc: { [key: string]: GroupedTrade }, trade: Trade) => {
      if (!acc[trade.date]) acc[trade.date] = { date: trade.date, trades: [], profit: 0, tradeLength: 0 };

      acc[trade.date].trades.push(trade);
      acc[trade.date].profit += trade.Profit;
      acc[trade.date].tradeLength += 1;

      return acc;
    }, {});

  const calendarData = Object.values(groupedTrades);

  // State management
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [showMonthOptions, setShowMonthOptions] = useState<boolean>(false);
  const [showYearOptions, setShowYearOptions] = useState<boolean>(false);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const selectedYearRef = useRef<HTMLDivElement>(null);
  const selectedMonthRef = useRef<HTMLDivElement>(null);

  // Helper function to get day data
  const getDayData = (date: Date | null): GroupedTrade | null => {
    if (!date) return null;
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return calendarData.find(item => item.date === formattedDate) || null;
  };

  // Function to get all weeks in a month
  const getWeeksInMonth = (date: Date): (Date | null)[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    let currentDate = new Date(firstDay);

    // Adjust to start week on Sunday
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }

    while (currentDate <= lastDay) {
      currentWeek.push(new Date(currentDate));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  // Calculate weeks in current month
  const weeks = useMemo(() => getWeeksInMonth(currentDate), [currentDate]);

  // Set initial week to current week
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(() => {
    const today = new Date();
    const weekIndex = weeks.findIndex(week =>
      week.some(day => day && day.getDate() === today.getDate())
    );
    return weekIndex !== -1 ? weekIndex : 0;
  });

  // Current week data
  const currentWeek = weeks[currentWeekIndex] || [];
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Data for the current week only
  const thisWeekData = useMemo(() => {
    return currentWeek
      .map(date => getDayData(date))
      .filter(Boolean) as GroupedTrade[];
  }, [currentWeek]);

  // Flatten all trades from all days into a single array
  const allTrades = useMemo(() => {
    return thisWeekData.flatMap(day => day.trades);
  }, [thisWeekData]);

  // Calculate total profit for the week
  const weeklyProfit = useMemo(() => {
    return thisWeekData.reduce((total, day) => total + day.profit, 0);
  }, [thisWeekData]);

  // Navigation handlers
  const handlePrevWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    } else {
      // Move to previous month
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
      // Move to next month
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

  const handleDateSelect = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setCurrentDate(newDate);
    setCurrentWeekIndex(0);
    setShowDatePicker(false);
  };

  // PNL data (cumulative)
  const calculateCumulativePNL = () => {
    const cumulativePNL = [{ time: "", value: 0 }];
    let runningTotal = 0;

    const dailySums: { [key: string]: number } = {};

    thisWeekData.forEach(day => {
      const date = day.date;
      dailySums[date] = (dailySums[date] || 0) + day.profit;
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

  // Scroll to selected year/month
  useEffect(() => {
    if (showYearOptions && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showYearOptions]);

  useEffect(() => {
    if (showMonthOptions && selectedMonthRef.current) {
      selectedMonthRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showMonthOptions]);

  const metrics = calculateRiskRewardRatio(allTrades);

  return (
    <div className="w-full h-auto flex flex-col mt-6 rounded-[25px] border border-white/35 border-r-white/20 border-l-white/20">
      {/* Dashboard Widgets */}
      <DashWidgets
        data={PNLcumulative}
        pnl={parseFloat(allTrades.reduce((sum, trade) => sum + (trade.Profit || 0), 0).toFixed(2))}
        winrate={parseFloat(((allTrades.filter(trade => trade.Profit > 0).length / allTrades.length * 100) || 0).toFixed(2))}
        winners={allTrades.filter(t => t.Profit > 0).length}
        losers={allTrades.filter(t => t.Profit < 0).length}
        profitF={calculateProfitFactor(allTrades)}
        avgProfits={parseFloat(metrics.avgWin)}
        avgLoses={parseFloat(metrics.avgLoss)}
        rrRatio={metrics.rrRatio}
        accBal={parseFloat(calculateBalance(selectedAccounts).toFixed(2))}
        totalProfits={0} // Add appropriate value
        totalLoses={0} // Add appropriate value
      />

      {/* Part next to widgets */}
      <div className="w-full max-w-[1710px] h-auto flex items-start justify-center mx-auto">
        
        {/* Calendar Component */}
        <div className="w-3/5 max-w-[930px] h-auto flex flex-col bg-gray-500/15 backdrop-blur-md rounded-xl mt-5 ml-2.5 p-2.5 pb-2.5 border-b border-white/20 shadow-lg">
          <div className="flex justify-between items-center mb-4 cursor-pointer">
            <button 
              className="bg-[#7c51e1] border-none rounded-[8px] text-xl cursor-pointer text-white-600 p-1"
              onClick={handlePrevWeek}
            >
              <FontAwesomeIcon icon={faCaretLeft} className="w-5 h-5" />
            </button>
            <h1 
              className="m-0 text-2xl text-white cursor-pointer" 
              onClick={toggleDatePicker}
            >
              {currentMonth} {currentYear} 
              <ChevronDownIcon className="w-3 h-3 inline-block -mt-1 ml-1" />
            </h1>
            <span className="w-20 absolute text-sm left-15 font-poppins bg-gray-600 px-1.5 py-0.5 rounded-3xl text-white text-center">
              WEEK {currentWeekIndex + 1}
            </span>
            <button 
              className="bg-[#7c51e1] border-none rounded-[8px] text-xl cursor-pointer text-white-600 p-1" 
              onClick={handleNextWeek}
            >
              <FontAwesomeIcon icon={faCaretRight} className="w-5 h-5" />
            </button>
          </div>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute top-40 bg-gray-800 rounded-lg p-4 z-50 shadow-lg border border-gray-600">
              <div className="flex gap-4 mb-4">
                {/* Month Dropdown */}
                <div className="relative">
                  <div 
                    className="bg-gray-700 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-white min-w-32"
                    onClick={() => setShowMonthOptions(!showMonthOptions)}
                  >
                    {monthNames[selectedMonth]}
                    <ChevronDownIcon className="w-3 h-3" />
                  </div>
                  {showMonthOptions && (
                    <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 w-40">
                      {monthNames.map((month, idx) => (
                        <div
                          key={idx}
                          ref={selectedMonth === idx ? selectedMonthRef : null}
                          className={`px-3 py-2 cursor-pointer text-white hover:bg-gray-600 ${
                            selectedMonth === idx ? 'bg-purple-600' : ''
                          }`}
                          onClick={() => {
                            setSelectedMonth(idx);
                            setShowMonthOptions(false);
                          }}
                        >
                          {month}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Year Dropdown */}
                <div className="relative">
                  <div 
                    className="bg-gray-700 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-white min-w-20"
                    onClick={() => setShowYearOptions(!showYearOptions)}
                  >
                    {selectedYear}
                    <ChevronDownIcon className="w-3 h-3" />
                  </div>
                  {showYearOptions && (
                    <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 w-24">
                      {Array.from({ length: 131 }, (_, i) => 1970 + i).map((year) => (
                        <div
                          key={year}
                          ref={selectedYear === year ? selectedYearRef : null}
                          className={`px-3 py-2 cursor-pointer text-white hover:bg-gray-600 ${
                            selectedYear === year ? 'bg-purple-600' : ''
                          }`}
                          onClick={() => {
                            setSelectedYear(year);
                            setShowYearOptions(false);
                          }}
                        >
                          {year}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button 
                className="bg-purple-600 text-white border-none px-3 py-2 rounded cursor-pointer hover:bg-purple-700 w-full"
                onClick={handleDateSelect}
              >
                Select
              </button>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="w-full max-w-[900px] mx-auto rounded-xl font-sans flex flex-row justify-center">
            <div className="w-[95%] h-auto grid grid-cols-7 gap-1.5">
              {/* Day Headers */}
              <div className="text-center font-bold text-white py-2">Sun</div>
              <div className="text-center font-bold text-white py-2">Mon</div>
              <div className="text-center font-bold text-white py-2">Tue</div>
              <div className="text-center font-bold text-white py-2">Wed</div>
              <div className="text-center font-bold text-white py-2">Thu</div>
              <div className="text-center font-bold text-white py-2">Fri</div>
              <div className="text-center font-bold text-white py-2">Sat</div>

              {/* Calendar Cells */}
              {currentWeek.map((date, index) => {
                const dayData = date ? getDayData(date) : null;
                const dayClass = date ? 
                  (dayData ? 
                    (dayData.profit >= 0 ? 'bg-green-500/30 text-green-300' : 'bg-red-400/30 text-red-400') : 
                    'bg-gray-500/20 text-white'
                  ) : 
                  'bg-transparent border-none h-20';

                return (
                  <div
                    key={index}
                    className={`text-center border-none relative cursor-pointer flex flex-col justify-center items-center h-20 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-gray-500/55 hover:filter hover:saturate-160 ${dayClass}`}
                    onClick={() => handleDateClick(date)}
                  >
                    {date ? (
                      <>
                        <div className="text-base font-bold">{date.getDate()}</div>
                        {dayData && (
                          <>
                            <div className="text-sm mt-1">
                              ${new Intl.NumberFormat('en', {
                                notation: "compact",
                                compactDisplay: "short",
                                maximumFractionDigits: 1
                              }).format(dayData.profit)}
                            </div>
                            <div className="text-xs mt-1 opacity-80">
                              {dayData.tradeLength} trade{dayData.tradeLength !== 1 ? 's' : ''}
                            </div>
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trades Widget and Chart */}
        <div className="w-2/5 h-auto flex flex-col items-center justify-end font-inter lg:max-2xl:w-[calc(100%-950px)]">
          <PnLDailyChart data={PNLcumulative} />
          <TradesWidget data={allTrades} />
        </div>
      </div>
    </div>
  );
};

export default DashboardWeek;