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
  const { layout, swapWidgets, isEditMode } = useDashboardLayoutStore();

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

  const sortedLayout = [...layout].sort((a, b) => a.order - b.order);
  const visibleWidgets = sortedLayout.filter(l => l.visible || isEditMode);

  const widgetComponents: Record<string, { component: React.ReactNode; gridClass?: string }> = {
    'stats-overview': { 
      component: <DashWidgets {...dashWidgetProps} />,
      gridClass: 'col-span-full'
    },
    'calendar': { 
      component: <Calendar />,
      gridClass: 'md:col-span-2'
    },
    'cumulative-pnl': { 
      component: <PnLDailyChart data={data} />
    },
    'trades-table': { 
      component: <TradesWidget data={thisMonthData} />
    },
    'daily-pnl-bar': { 
      component: <DailyPnLBarChart data={thisMonthData} />
    },
    'day-of-week': { 
      component: <DayOfWeekChart data={thisMonthData} />
    },
    'symbol-pnl': { 
      component: <SymbolPnLChart data={thisMonthData} />
    },
    'hourly-pnl': { 
      component: <HourlyPnLChart data={thisMonthData} />
    },
    'radar': { 
      component: <Radar />,
      gridClass: 'md:col-span-2'
    },
  };

  const handleMoveUp = (widgetId: string) => {
    const currentIndex = visibleWidgets.findIndex(l => l.widgetId === widgetId);
    if (currentIndex > 0) {
      const prevWidget = visibleWidgets[currentIndex - 1];
      swapWidgets(widgetId, prevWidget.widgetId);
    }
  };

  const handleMoveDown = (widgetId: string) => {
    const currentIndex = visibleWidgets.findIndex(l => l.widgetId === widgetId);
    if (currentIndex < visibleWidgets.length - 1) {
      const nextWidget = visibleWidgets[currentIndex + 1];
      swapWidgets(widgetId, nextWidget.widgetId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <EditModeToolbar />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleWidgets.map((layoutItem, index) => {
          const widgetConfig = widgetComponents[layoutItem.widgetId];
          if (!widgetConfig) return null;
          
          const canMoveUp = index > 0;
          const canMoveDown = index < visibleWidgets.length - 1;

          return (
            <DraggableWidget 
              key={layoutItem.widgetId} 
              widgetId={layoutItem.widgetId}
              className={widgetConfig.gridClass}
              onMoveUp={() => handleMoveUp(layoutItem.widgetId)}
              onMoveDown={() => handleMoveDown(layoutItem.widgetId)}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
            >
              {widgetConfig.component}
            </DraggableWidget>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardMonth;
