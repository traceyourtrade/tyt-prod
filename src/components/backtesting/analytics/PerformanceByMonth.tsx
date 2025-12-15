'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MonthPerformance } from '@/hooks/backtesting/useBacktestAnalytics';

interface Props {
  data: MonthPerformance[];
  initialBalance: number;
}

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'YTD'];

export default function PerformanceByMonth({ data, initialBalance }: Props) {
  const [calcMode, setCalcMode] = useState<'accumulated' | 'overall'>('accumulated');
  const [balanceMode, setBalanceMode] = useState<'initial' | 'current'>('initial');

  const years = [...new Set(data.map(d => d.year))].sort();
  if (years.length === 0) years.push(new Date().getFullYear());

  const getMonthValue = (year: number, month: number): MonthPerformance | undefined => {
    return data.find(d => d.year === year && d.month === month);
  };

  const getYTDValue = (year: number): number => {
    const yearData = data.filter(d => d.year === year);
    if (yearData.length === 0) return 0;
    return yearData[yearData.length - 1].overallGainPercent;
  };

  const getTotalValue = (): number => {
    if (data.length === 0) return 0;
    return data[data.length - 1].overallGainPercent;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 overflow-hidden"
      style={{ 
        background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
        border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
          Performance by month
        </h3>
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="calcMode" 
              checked={calcMode === 'accumulated'}
              onChange={() => setCalcMode('accumulated')}
              className="w-3 h-3 accent-[#3b82f6]"
            />
            <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Accum. Sessions Gains %</span>
            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="calcMode" 
              checked={calcMode === 'overall'}
              onChange={() => setCalcMode('overall')}
              className="w-3 h-3 accent-[#3b82f6]"
            />
            <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Overall Gain %</span>
            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}>?</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="balanceMode" 
              checked={balanceMode === 'initial'}
              onChange={() => setBalanceMode('initial')}
              className="w-3 h-3 accent-[#3b82f6]"
            />
            <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Initial Balance</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="balanceMode" 
              checked={balanceMode === 'current'}
              onChange={() => setBalanceMode('current')}
              className="w-3 h-3 accent-[#3b82f6]"
            />
            <span className="text-xs" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Current Balance</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium" style={{ color: 'var(--af-text-disabled, #52525b)' }}></th>
              {MONTHS.slice(1).map(month => (
                <th key={month} className="p-2 text-center text-xs font-medium" style={{ color: 'var(--af-text-disabled, #52525b)' }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map(year => (
              <tr key={year}>
                <td className="p-2 text-sm font-medium" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
                  {year}
                </td>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthData = getMonthValue(year, i);
                  const value = monthData 
                    ? (calcMode === 'accumulated' ? monthData.gainPercent : monthData.overallGainPercent)
                    : null;
                  
                  return (
                    <td key={i} className="p-1">
                      {value !== null ? (
                        <div 
                          className="px-2 py-1.5 rounded text-xs font-medium text-center"
                          style={{ 
                            backgroundColor: value >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: value >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'
                          }}
                        >
                          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                        </div>
                      ) : (
                        <div 
                          className="px-2 py-1.5 rounded text-xs text-center"
                          style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-disabled, #52525b)' }}
                        >
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="p-1">
                  <div 
                    className="px-2 py-1.5 rounded text-xs font-medium text-center"
                    style={{ 
                      backgroundColor: getYTDValue(year) >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: getYTDValue(year) >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'
                    }}
                  >
                    {getYTDValue(year) >= 0 ? '+' : ''}{getYTDValue(year).toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4 gap-2">
        <div 
          className="px-3 py-1.5 rounded text-sm"
          style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)', color: 'var(--af-text-muted, #a1a1aa)' }}
        >
          Total
        </div>
        <div 
          className="px-3 py-1.5 rounded text-sm font-medium"
          style={{ 
            backgroundColor: getTotalValue() >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: getTotalValue() >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'
          }}
        >
          {getTotalValue() >= 0 ? '+' : ''}{getTotalValue().toFixed(2)}%
        </div>
      </div>
    </motion.div>
  );
}
