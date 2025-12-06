'use client';

import React, { useState, useEffect } from 'react';
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
import { WidgetWrapper, EditModeToolbar } from '@/components/dashboard/DraggableWidgetGrid';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';
import type { GridPosition } from '@/store/dashboardLayoutStore';

import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts';
import datesforcal from '@/store/datesforcal';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

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
  const { layout, isEditMode, gridPositions, updateGridPositions } = useDashboardLayoutStore();
  const [mounted, setMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    setMounted(true);
    const updateWidth = () => {
      const container = document.getElementById('dashboard-grid-container');
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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

  const widgetComponents: Record<string, React.ReactNode> = {
    'stats-overview': <DashWidgets {...dashWidgetProps} />,
    'calendar': <Calendar />,
    'cumulative-pnl': <PnLDailyChart data={data} />,
    'trades-table': <TradesWidget data={thisMonthData} />,
    'daily-pnl-bar': <DailyPnLBarChart data={thisMonthData} />,
    'day-of-week': <DayOfWeekChart data={thisMonthData} />,
    'symbol-pnl': <SymbolPnLChart data={thisMonthData} />,
    'hourly-pnl': <HourlyPnLChart data={thisMonthData} />,
    'radar': <Radar />,
  };

  const visibleGridPositions = gridPositions.filter(pos => 
    isWidgetVisible(pos.i) || isEditMode
  );

  const handleLayoutChange = (newLayout: GridLayout.Layout[]) => {
    const updatedPositions = gridPositions.map(pos => {
      const updated = newLayout.find(l => l.i === pos.i);
      if (updated) {
        return {
          ...pos,
          x: updated.x,
          y: updated.y,
          w: updated.w,
          h: updated.h,
        };
      }
      return pos;
    });
    updateGridPositions(updatedPositions as GridPosition[]);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <EditModeToolbar />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(widgetComponents).map(([id, component]) => (
            isWidgetVisible(id) && (
              <div key={id} className="bg-card rounded-xl">
                {component}
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <EditModeToolbar />
      </div>

      <div id="dashboard-grid-container" className="w-full">
        <GridLayout
          className="layout"
          layout={visibleGridPositions}
          cols={12}
          rowHeight={80}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          compactType="vertical"
          preventCollision={false}
          draggableHandle=".drag-handle"
        >
          {visibleGridPositions.map((pos) => (
            <div key={pos.i} className={isEditMode ? "drag-handle" : ""}>
              <WidgetWrapper widgetId={pos.i}>
                {widgetComponents[pos.i]}
              </WidgetWrapper>
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  );
};

export default DashboardMonth;
