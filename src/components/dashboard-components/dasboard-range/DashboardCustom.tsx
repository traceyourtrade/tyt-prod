'use client';

import { useMemo, useState } from "react";
import DashWidgets from "../dashboard-widgets/DashboardWidget";
import Calendar from "../Calendar";
import PnLDailyChart from "./Graphs/PnLDailyChart";
// Stores
import useAccountDetails from '@/store/accountdetails';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faArrowRightArrowLeft, faPenClip, faRightLeft } from '@fortawesome/free-solid-svg-icons';

// Functions 
import { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance } from '@/utils/dashboard-calculations/dashboardCalculations';
import TradesWidget from "../TradesWidget";


interface TradeData {
  date: string;
  Profit: number;
  time?: string;
  Item?: string;
}

interface Account {
  tradeData?: TradeData[];
}

interface ProcessedData {
  time: string;
  value: number;
}

interface Metrics {
  pnl: string;
  winrate: number;
  totalWins: number;
  totalLosses: number;
  profitF: number | string;
  rr: number;
}

const DashboardCustom: React.FC = () => {
  // Calendar state
  const [blurBg, setBlurBg] = useState<boolean>(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [activeStartDate, setActiveStartDate] = useState<Date | null>(null);
  const [activeEndDate, setActiveEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [currentYearLeft, setCurrentYearLeft] = useState<number>(new Date().getFullYear());
  const [currentYearRight, setCurrentYearRight] = useState<number>(new Date().getFullYear());
  const [currentMonthLeft, setCurrentMonthLeft] = useState<number>(new Date().getMonth() - 1);
  const [currentMonthRight, setCurrentMonthRight] = useState<number>((new Date().getMonth()) % 12);
  const [fromDate, setFromDate] = useState<string>("From Date");
  const [toDate, setToDate] = useState<string>("To Date");
  const today = new Date();

  // Get accounts data
  const { selectedAccounts } = useAccountDetails();

  // Extract and sort all trades (oldest to newest)
  const extractTradeData = (accounts: Account[]): Trade[] => {
    const allTrades = accounts.flatMap(account => account.tradeData || []);
    return allTrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Process data for the chart
  const processTradeData = (trades: Trade[]): ProcessedData[] => {
    let cumulativeProfit = 0;
    const profitByDate: { [key: string]: number } = {};

    trades.forEach(trade => {
      profitByDate[trade.date] = (profitByDate[trade.date] || 0) + (trade.Profit || 0);
    });

    return [
      { time: "", value: 0 },
      ...Object.entries(profitByDate).map(([date, profit]) => {
        cumulativeProfit += profit;
        return { time: date, value: parseFloat(cumulativeProfit.toFixed(2)) };
      })
    ];
  };

  // Calculate metrics for DashWidgets
  const calculateMetrics = (trades: Trade[]) => {
    if (!trades?.length) return { pnl: 0, winrate: 0, totalWins: 0, totalLosses: 0, profitF: "-" };

    let grossWin = 0;
    let grossLoss = 0;

    trades.forEach(trade => {
      const profit = trade.Profit;
      if (profit > 0) {
        grossWin += profit;
      } else {
        grossLoss += Math.abs(profit);
      }
    });

    const pnl = trades.reduce((sum, trade) => sum + (trade.Profit || 0), 0).toFixed(2);

    const winrate = parseInt((trades.filter(trade => trade.Profit > 0).length / trades.length * 100 || 0).toFixed(2));
    const totalWins = trades.filter(t => t.Profit > 0).length;
    const totalLosses = trades.filter(t => t.Profit < 0).length;

    const profitF = (grossLoss === 0 && grossWin === 0) ? "-" : grossLoss === 0 ? Infinity : grossWin / grossLoss;

    // RR ratio
    let profitSum = 0;
    let lossSum = 0;
    let profitCount = 0;
    let lossCount = 0;

    trades.forEach(trade => {
      const profit = trade.Profit;
      if (profit > 0) {
        profitSum += profit;
        profitCount++;
      } else if (profit < 0) {
        lossSum += Math.abs(profit);
        lossCount++;
      }
    });

    const avgProfit = profitCount > 0 ? profitSum / profitCount : 0;
    const avgLoss = lossCount > 0 ? lossSum / lossCount : 0;

    const rr = avgLoss === 0 ? 0 : avgProfit / avgLoss;

    return { pnl: parseFloat(pnl), winrate, totalWins, totalLosses, profitF, rr };
  };

  // Get all trades (sorted)
  const allTrades = useMemo(() => extractTradeData(selectedAccounts), [selectedAccounts]);

  // Filter trades by date range when selected
  const filterTradesByDate = (start: Date | null, end: Date | null): Trade[] => {
    if (!start || !end) return allTrades;

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Set time to beginning of start date and end of end date
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return allTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= startDate && tradeDate <= endDate;
    });
  };

  // Determine which trades to display
  const displayTrades = useMemo(() => 
    activeStartDate && activeEndDate
      ? filterTradesByDate(activeStartDate, activeEndDate)
      : allTrades,
    [activeStartDate, activeEndDate, allTrades]
  );

  // Prepare data for display
  const displayData = useMemo(() => {
    const processedData = processTradeData(displayTrades);
    const metrics = calculateMetrics(displayTrades);
    return {
      segData: displayTrades,
      processedData,
      metrics
    };
  }, [displayTrades]);

  // Handle date selection
  const handleDateClick = (day: number | null, month: number, year: number) => {
    if (day === null) return;
    const date = new Date(year, month, day);
    if (date > today) return;

    if (tempStartDate && !tempEndDate && date.getTime() === tempStartDate.getTime()) {
      setTempStartDate(null);
      setHoverDate(null);
      setFromDate("From Date");
    } else if (tempStartDate && tempEndDate && (date.getTime() === tempStartDate.getTime() || date.getTime() === tempEndDate.getTime())) {
      setTempStartDate(null);
      setTempEndDate(null);
      setHoverDate(null);
      setFromDate("From Date");
      setToDate("To Date");
    } else if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(date);
      setFromDate(new Date(date.toDateString()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/(\w{2,3}) (\d{1,2}) (\d{4})/, '$2 $1, $3'));
      setTempEndDate(null);
      setHoverDate(null);
      setToDate("To Date");
    } else if (!tempEndDate && date >= tempStartDate) {
      setTempEndDate(date);
      setToDate(new Date(date.toDateString()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/(\w{2,3}) (\d{1,2}) (\d{4})/, '$2 $1, $3'));
    }
  };

  // Handle select button click
  const handleSelect = () => {
    if (tempStartDate && tempEndDate) {
      setActiveStartDate(tempStartDate);
      setActiveEndDate(tempEndDate);
      setBlurBg(false);
    }
  };

  // Handle calendar range hover
  const isInRange = (day: number | null, month: number, year: number): boolean => {
    if (!tempStartDate || day === null) return false;
    const date = new Date(year, month, day);
    return tempEndDate
      ? date >= tempStartDate && date <= tempEndDate
      : !!hoverDate && date > tempStartDate && date <= hoverDate;
  };

  const handleHover = (day: number | null, month: number, year: number) => {
    if (day === null) return;
    if (tempStartDate && !tempEndDate) {
      const date = new Date(year, month, day);
      if (date <= today) {
        setHoverDate(date);
      }
    }
  };

  const generateCalendar = (year: number, month: number): (number | null)[] => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  // Check if a date is selected (for purple background)
  const isSelectedDate = (day: number | null, month: number, year: number): boolean => {
    if (day === null) return false;
    const date = new Date(year, month, day);
    return (
      (tempStartDate && date.getTime() === tempStartDate.getTime()) ||
      (tempEndDate && date.getTime() === tempEndDate.getTime())
    );
  };

  const metrics = calculateRiskRewardRatio(displayData.segData);

  return (
    <div className="w-full h-auto flex flex-col mt-6 rounded-[25px] border border-white/35 border-r-white/20 border-l-white/20 relative">
      {/* Calendar UI */}
      {blurBg && (
        <div className="w-full h-auto flex flex-col items-center justify-start mt-5 absolute z-20 top-17">
          <div className="w-auto h-auto flex flex-col items-center justify-evenly bg-gray-600/50 backdrop-blur-xl text-gray-300 p-2.5 rounded-xl shadow-lg">
            <div className="flex gap-5 justify-center items-start flex-wrap font-poppins">
              {[
                { year: currentYearLeft, setYear: setCurrentYearLeft, month: currentMonthLeft, setMonth: setCurrentMonthLeft, heading: fromDate },
                { year: currentYearRight, setYear: setCurrentYearRight, month: currentMonthRight, setMonth: setCurrentMonthRight, heading: toDate }
              ].map(({ year, setYear, month, setMonth, heading }, index) => (
                <div key={index} className="w-75 min-h-66 p-1.25 rounded-lg">
                  <h2 className="text-sm font-semibold text-center text-white">{heading}</h2>
                  <div className="flex justify-between mb-2">
                    <select 
                      className="appearance-none bg-purple-500/50 text-white border-none rounded-3xl px-1 py-0.75 text-xs cursor-pointer outline-none w-37 mr-2.5 mt-2.5 bg-[url('https://upload.wikimedia.org/wikipedia/commons/9/96/Chevron-icon-drop-down-menu-WHITE.png')] bg-no-repeat bg-[right_10px_center] bg-[length:10px] relative top-0.5"
                      value={year} 
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 131 }, (_, i) => 1970 + i).map((y) => (
                        <option key={y} value={y} className="bg-gray-200 text-black text-xs rounded-lg border-none cursor-pointer transition-all duration-500">{y}</option>
                      ))}
                    </select>
                    <select 
                      value={month} 
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                      className="px-1.25 py-0.75 text-xs border border-gray-300 rounded outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                        <option key={m} value={m}>{new Date(0, m).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div key={d} className="font-bold text-white text-sm py-0.5">{d}</div>
                    ))}
                    {generateCalendar(year, month).map((day, index) => {
                      const date = day ? new Date(year, month, day) : null;
                      const isDisabled = date && date > today;
                      const isSelected = isSelectedDate(day, month, year);
                      const inRange = isInRange(day, month, year);
                      
                      return (
                        <div
                          key={index}
                          className={`p-2 cursor-pointer rounded transition-all duration-300 text-sm
                            ${day === null ? "empty" : ""} 
                            ${isSelected ? "bg-purple-600/70 text-white hover:bg-purple-600/70" : ""}
                            ${inRange ? "bg-gray-300 text-gray-800" : ""}
                            ${isDisabled ? "text-gray-500/70 pointer-events-none bg-transparent border border-gray-500/70" : "hover:bg-gray-400 hover:text-gray-900"}
                            ${!isSelected && !inRange && !isDisabled ? "text-white" : ""}
                          `}
                          onClick={() => date && !isDisabled && handleDateClick(day, month, year)}
                          onMouseEnter={() => date && !isDisabled && handleHover(day, month, year)}
                        >
                          {day || ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button
              className="w-25 h-auto mx-auto mt-1 mb-2.5 px-3 py-2 border-none bg-purple-500/50 text-white cursor-pointer rounded transition-all duration-300 hover:bg-purple-600/70 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSelect}
              disabled={!tempStartDate || !tempEndDate}
            >
              Select
            </button>
          </div>
        </div>
      )}

      {/* Range Selector */}
      <div className="w-80 max-w-75 min-w-50 h-auto flex flex-row items-center justify-between p-3.75 shadow-lg bg-white rounded mx-3 my-5 font-inter transition-all duration-500 cursor-pointer hover:scale-102">
        <div onClick={() => setBlurBg(true)} className="w-full flex flex-row items-center justify-between">
          <FontAwesomeIcon icon={faCalendarDays} className="text-purple-600 relative top-0.75" />
          <span className="text-black">{fromDate}</span>
          <FontAwesomeIcon icon={faRightLeft} className="text-purple-600 relative top-0.75" />
          <span className="text-black">{toDate}</span>
          <FontAwesomeIcon icon={faPenClip} className="text-purple-600 relative top-0.75" />
        </div>
      </div>

      {/* Dashboard Widgets */}
      <DashWidgets
        data={displayData.processedData}
        pnl={displayData.metrics.pnl}
        winrate={displayData.metrics.winrate}
        winners={displayData.metrics.totalWins}
        losers={displayData.metrics.totalLosses}
        profitF={calculateProfitFactor(displayData.segData)}
        avgProfits={parseFloat(metrics.avgWin)}
        avgLoses={parseFloat(metrics.avgLoss)}
        rrRatio={metrics.rrRatio}
        accBal={parseFloat(calculateBalance(selectedAccounts).toFixed(2))}
        totalProfits={0}
        totalLoses={0}
      />

      {/* Main Content */}
      <div className="w-full max-w-[1710px] h-auto flex items-start justify-center mx-auto">
        <Calendar />
        
        <div className="w-2/5 h-auto flex flex-col items-center justify-end font-inter lg:max-2xl:w-[calc(100%-950px)]">
          <PnLDailyChart data={displayData.processedData} />
          <TradesWidget data={displayData.segData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCustom;