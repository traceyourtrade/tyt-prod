'use client';

import React from 'react';
import DashWidgets from "../dashboard-widgets/DashboardWidget";
import Calendar from "../Calendar";
import TradesWidget from "../TradesWidget";
import PnLDailyChart from "./Graphs/PnLDailyChart";
import Radar from "./Graphs/Radar";
import DailyPnLBarChart from "./Graphs/DailyPnLBarChart";
import DayOfWeekChart from "./Graphs/DayOfWeekChart";
import SymbolPnLChart from "./Graphs/SymbolPnLChart";
import HourlyPnLChart from "./Graphs/HourlyPnLChart";
import { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance } from '@/utils/dashboard-calculations/dashboardCalculations';

import useAccountDetails from '@/store/accountdetails';
import datesforcal from '@/store/datesforcal';

interface TradeData {
  date: string;
  Profit: number;
  Item: string;
  [key: string]: unknown;
}

interface Account {
  tradeData?: TradeData[];
  [key: string]: unknown;
}

const DashboardMonth: React.FC = () => {
  const { selectedAccounts } = useAccountDetails();
  const { calMonth, calYear } = datesforcal();

  function isCurrentMonth(dateString: string): boolean {
    const date = new Date(dateString);
    return date.getFullYear() === calYear && (date.getMonth() + 1) === calMonth;
  }

  const thisMonthData = (selectedAccounts as Account[]).flatMap((account) => {
    if (!account.tradeData) return [];
    return account.tradeData.filter(trade => isCurrentMonth(trade.date));
  });

  let data = Object.entries(
    (thisMonthData || []).reduce((acc: { [key: string]: number }, trade) => {
      acc[trade.date] = (acc[trade.date] || 0) + (trade.Profit || 0);
      return acc;
    }, {})
  )
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  let cumulativeProfit = 0;
  data = [{ time: "", value: 0 }, ...data].map(({ time, value }) => {
    cumulativeProfit += value;
    return { time, value: parseFloat(cumulativeProfit.toFixed(2)) };
  });

  const metrics = calculateRiskRewardRatio(thisMonthData);

  return (
    <div className="space-y-6">
      {/* Dashboard Widgets */}
      <DashWidgets
        data={data}
        pnl={thisMonthData.reduce((sum, trade) => sum + (trade.Profit || 0), 0).toFixed(2)}
        winrate={((thisMonthData.filter(trade => trade.Profit > 0).length / thisMonthData.length * 100 || 0).toFixed(2))}
        winners={thisMonthData.filter(t => t.Profit > 0).length}
        losers={thisMonthData.filter(t => t.Profit < 0).length}
        profitF={calculateProfitFactor(thisMonthData)}
        totalProfits={thisMonthData.reduce((sum, trade) => trade.Profit > 0 ? sum + trade.Profit : sum, 0)}
        totalLoses={thisMonthData.reduce((sum, trade) => trade.Profit < 0 ? sum + trade.Profit : sum, 0)}
        avgProfits={parseFloat(metrics.avgWin)}
        avgLoses={parseFloat(metrics.avgLoss)}
        rrRatio={metrics.rrRatio}
        accBal={calculateBalance(selectedAccounts).toFixed(2)}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Calendar - Takes full width on mobile, 2 cols on lg, 2 cols on xl */}
        <div className="lg:col-span-2">
          <Calendar />
        </div>

        {/* Net Cumulative P&L Chart */}
        <div className="lg:col-span-1">
          <PnLDailyChart data={data} />
        </div>

        {/* Daily P&L Bar Chart */}
        <DailyPnLBarChart data={thisMonthData} />

        {/* Day of Week Chart */}
        <DayOfWeekChart data={thisMonthData} />

        {/* Symbol P&L Chart */}
        <SymbolPnLChart data={thisMonthData} />

        {/* Recent Trades Widget */}
        <TradesWidget data={thisMonthData} />

        {/* Hourly Performance Chart */}
        <HourlyPnLChart data={thisMonthData} />

        {/* Performance Radar */}
        <Radar />
      </div>
    </div>
  );
};

export default DashboardMonth;
