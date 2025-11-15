// ChartContainer.tsx
import React, { useMemo } from 'react';
import LineChartCard from '../charts/LineChartCard';
import BarChartCard from '../charts/BarChartCard';
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics';

interface Trade {
  date: string;
  // Add other trade properties as needed
}

interface ChartContainerProps {
  trades: Trade[];
}

const ChartContainer: React.FC<ChartContainerProps> = ({ trades }) => {
  // Group trades by day
  const dayData = useMemo(() => {
    const tradesByDay = trades.reduce((acc: Record<string, Trade[]>, trade: Trade) => {
      const day = trade.date;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(trade);
      return acc;
    }, {});

    // Calculate metrics for each day
    const chartData = Object.entries(tradesByDay).map(([day, dayTrades]) => {
      const metrics = calculatePerformanceMetrics(dayTrades);
      return {
        date: day,
        tradeCount: dayTrades.length,
        winPercentage: metrics.winPercentage
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      tradeCount: chartData.map(d => ({ date: d.date, value: d.tradeCount })),
      winPercentage: chartData.map(d => ({ date: d.date, value: d.winPercentage }))
    };
  }, [trades]);

  return (
    <div className="flex justify-around w-full gap-6 mb-6">
      <div className="flex-1 bg-gray-900 rounded-xl p-5 shadow-lg border border-gray-800 transition-all duration-200 hover:border-green-500">
        <div className="flex items-center gap-2 mb-4">
          <select className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-sm text-white cursor-not-allowed opacity-50" disabled>
            <option>Net P&L</option>
            <option>Trade count</option>
          </select>
          <button className="bg-transparent text-gray-400 border-none px-4 py-2 text-sm cursor-not-allowed opacity-50">
            + Add metric
          </button>
        </div>
        <div className="h-72 w-full bg-gray-800 rounded-3xl overflow-hidden">
          <LineChartCard data={dayData.tradeCount} isArea={false} xLabel={'Day'} yLabel='Trade Count' />
        </div>
      </div>
      <div className="flex-1 bg-gray-900 rounded-xl p-5 shadow-lg border border-gray-800 transition-all duration-200 hover:border-green-500">
        <div className="flex items-center gap-2 mb-4">
          <select className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-sm text-white cursor-not-allowed opacity-50" disabled>
            <option>Win %</option>
          </select>
          <button className="bg-transparent text-gray-400 border-none px-4 py-2 text-sm cursor-not-allowed opacity-50" disabled>
            + Add metric
          </button>
        </div>
        <div className="h-72 w-full bg-gray-800 rounded-3xl overflow-hidden">
          <BarChartCard data={dayData.winPercentage} xLabel={'Day'} yLabel='Win %' />
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;