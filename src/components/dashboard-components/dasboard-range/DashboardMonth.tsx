'use client';

import React from 'react';
import DashWidgets from "../dashboard-widgets/DashboardWidget";
import Calendar from "../Calendar";
import TradesWidget from "../TradesWidget";
import PnLDailyChart from "./Graphs/PnLDailyChart";
import Radar from "./Graphs/Radar";
// Functions 
import { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance } from '@/utils/dashboard-calculations/dashboardCalculations';

// Stores
import useAccountDetails from '@/store/accountdetails';
import datesforcal from '@/store/datesforcal';

interface TradeData {
  date: string;
  Profit: number;
}

interface Account {
  tradeData?: TradeData[];
}

const DashboardMonth: React.FC = () => {
  const { selectedAccounts } = useAccountDetails();
  const { calMonth, calYear } = datesforcal();

  // Function to check if a date string is in the current month and year
  function isCurrentMonth(dateString: string): boolean {
    const date = new Date(dateString);
    return date.getFullYear() === calYear && (date.getMonth() + 1) === calMonth;
  }

  // Extract and filter trade data from all selectedAccounts
  const thisMonthData = selectedAccounts.flatMap((account: Account) => {
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

  // Add an initial value of 0 and compute cumulative sum
  let cumulativeProfit = 0;
  data = [{ time: "", value: 0 }, ...data].map(({ time, value }) => {
    cumulativeProfit += value;
    return { time, value: parseFloat(cumulativeProfit.toFixed(2)) };
  });

  const metrics = calculateRiskRewardRatio(thisMonthData);

  return (
    <div className="w-full h-auto flex flex-col mt-6 rounded-[25px] border border-white/35 border-r-white/20 border-l-white/20">

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

      {/* Part next to widgets */}
      <div className="w-full max-w-[1710px] h-auto flex items-start justify-center mx-auto">
        <Calendar />
        <div className="w-2/5 h-auto flex flex-col items-center justify-end font-inter lg:max-2xl:w-[calc(100%-950px)]">
          <PnLDailyChart data={data} />
          <TradesWidget data={thisMonthData} />
          <Radar />
        </div>
      </div>
    </div>
  );
};

export default DashboardMonth;