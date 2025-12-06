'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { EditModeToolbar } from '@/components/dashboard/DraggableWidgetGrid';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useModeFilteredAccounts } from '@/hooks/useModeFilteredAccounts';
import datesforcal from '@/store/datesforcal';

const ResponsiveGridLayout = WidthProvider(Responsive);

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

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'stats-overview', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
    { i: 'calendar', x: 0, y: 2, w: 8, h: 5, minW: 4, minH: 3 },
    { i: 'cumulative-pnl', x: 8, y: 2, w: 4, h: 2.5, minW: 3, minH: 2 },
    { i: 'trades-table', x: 8, y: 4.5, w: 4, h: 2.5, minW: 3, minH: 2 },
    { i: 'daily-pnl-bar', x: 0, y: 7, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'day-of-week', x: 4, y: 7, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'symbol-pnl', x: 8, y: 7, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'hourly-pnl', x: 0, y: 10, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'radar', x: 4, y: 10, w: 8, h: 3, minW: 4, minH: 2 },
  ],
  md: [
    { i: 'stats-overview', x: 0, y: 0, w: 10, h: 2, minW: 5, minH: 2 },
    { i: 'calendar', x: 0, y: 2, w: 6, h: 5, minW: 4, minH: 3 },
    { i: 'cumulative-pnl', x: 6, y: 2, w: 4, h: 2.5, minW: 3, minH: 2 },
    { i: 'trades-table', x: 6, y: 4.5, w: 4, h: 2.5, minW: 3, minH: 2 },
    { i: 'daily-pnl-bar', x: 0, y: 7, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'day-of-week', x: 5, y: 7, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'symbol-pnl', x: 0, y: 10, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'hourly-pnl', x: 5, y: 10, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'radar', x: 0, y: 13, w: 10, h: 3, minW: 4, minH: 2 },
  ],
  sm: [
    { i: 'stats-overview', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
    { i: 'calendar', x: 0, y: 4, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'cumulative-pnl', x: 0, y: 9, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'trades-table', x: 0, y: 12, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'daily-pnl-bar', x: 0, y: 15, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'day-of-week', x: 0, y: 18, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'symbol-pnl', x: 0, y: 21, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'hourly-pnl', x: 0, y: 24, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'radar', x: 0, y: 27, w: 6, h: 3, minW: 3, minH: 2 },
  ],
};

const DashboardMonth: React.FC = () => {
  const { selectedAccounts } = useModeFilteredAccounts();
  const { calMonth, calYear } = datesforcal();
  const { layout, isEditMode, gridPositions, updateGridPositions } = useDashboardLayoutStore();
  const [mounted, setMounted] = useState(false);
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (gridPositions && gridPositions.length > 0) {
      setLayouts({ ...DEFAULT_LAYOUTS, lg: gridPositions });
    }
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

  const handleLayoutChange = (currentLayout: ReactGridLayout.Layout[], allLayouts: ReactGridLayout.Layouts) => {
    if (isEditMode) {
      setLayouts(allLayouts as typeof DEFAULT_LAYOUTS);
      updateGridPositions(currentLayout.map(item => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
      })));
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <EditModeToolbar />
        </div>
        <div className="animate-pulse bg-muted rounded-xl h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-end">
        <EditModeToolbar />
      </div>

      <div className="w-full">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={80}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          compactType="vertical"
          preventCollision={false}
        >
          {Object.keys(widgetComponents).map((widgetId) => {
            if (!isWidgetVisible(widgetId) && !isEditMode) return null;
            
            return (
              <div 
                key={widgetId} 
                className={`
                  bg-card rounded-xl overflow-hidden
                  ${isEditMode ? 'ring-2 ring-dashed ring-primary/30 cursor-move' : ''}
                  ${!isWidgetVisible(widgetId) ? 'opacity-40' : ''}
                `}
              >
                <div className="h-full w-full overflow-auto">
                  {widgetComponents[widgetId]}
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};

export default DashboardMonth;
