// CalendarMains.tsx
import React, { useState } from 'react';
import useAccountDetails from '@/store/accountdetails';
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL';
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics';
import LineChartCard from '@/components/reports/charts/LineChartCard';
import PieChartCard from '@/components/reports/charts/PieChartCard';
import YearlyCalendar from './components/YearlyCalendar';
import MonthlyCalendarWithPnL from './components/MonthlyCalendarWithPnL';
import PnLPerWeekChart from './components/PnLPerWeekChart';
import { calculateWeeklyPnL } from '@/utils/reports/calculateWeeklyPnL';
import { getDailyPnL } from '@/utils/reports/getDailyPnL';
import ChartCard from '../shared/ChartCard';
import StatTable from '../overview/StatTable';

interface Trade {
  date: string;
  Profit: number;
  // Add other trade properties as needed
  [key: string]: any;
}

interface CalendarMainsProps {
  trades: Trade[];
}

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

const CalendarMains= () => {
  const { selectedAccounts } = useAccountDetails()
  const trades =  selectedAccounts.flatMap((account: any) => account.tradeData || [])
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  const netDailyPnL = getDailyPnL(trades, "net_pnl");

  const isCurrentMonth = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date.getFullYear() === displayYear && date.getMonth() === selectedMonth;
  };

  // Extract and filter trade data from all selectedAccounts
  const thisMonthData = trades.filter((trade) => isCurrentMonth(trade.date));
  
  // Calculate cumulative and daily PnL
  const cumulativePnLData = calculateCumulativePnL(thisMonthData);
  const metrics = calculatePerformanceMetrics(thisMonthData);

  const data: PieChartData[] = [
    {
      label: "Win Trades",
      value: thisMonthData.filter((trade) => trade.Profit > 0).length || 0,
      color: "#59c0a4",
    },
    {
      label: "Loss Trades",
      value: thisMonthData.filter((trade) => trade.Profit < 0).length || 0,
      color: "#ec787dff",
    },
  ];

  return (
    <div className="bg-gray-950 p-5 min-h-screen flex justify-center items-start box-border">
      <div className="w-full max-w-7xl mx-auto">
        {/* Calendar Card Container */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col p-5 transition-all duration-200 hover:border-green-500">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-900 flex items-center border-b border-gray-800">
            <p className="text-white text-base font-medium font-roboto flex-grow">YEAR</p>
          </div>

          {/* Divider */}
          <hr className="h-px border-none bg-gray-800 my-0" />

          {/* Year Navigation */}
          <div className="px-6 py-4 bg-gray-900 flex items-center justify-between">
            <button
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-base cursor-pointer flex items-center justify-center min-w-10 transition-all duration-200 hover:bg-gray-700 hover:border-green-500 hover:text-green-500"
              onClick={() => setDisplayYear((prev) => prev - 1)}
              aria-label="Previous Year"
            >
              {"<"}
            </button>
            <span className="text-white text-base font-medium min-w-15 text-center">{displayYear}</span>
            <button
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-base cursor-pointer flex items-center justify-center min-w-10 transition-all duration-200 hover:bg-gray-700 hover:border-green-500 hover:text-green-500 disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-800"
              onClick={() => setDisplayYear((prev) => prev + 1)}
              disabled={currentYear <= displayYear}
              aria-label="Next Year"
            >
              {">"}
            </button>
          </div>

          {/* Yearly Calendar Component */}
          <YearlyCalendar
            currentYear={displayYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            data={netDailyPnL}
          />
        </div>

        <div className="flex flex-row my-5">
          <MonthlyCalendarWithPnL
            year={displayYear}
            monthIndex={selectedMonth}
            data={netDailyPnL}
          />
          <div className="p-0">
            <PnLPerWeekChart
              year={displayYear}
              month={selectedMonth}
              data={calculateWeeklyPnL(
                selectedMonth,
                displayYear,
                thisMonthData
              )}
            />
          </div>
        </div>

        <ChartCard title="DAILY NET CUMULATIVE P&L" subtitle="(ALL DATES)">
          <LineChartCard
            data={cumulativePnLData}
            yLabel={"Daily Net P&L"}
            xLabel={"Date"}
          />
        </ChartCard>

        <PieChartCard data={data} />

        <StatTable trades={thisMonthData} metrics={metrics} />
      </div>
    </div>
  );
};

export default CalendarMains;