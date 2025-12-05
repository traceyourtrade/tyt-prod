'use client';

import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAccountDetails from '@/store/accountdetails';
import datesforcal from '@/store/datesforcal';

interface TradeData {
  date: string;
  Profit: number;
  [key: string]: unknown;
}

interface Account {
  tradeData?: TradeData[];
  accountBalance?: number;
  [key: string]: unknown;
}

export default function PerformanceRadar() {
  const [isDark, setIsDark] = useState(true);
  const { selectedAccounts } = useAccountDetails();
  const { calMonth, calYear } = datesforcal();

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  function isCurrentMonth(dateString: string): boolean {
    const date = new Date(dateString);
    return date.getFullYear() === calYear && (date.getMonth() + 1) === calMonth;
  }

  const thisMonthData = (selectedAccounts as Account[]).flatMap((account) => {
    if (!account.tradeData) return [];
    return account.tradeData.filter(trade => isCurrentMonth(trade.date));
  });

  const calculateMetrics = () => {
    if (thisMonthData.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        avgWinLoss: 0,
        recoveryFactor: 0,
        maxDrawdown: 0,
        consistency: 0,
        overallScore: 0
      };
    }

    const winners = thisMonthData.filter(t => t.Profit > 0);
    const losers = thisMonthData.filter(t => t.Profit < 0);
    
    const winRate = (winners.length / thisMonthData.length) * 100;
    
    const totalProfit = winners.reduce((sum, t) => sum + t.Profit, 0);
    const totalLoss = Math.abs(losers.reduce((sum, t) => sum + t.Profit, 0));
    const profitFactor = totalLoss > 0 ? (totalProfit / totalLoss) : totalProfit > 0 ? 10 : 0;
    
    const avgWin = winners.length > 0 ? totalProfit / winners.length : 0;
    const avgLoss = losers.length > 0 ? totalLoss / losers.length : 0;
    const avgWinLoss = avgLoss > 0 ? (avgWin / avgLoss) : avgWin > 0 ? 10 : 0;

    let peak = 0;
    let maxDD = 0;
    let cumulative = 0;
    thisMonthData.forEach(trade => {
      cumulative += trade.Profit;
      if (cumulative > peak) peak = cumulative;
      const dd = peak - cumulative;
      if (dd > maxDD) maxDD = dd;
    });
    const maxDrawdownPct = peak > 0 ? (maxDD / peak) * 100 : 0;
    
    const netProfit = thisMonthData.reduce((sum, t) => sum + t.Profit, 0);
    const recoveryFactor = maxDD > 0 ? netProfit / maxDD : netProfit > 0 ? 10 : 0;

    const profitDays = new Set(thisMonthData.filter(t => t.Profit > 0).map(t => t.date)).size;
    const totalDays = new Set(thisMonthData.map(t => t.date)).size;
    const consistency = totalDays > 0 ? (profitDays / totalDays) * 100 : 0;

    const normalizedWinRate = Math.min(winRate, 100);
    const normalizedPF = Math.min(profitFactor * 20, 100);
    const normalizedAvgWL = Math.min(avgWinLoss * 25, 100);
    const normalizedRecovery = Math.min(recoveryFactor * 10, 100);
    const normalizedDrawdown = Math.max(100 - maxDrawdownPct * 2, 0);
    const normalizedConsistency = Math.min(consistency, 100);

    const overallScore = (
      normalizedWinRate * 0.2 +
      normalizedPF * 0.2 +
      normalizedAvgWL * 0.15 +
      normalizedRecovery * 0.15 +
      normalizedDrawdown * 0.15 +
      normalizedConsistency * 0.15
    );

    return {
      winRate: normalizedWinRate,
      profitFactor: normalizedPF,
      avgWinLoss: normalizedAvgWL,
      recoveryFactor: normalizedRecovery,
      maxDrawdown: normalizedDrawdown,
      consistency: normalizedConsistency,
      overallScore: Math.min(overallScore, 100)
    };
  };

  const metrics = calculateMetrics();

  const chartData = [
    { metric: 'Win %', value: metrics.winRate, fullMark: 100 },
    { metric: 'Profit factor', value: metrics.profitFactor, fullMark: 100 },
    { metric: 'Avg win/loss', value: metrics.avgWinLoss, fullMark: 100 },
    { metric: 'Recovery factor', value: metrics.recoveryFactor, fullMark: 100 },
    { metric: 'Max drawdown', value: metrics.maxDrawdown, fullMark: 100 },
    { metric: 'Consistency', value: metrics.consistency, fullMark: 100 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#84CC16';
    if (score >= 40) return '#FACC15';
    if (score >= 20) return '#F97316';
    return '#EF4444';
  };

  const gradientStops = [
    { offset: '0%', color: '#EF4444' },
    { offset: '25%', color: '#F97316' },
    { offset: '50%', color: '#FACC15' },
    { offset: '75%', color: '#84CC16' },
    { offset: '100%', color: '#22C55E' },
  ];

  return (
    <div className={cn(
      "w-full flex flex-col rounded-2xl border transition-colors overflow-hidden",
      "bg-card/50 backdrop-blur-sm border-border/50"
    )}>
      <div className="w-full flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Performance Score
          </h2>
        </div>
        <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      <div className="w-full p-4 flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <defs>
              <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <PolarGrid 
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
              strokeDasharray="3 3"
            />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ 
                fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', 
                fontSize: 11,
                fontWeight: 500
              }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#radarFill)"
              dot={{ 
                r: 4, 
                fill: '#2563EB',
                stroke: isDark ? '#0a0a0a' : '#ffffff',
                strokeWidth: 2
              }}
            />
          </RadarChart>
        </ResponsiveContainer>

        <div className="w-full mt-4 px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Your Score</span>
            <span 
              className="text-2xl font-bold"
              style={{ color: getScoreColor(metrics.overallScore) }}
            >
              {metrics.overallScore.toFixed(2)}
            </span>
          </div>
          
          <div className="relative w-full h-3 rounded-full overflow-hidden bg-muted/30">
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(to right, ${gradientStops.map(s => s.color).join(', ')})`
              }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-500"
              style={{ 
                left: `calc(${Math.min(metrics.overallScore, 100)}% - 8px)`,
                backgroundColor: getScoreColor(metrics.overallScore)
              }}
            />
          </div>
          
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">0</span>
            <span className="text-[10px] text-muted-foreground">20</span>
            <span className="text-[10px] text-muted-foreground">40</span>
            <span className="text-[10px] text-muted-foreground">60</span>
            <span className="text-[10px] text-muted-foreground">80</span>
            <span className="text-[10px] text-muted-foreground">100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
