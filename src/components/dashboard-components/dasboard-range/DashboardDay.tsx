'use client';

import { useState, useMemo, useRef } from "react";
import React from "react";

import DashWidgets from "../dashboard-widgets/DashboardWidget";
import TradesWidget from "../TradesWidget";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretLeft, faCaretRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';

// Graphs
import PnLchartDaily from "./Graphs/PnLDailyChart";
import VeriticalBarGraph from "./Graphs/VerticalBarGraph";

// Stores
import useAccountDetails from '@/store/accountdetails';

// Functions
import { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance } from '@/utils/dashboard-calculations/dashboardCalculations';


interface TradeData {
  date: string;
  Profit: number;
  time: string;
  Item: string;
  OpenTime: string;
  Type: string;
}

interface Account {
  tradeData?: TradeData[];
}

interface DayData {
  date: string;
  trades: TradeData[];
  profit: number;
  tradeLength: number;
}
const DashboardDay: React.FC = () => {
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

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const today = formatDate(new Date());

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
          time: trade.time.slice(0, 5),
          value: parseFloat(cumulativeProfit.toFixed(2)),
          Item: trade.Item
        };
      })
    ];
  }, [todayData]);

  const nonCumulativeData = useMemo(() => [
    { time: "", value: 0, Item: "" },
    ...todayData.map(trade => ({
      time: trade.time.slice(0, 5),
      value: parseFloat(trade.Profit.toFixed(2)),
      Item: trade.Item,
    })),
  ], [todayData]);

  const winrate = todayData.length ? ((todayData.filter(t => t.Profit > 0).length / todayData.length) * 100).toFixed(2) : "0.00";

  // Calendar State
  const [CalendaShow, setCalendarShow] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [dropdownYear, setDropdownYear] = useState<boolean>(true);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);

  const getBackgroundClass = (profit: number) => {
    if (profit > 0) return "bg-green-500/30 text-green-300";
    if (profit < 0) return "bg-red-400/30 text-red-400";
    return "bg-transparent";
  };

  const yearContainerRef = useRef<HTMLDivElement>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();

    const calendarCells: JSX.Element[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(
        <div key={`empty-${i}`} className="text-center border-none bg-transparent h-20"></div>
      );
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1)
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find((d) => d.date === dateStr);

      calendarCells.push(
        <div
          key={day}
          className={`text-center border-none relative cursor-pointer flex flex-col justify-center items-center h-20 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-gray-500/55 hover:filter hover:saturate-160 ${
            dayData ? getBackgroundClass(dayData.profit) : "bg-gray-500/20 text-white"
          }`}
          onClick={() => {
            setSelectedDate(`${selectedYear}-${(selectedMonth + 1)
              .toString()
              .padStart(2, "0")}-${day.toString().padStart(2, "0")}`);
            setCalendarShow(false);
          }}
        >
          <div className="text-base font-bold">{day}</div>
        </div>
      );
    }

    return calendarCells;
  };

  const handleYearMonthClick = () => {
    setIsDropdownVisible((prev) => !prev);
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setIsDropdownVisible(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setDropdownYear(true);
  };

  const handlePrevMonth = () => {
    setIsDropdownVisible(false);
    if (selectedMonth === 0) {
      setSelectedYear((prevYear) => prevYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((prevMonth) => prevMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setIsDropdownVisible(false);
    if (selectedMonth === 11) {
      setSelectedYear((prevYear) => prevYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((prevMonth) => prevMonth + 1);
    }
  };

  const metrics = calculateRiskRewardRatio(todayData);

  return (
    <div className="w-full h-auto flex flex-col">
      {/* Dashboard Widgets */}
      <DashWidgets
        data={data}
        pnl={parseFloat(todayData.reduce((total, { Profit }) => total + Profit, 0).toFixed(2))}
        winrate={parseFloat(winrate)}
        winners={todayData.filter(t => t.Profit > 0).length}
        losers={todayData.filter(t => t.Profit < 0).length}
        profitF={calculateProfitFactor(todayData)}
        avgProfits={parseFloat(metrics.avgWin)}
        avgLoses={parseFloat(metrics.avgLoss)}
        rrRatio={metrics.rrRatio}
        accBal={parseFloat(calculateBalance(selectedAccounts).toFixed(2))}
        totalProfits={0}
        totalLoses={0}
      />

      {/* Part next to widgets */}
      <div className="w-full h-auto flex items-start justify-center mx-auto">
        {/* Calendar */}
        <div className="w-3/5 h-auto flex flex-col bg-gray-500/15 backdrop-blur-md rounded-xl mt-5 ml-2.5 p-2.5 pb-2.5 border-b border-white/20 shadow-lg">
          <div className="min-h-25">
            <h1 className="text-gray-300 text-lg ml-5 mt-2.5 font-inter font-semibold">TRADE DETAILS</h1>

            <div className="w-75 h-auto flex items-center justify-center text-white font-inter absolute right-0 top-2.5">
              <button 
                className="bg-[#343434] backdrop-blur-xl text-white border-none px-2.5 py-1.5 text-[12px] rounded cursor-pointer mx-2.5" 
                onClick={() => changeDate(-1)}
              >
                <FontAwesomeIcon icon={faCaretLeft} className="w-4 h-4" />
              </button>
              <p 
                className="px-3 py-1 rounded-[25px] cursor-pointer text-sm bg-[#1593846e] text-[#1593846e] font-inter mx-2.5"
                onClick={() => setCalendarShow(!CalendaShow)}
              >
                {new Date(selectedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                <FontAwesomeIcon icon={faCaretDown} className="w-3 h-3 inline-block ml-1" />
              </p>
              <button
                className="bg-[#343434] backdrop-blur-xl text-white border-none px-2.5 py-1.5 text-sm rounded cursor-pointer mx-2.5"
                onClick={() => changeDate(1)}
                style={{ 
                  cursor: selectedDate === today ? "not-allowed" : "pointer", 
                  opacity: selectedDate === today ? 0.5 : 1 
                }}
              >
                <FontAwesomeIcon icon={faCaretRight} className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Dropdown */}
          {CalendaShow && (
            <div className="absolute top-40 bg-gray-800 rounded-xl p-4 z-50 shadow-xl border border-gray-600 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <button 
                  className="bg-purple-600 text-white border-none px-2.5 py-1.5 text-sm rounded cursor-pointer mx-2.5 hover:bg-purple-700"
                  onClick={handlePrevMonth}
                >
                  <FontAwesomeIcon icon={faCaretLeft} className="w-4 h-4" />
                </button>

                <h1 
                  className="m-0 text-xl text-white cursor-pointer font-inter"
                  onClick={handleYearMonthClick}
                >
                  {new Date(selectedYear, selectedMonth).toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {selectedYear}
                </h1>

                <button 
                  className="bg-purple-600 text-white border-none px-2.5 py-1.5 text-sm rounded cursor-pointer mx-2.5 hover:bg-purple-700"
                  onClick={handleNextMonth}
                >
                  <FontAwesomeIcon icon={faCaretRight} className="w-4 h-4" />
                </button>
              </div>

              {isDropdownVisible && (
                <div className="absolute top-20 bg-[#343434] rounded-lg p-4 z-50 shadow-lg w-64">
                  <div className="flex items-center justify-center mb-4">
                    <p 
                      className="w-24 h-auto flex flex-row items-center justify-center cursor-pointer font-inter text-sm text-white"
                      onClick={() => setDropdownYear((prev) => !prev)}
                    >
                      {dropdownYear ? selectedYear : new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long" })}
                      <FontAwesomeIcon icon={faCaretDown} className="w-3 h-3 ml-2" />
                    </p>
                  </div>

                  {dropdownYear ? (
                    <div className="grid grid-cols-3 gap-2 my-2.5">
                      {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                        <div
                          key={month}
                          className={`p-2.5 text-center rounded-lg cursor-pointer transition-all duration-200 bg-gray-600 text-white hover:bg-blue-50 hover:text-blue-600 hover:scale-105 ${
                            month === selectedMonth ? "bg-purple-600 text-white" : ""
                          }`}
                          onClick={() => handleMonthSelect(month)}
                        >
                          {new Date(0, month).toLocaleString("default", { month: "long" })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="grid grid-cols-3 gap-2 my-4 mb-3 max-h-44 overflow-y-auto"
                      ref={yearContainerRef}
                    >
                      {Array.from({ length: 2100 - 1970 + 1 }, (_, i) => 1970 + i).map((year) => (
                        <div
                          key={year}
                          className={`p-2 text-center rounded-lg cursor-pointer bg-gray-600 text-white text-sm hover:bg-blue-50 hover:text-blue-600 ${
                            year === selectedYear ? "bg-purple-600 text-white" : ""
                          }`}
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="w-full h-auto flex flex-col items-center justify-center mt-2">
                    <button 
                      className="w-18 h-auto py-1.5 bg-purple-600 border-none outline-none text-white rounded-xl text-xs font-semibold font-inter cursor-pointer transition-all duration-500 hover:bg-purple-400"
                      onClick={() => setIsDropdownVisible(false)}
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}

              <div className="w-full max-w-[900px] mx-auto rounded-xl font-sans flex flex-row justify-center mt-4">
                <div className="w-[95%] h-auto grid grid-cols-7 gap-1.5">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center font-bold text-white py-2 text-sm">
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Day Widgets */}
          <div className="w-full min-h-25 h-auto flex flex-col">
            {/* Trades widget */}
            <div className="w-full h-auto flex flex-row items-center justify-between font-inter">
              <div className="w-[47%] h-auto min-h-50 bg-[#343434] rounded-3xl mt-5 ml-2.5">
                <PnLchartDaily data={data} />
              </div>

              <div className="w-[47%] h-50 rounded-3xl mt-5 mr-2.5 flex flex-row flex-wrap items-center justify-evenly">
                <div className="w-[45%] h-22 bg-[#343434] rounded-3xl">
                  <p className="text-gray-300 text-center text-sm mt-3.5 font-semibold">Total Trades</p>
                  <span className="block text-base font-semibold text-center text-white mt-2">{todayData.length}</span>
                </div>
                <div className="w-[45%] h-22 bg-[#343434] rounded-3xl">
                  <p className="text-gray-300 text-center text-sm mt-3.5 font-semibold">Pair of the Day</p>
                  <span className="block text-base font-semibold text-center text-white mt-2">
                    {(todayData.length === 0) ? "-" : todayData.reduce((max, trade) => trade.Profit > max.Profit ? trade : max, todayData[0]).Item}
                  </span>
                </div>
                <div className="w-[45%] h-22 bg-[#343434] rounded-3xl">
                  <p className="text-gray-300 text-center text-sm mt-3.5 font-semibold">Max Drawdown</p>
                  <span className="block text-base font-semibold text-center text-red-400 mt-2">
                    {(todayData.length === 0) ? 0 : `-$${Math.abs(todayData.reduce((min, trade) => trade.Profit < min.Profit ? trade : min, todayData[0]).Profit)}`}
                  </span>
                </div>
                <div className="w-[45%] h-22 bg-[#343434] rounded-3xl">
                  <p className="text-gray-300 text-center text-sm mt-3.5 font-semibold">Trade Confidence</p>
                  <span className="block text-base font-semibold text-center text-white mt-2"></span>
                </div>
              </div>
            </div>

            {/* Trades data */}
            <div className="w-full h-auto flex flex-col items-start justify-between font-inter">
              <h1 className="text-gray-300 text-lg ml-5 mt-2.5 font-inter font-semibold">Trades</h1>
              <div className="w-[90%] overflow-x-auto mx-auto my-2.5">
                <table className="w-full border-collapse rounded-3xl overflow-hidden">
                  <thead className="bg-purple-500/50">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left text-sm text-white font-semibold">OPEN TIME</th>
                      <th className="px-3.5 py-2.5 text-left text-sm text-white font-semibold">SYMBOL</th>
                      <th className="px-3.5 py-2.5 text-left text-sm text-white font-semibold">LONG / SHORT</th>
                      <th className="px-3.5 py-2.5 text-left text-sm text-white font-semibold">NET P&L</th>
                      <th className="px-3.5 py-2.5 text-left text-sm text-white font-semibold">NET ROI</th>
                      <th className="px-3.5 py-2.5 text-left text-sm text-white font-semibold">RR RATIO</th>
                    </tr>
                  </thead>

                  {todayData.length === 0 ? (
                    <tbody>
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <span className="font-inter font-semibold text-white">No trades yet</span>
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      {todayData.map((data, index) => (
                        <tr key={index} className="border-b border-gray-600">
                          <td className="px-3.5 py-2.5 text-white text-sm">{data.OpenTime}</td>
                          <td className="px-3.5 py-2.5">
                            <span className="px-2.5 py-1.25 bg-white text-black rounded-3xl text-xs relative -left-1.25">
                              {data.Item}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-white text-sm">{data.Type}</td>
                          <td className={`px-3.5 py-2.5 text-sm font-semibold ${
                            data.Profit < 0 ? "text-red-400" : "text-green-400"
                          }`}>
                            {data.Profit < 0 ? `-$${Math.abs(data.Profit)}` : `$${data.Profit}`}
                          </td>
                          <td className="px-3.5 py-2.5 text-white text-sm">NET ROI</td>
                          <td className="px-3.5 py-2.5 text-white text-sm">RR RATIO</td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Trades Widget and Chart */}
        <div className="w-2/5 h-auto flex flex-col items-center justify-end font-inter lg:max-2xl:w-[calc(100%-950px)]">
          <VeriticalBarGraph data={nonCumulativeData.filter((_, index) => index !== 0)} />
          <TradesWidget data={todayData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardDay;