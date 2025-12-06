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
import { DraggableWidget, EditModeToolbar } from '@/components/dashboard/DraggableWidgetGrid';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';

import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts';
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
  const { selectedAccounts } = useModeFilteredAccounts();
  const { calMonth, calYear } = datesforcal();
  const { layout, reorderWidgets } = useDashboardLayoutStore();

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

  const dashWidgetProps = {
    data,
    pnl: thisMonthData.reduce((sum, trade) => sum + (trade.Profit || 0), 0).toFixed(2),
    winrate: ((thisMonthData.filter(trade => trade.Profit > 0).length / thisMonthData.length * 100 || 0).toFixed(2)),
    winners: thisMonthData.filter(t => t.Profit > 0).length,
    losers: thisMonthData.filter(t => t.Profit < 0).length,
    profitF: calculateProfitFactor(thisMonthData),
    totalProfits: thisMonthData.reduce((sum, trade) => trade.Profit > 0 ? sum + trade.Profit : sum, 0),
    totalLoses: thisMonthData.reduce((sum, trade) => trade.Profit < 0 ? sum + trade.Profit : sum, 0),
    avgProfits: parseFloat(metrics.avgWin),
    avgLoses: parseFloat(metrics.avgLoss),
    rrRatio: metrics.rrRatio,
    accBal: calculateBalance(selectedAccounts).toFixed(2),
  };

  const isWidgetVisible = (widgetId: string) => {
    const item = layout.find(l => l.widgetId === widgetId);
    return item?.visible ?? true;
  };

  const getWidgetOrder = (widgetId: string) => {
    const item = layout.find(l => l.widgetId === widgetId);
    return item?.order ?? 999;
  };

  const chartsWidgets = [
    { id: 'daily-pnl-bar', component: <DailyPnLBarChart data={thisMonthData} /> },
    { id: 'day-of-week', component: <DayOfWeekChart data={thisMonthData} /> },
    { id: 'symbol-pnl', component: <SymbolPnLChart data={thisMonthData} /> },
    { id: 'hourly-pnl', component: <HourlyPnLChart data={thisMonthData} /> },
  ].filter(w => isWidgetVisible(w.id)).sort((a, b) => getWidgetOrder(a.id) - getWidgetOrder(b.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <EditModeToolbar />
      </div>

      {isWidgetVisible('stats-overview') && (
        <DraggableWidget widgetId="stats-overview">
          <DashWidgets {...dashWidgetProps} />
        </DraggableWidget>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {isWidgetVisible('calendar') && (
          <DraggableWidget widgetId="calendar" className="xl:col-span-2">
            <Calendar />
          </DraggableWidget>
        )}

        <div className="xl:col-span-1 flex flex-col gap-4">
          {isWidgetVisible('cumulative-pnl') && (
            <DraggableWidget widgetId="cumulative-pnl">
              <PnLDailyChart data={data} />
            </DraggableWidget>
          )}
          {isWidgetVisible('trades-table') && (
            <DraggableWidget widgetId="trades-table">
              <TradesWidget data={thisMonthData} />
            </DraggableWidget>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {chartsWidgets.map(widget => (
          <DraggableWidget key={widget.id} widgetId={widget.id}>
            {widget.component}
          </DraggableWidget>
        ))}
        
        {isWidgetVisible('radar') && (
          <DraggableWidget widgetId="radar" className="md:col-span-2 xl:col-span-2">
            <Radar />
          </DraggableWidget>
        )}
      </div>
    </div>
  );
};

export default DashboardMonth;
