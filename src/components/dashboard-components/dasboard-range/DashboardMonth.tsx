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
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';
import useCurrencyStore, { convertTradeCurrency } from '@/store/currencyStore';
import useDateRangeStore from '@/store/dateRangeStore';

import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts';
import datesforcal from '@/store/datesforcal';

import {
  TradeDurationChart,
  WinRateMetricsChart,
  DailyCumulativePnLChart,
  DrawdownChart,
  ProgressTracker,
} from '@/components/dashboard-analytics';

interface TradeData {
  date: string;
  Profit: number;
  Item: string;
  Currency?: string;
  [key: string]: unknown;
}

interface Account {
  tradeData?: TradeData[];
  [key: string]: unknown;
}

const DashboardMonth: React.FC = () => {
  const { selectedAccounts } = useModeFilteredAccounts();
  const { calMonth, calYear } = datesforcal();
  const { layout, layoutMode } = useDashboardLayoutStore();
  const { currency, exchangeRate } = useCurrencyStore();
  const { selectedRange, viewingMonth } = useDateRangeStore();
  
  const dateRange = React.useMemo(() => {
    if (selectedRange === "this_month") {
      const startDate = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth(), 1, 0, 0, 0, 0);
      const endDate = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }
    const store = useDateRangeStore.getState();
    return store.getDateRange();
  }, [selectedRange, viewingMonth]);

  function isInDateRange(dateString: string): boolean {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    
    if (!dateRange.startDate && !dateRange.endDate) {
      return true;
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      return date >= dateRange.startDate && date <= dateRange.endDate;
    }
    
    if (dateRange.startDate) {
      return date >= dateRange.startDate;
    }
    
    if (dateRange.endDate) {
      return date <= dateRange.endDate;
    }
    
    return true;
  }

  const filteredData = (selectedAccounts as Account[]).flatMap((account) => {
    if (!account.tradeData) return [];
    return account.tradeData.filter(trade => isInDateRange(trade.date));
  });

  const totalAccountBalance = calculateBalance(selectedAccounts);

  const convertProfit = (trade: TradeData) => convertTradeCurrency(trade.Profit || 0, trade.Currency, currency, exchangeRate);

  let data = Object.entries(
    (filteredData || []).reduce((acc: { [key: string]: number }, trade) => {
      acc[trade.date] = (acc[trade.date] || 0) + convertProfit(trade);
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

  const metrics = calculateRiskRewardRatio(filteredData);

  const sortedTrades = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const profitFactorData: { value: number }[] = [];
  let runningWins = 0;
  let runningLosses = 0;
  sortedTrades.forEach(trade => {
    const profit = convertProfit(trade);
    if (profit > 0) runningWins += profit;
    else runningLosses += Math.abs(profit);
    const pf = runningLosses > 0 ? runningWins / runningLosses : runningWins > 0 ? runningWins : 0;
    profitFactorData.push({ value: parseFloat(pf.toFixed(2)) });
  });

  const dashWidgetProps = {
    data,
    pnl: filteredData.reduce((sum, trade) => sum + convertProfit(trade), 0).toFixed(2),
    winrate: ((filteredData.filter(trade => trade.Profit > 0).length / filteredData.length * 100 || 0).toFixed(2)),
    winners: filteredData.filter(t => t.Profit > 0).length,
    losers: filteredData.filter(t => t.Profit < 0).length,
    profitF: calculateProfitFactor(filteredData),
    profitFactorData,
    totalProfits: filteredData.reduce((sum, trade) => trade.Profit > 0 ? sum + convertProfit(trade) : sum, 0),
    totalLoses: filteredData.reduce((sum, trade) => trade.Profit < 0 ? sum + convertProfit(trade) : sum, 0),
    avgProfits: parseFloat(metrics.avgWin),
    avgLoses: parseFloat(metrics.avgLoss),
    rrRatio: metrics.rrRatio,
    accBal: calculateBalance(selectedAccounts).toFixed(2),
    valuesAlreadyConverted: true,
  };

  const isWidgetVisible = (widgetId: string) => {
    const item = layout.find(l => l.widgetId === widgetId);
    return item?.visible ?? true;
  };

  const renderView1 = () => (
    <>
      {isWidgetVisible('stats-overview') && (
        <DashWidgets {...dashWidgetProps} />
      )}

      {(isWidgetVisible('calendar') || isWidgetVisible('cumulative-pnl') || isWidgetVisible('trades-table')) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {isWidgetVisible('calendar') && (
            <div className="xl:col-span-2">
              <Calendar />
            </div>
          )}

          {(isWidgetVisible('cumulative-pnl') || isWidgetVisible('trades-table')) && (
            <div className="xl:col-span-1 flex flex-col gap-4">
              {isWidgetVisible('cumulative-pnl') && (
                <PnLDailyChart data={data} />
              )}
              {isWidgetVisible('trades-table') && (
                <TradesWidget data={filteredData} />
              )}
            </div>
          )}
        </div>
      )}

      {(isWidgetVisible('daily-pnl-bar') || isWidgetVisible('day-of-week') || isWidgetVisible('symbol-pnl') || isWidgetVisible('hourly-pnl') || isWidgetVisible('radar')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isWidgetVisible('daily-pnl-bar') && (
            <DailyPnLBarChart data={filteredData} />
          )}
          {isWidgetVisible('day-of-week') && (
            <DayOfWeekChart data={filteredData} />
          )}
          {isWidgetVisible('symbol-pnl') && (
            <SymbolPnLChart data={filteredData} />
          )}
          {isWidgetVisible('hourly-pnl') && (
            <HourlyPnLChart data={filteredData} />
          )}
          {isWidgetVisible('radar') && (
            <div className="md:col-span-2">
              <Radar />
            </div>
          )}
        </div>
      )}

      {isWidgetVisible('daily-cumulative-pnl') && (
        <div className="grid grid-cols-1">
          <DailyCumulativePnLChart trades={filteredData} />
        </div>
      )}

      {(isWidgetVisible('trade-duration') || isWidgetVisible('win-rate-metrics') || isWidgetVisible('drawdown') || isWidgetVisible('progress-tracker')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isWidgetVisible('trade-duration') && (
            <TradeDurationChart trades={filteredData} />
          )}
          {isWidgetVisible('win-rate-metrics') && (
            <WinRateMetricsChart trades={filteredData} />
          )}
          {isWidgetVisible('drawdown') && (
            <DrawdownChart trades={filteredData} startingBalance={totalAccountBalance} />
          )}
          {isWidgetVisible('progress-tracker') && (
            <div className="md:col-span-2">
              <ProgressTracker trades={filteredData} />
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderView2 = () => (
    <div className="space-y-4">
      {isWidgetVisible('stats-overview') && (
        <DashWidgets {...dashWidgetProps} />
      )}

      {(isWidgetVisible('radar') || isWidgetVisible('cumulative-pnl') || isWidgetVisible('daily-cumulative-pnl')) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          {isWidgetVisible('radar') && (
            <Radar />
          )}
          {isWidgetVisible('cumulative-pnl') && (
            <PnLDailyChart data={data} />
          )}
          {isWidgetVisible('daily-cumulative-pnl') && (
            <DailyCumulativePnLChart trades={filteredData} />
          )}
        </div>
      )}

      {(isWidgetVisible('calendar') || isWidgetVisible('trades-table') || isWidgetVisible('daily-pnl-bar')) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {isWidgetVisible('calendar') && (
            <div className="xl:col-span-2">
              <Calendar />
            </div>
          )}

          {(isWidgetVisible('trades-table') || isWidgetVisible('daily-pnl-bar')) && (
            <div className="xl:col-span-1 flex flex-col gap-4">
              {isWidgetVisible('trades-table') && (
                <TradesWidget data={filteredData} />
              )}
              {isWidgetVisible('daily-pnl-bar') && (
                <DailyPnLBarChart data={filteredData} />
              )}
            </div>
          )}
        </div>
      )}

      {(isWidgetVisible('day-of-week') || isWidgetVisible('symbol-pnl') || isWidgetVisible('hourly-pnl')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isWidgetVisible('day-of-week') && (
            <DayOfWeekChart data={filteredData} />
          )}
          {isWidgetVisible('symbol-pnl') && (
            <SymbolPnLChart data={filteredData} />
          )}
          {isWidgetVisible('hourly-pnl') && (
            <HourlyPnLChart data={filteredData} />
          )}
        </div>
      )}

      {(isWidgetVisible('trade-duration') || isWidgetVisible('win-rate-metrics') || isWidgetVisible('drawdown') || isWidgetVisible('progress-tracker')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isWidgetVisible('trade-duration') && (
            <TradeDurationChart trades={filteredData} />
          )}
          {isWidgetVisible('win-rate-metrics') && (
            <WinRateMetricsChart trades={filteredData} />
          )}
          {isWidgetVisible('drawdown') && (
            <DrawdownChart trades={filteredData} startingBalance={totalAccountBalance} />
          )}
          {isWidgetVisible('progress-tracker') && (
            <div className="md:col-span-2">
              <ProgressTracker trades={filteredData} />
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {layoutMode === 'view1' ? renderView1() : renderView2()}
    </div>
  );
};

export default DashboardMonth;
