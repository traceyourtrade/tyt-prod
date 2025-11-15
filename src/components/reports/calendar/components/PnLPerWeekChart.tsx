// PnLPerWeekChart.tsx
import React from 'react';

interface WeekData {
  week: number;
  pnl: number;
}

interface PnLPerWeekChartProps {
  year?: number;
  month?: number;
  data?: WeekData[];
}

const PnLPerWeekChart: React.FC<PnLPerWeekChartProps> = ({ 
  year = 2025, 
  month = 10, 
  data = [] 
}) => {
  const [pnlData, setPnlData] = React.useState<WeekData[]>([]);

  React.useEffect(() => {
    setPnlData(data);
  }, [year, month, data]);

  const getColor = (pnl: number): string => {
    if (pnl > 0) {
      return '#10b981';
    } else if (pnl < 0) {
      return '#ef4444';
    }
    return '#94a3b8';
  };

  return (
    <div className="w-full p-5 box-border bg-gray-900 border border-gray-800 rounded-xl shadow-lg transition-all duration-200 hover:border-green-500 h-auto ml-5 flex flex-col justify-start">
      <p className="text-white text-base font-medium text-center mb-4">P&L PER WEEK</p>
      <div className="flex flex-col items-stretch w-full gap-3 p-2 box-border">
        {pnlData.map((weekData, index) => (
          <div
            key={weekData.week}
            className="w-full min-h-[100px] flex flex-col items-center justify-center p-3 box-border rounded-lg transition-all duration-200 bg-gray-800/20 hover:bg-gray-800"
            style={{
              borderBottom: index < pnlData.length - 1 ? '1px solid #334155' : 'none',
            }}
          >
            <p
              className="text-sm font-medium mb-1"
              style={{ color: getColor(weekData.pnl) }}
            >
              {weekData.pnl >= 0 ? '+' : ''}
              {weekData.pnl.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <span className="text-gray-500 text-xs uppercase tracking-wider">WEEK {weekData.week}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PnLPerWeekChart;