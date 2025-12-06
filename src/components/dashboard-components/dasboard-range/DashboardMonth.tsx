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
import { SortableWidget, EditModeToolbar, WidgetGrid } from '@/components/dashboard/DraggableWidgetGrid';
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
  const { layout, isEditMode } = useDashboardLayoutStore();

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

  const sortedLayout = [...layout].sort((a, b) => a.order - b.order);
  const visibleWidgetIds = sortedLayout
    .filter(l => l.visible || isEditMode)
    .map(l => l.widgetId);

  const widgetComponents: Record<string, { component: React.ReactNode; span?: 'full' | 'double' | 'single' }> = {
    'stats-overview': { 
      component: <DashWidgets {...dashWidgetProps} />,
      span: 'full'
    },
    'calendar': { 
      component: <Calendar />,
      span: 'single'
    },
    'cumulative-pnl': { 
      component: <PnLDailyChart data={data} />,
      span: 'single'
    },
    'trades-table': { 
      component: <TradesWidget data={thisMonthData} />,
      span: 'single'
    },
    'daily-pnl-bar': { 
      component: <DailyPnLBarChart data={thisMonthData} />,
      span: 'single'
    },
    'day-of-week': { 
      component: <DayOfWeekChart data={thisMonthData} />,
      span: 'single'
    },
    'symbol-pnl': { 
      component: <SymbolPnLChart data={thisMonthData} />,
      span: 'single'
    },
    'hourly-pnl': { 
      component: <HourlyPnLChart data={thisMonthData} />,
      span: 'single'
    },
    'radar': { 
      component: <Radar />,
      span: 'single'
    },
  };

  const getSpanClass = (widgetId: string) => {
    const span = widgetComponents[widgetId]?.span;
    switch (span) {
      case 'full':
        return 'md:col-span-2';
      case 'double':
        return 'md:col-span-2';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <EditModeToolbar />
      </div>

      <WidgetGrid widgetIds={visibleWidgetIds}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleWidgetIds.map((widgetId) => {
            const widgetConfig = widgetComponents[widgetId];
            if (!widgetConfig) return null;
            
            return (
              <SortableWidget 
                key={widgetId} 
                widgetId={widgetId}
                className={getSpanClass(widgetId)}
              >
                {widgetConfig.component}
              </SortableWidget>
            );
          })}
        </div>
      </WidgetGrid>
    </div>
  );
};

export default DashboardMonth;
