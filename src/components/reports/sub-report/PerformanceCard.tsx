// PerformanceCard.tsx
import React from 'react';

interface PerformanceCardProps {
  title: string;
  day: string;
  trades: number;
  pnl?: string;
  icon: 'trending-up' | 'trending-down' | 'activity' | 'user-check';
  color: string;
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({ title, day, trades, pnl, icon, color }) => {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'trending-up': return '📈';
      case 'trending-down': return '📉';
      case 'activity': return '⚡';
      case 'user-check': return '👤';
      default: return '📊';
    }
  };

  return (
    <div 
      className="flex-1 bg-gray-900 rounded-xl p-5 border-l-4 shadow-lg border border-gray-800 transition-all duration-200 hover:border-green-500"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-3 mb-3 px-2">
        <span className="text-xl" style={{ color }}>{getIcon(icon)}</span>
        <h4 className="text-sm font-semibold text-gray-400 m-0">{title}</h4>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-lg font-semibold text-white">{day}</div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{trades} trades</span>
          {pnl && (
            <span className={`font-semibold ${
              pnl.startsWith('-') ? 'text-red-500' : 'text-green-500'
            }`}>
              {pnl}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard;