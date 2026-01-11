'use client';

import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Info } from "lucide-react";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

interface TradeData {
  date: string;
  Profit: number;
  [key: string]: unknown;
}

interface WinRateMetricsChartProps {
  trades: TradeData[];
}

const WinRateMetricsChart: React.FC<WinRateMetricsChartProps> = ({ trades }) => {
  const { currency, exchangeRate } = useCurrencyStore();

  const chartData = useMemo(() => {
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dateMap: { [key: string]: { wins: number; losses: number; totalWin: number; totalLoss: number } } = {};
    
    sortedTrades.forEach(trade => {
      const date = new Date(trade.date).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { wins: 0, losses: 0, totalWin: 0, totalLoss: 0 };
      }
      if (trade.Profit > 0) {
        dateMap[date].wins++;
        dateMap[date].totalWin += trade.Profit;
      } else if (trade.Profit < 0) {
        dateMap[date].losses++;
        dateMap[date].totalLoss += Math.abs(trade.Profit);
      }
    });

    let cumulativeWins = 0;
    let cumulativeLosses = 0;
    let cumulativeWinAmount = 0;
    let cumulativeLossAmount = 0;

    return Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, stats]) => {
        cumulativeWins += stats.wins;
        cumulativeLosses += stats.losses;
        cumulativeWinAmount += stats.totalWin;
        cumulativeLossAmount += stats.totalLoss;

        const totalTrades = cumulativeWins + cumulativeLosses;
        const winRate = totalTrades > 0 ? (cumulativeWins / totalTrades) * 100 : 0;
        const avgWin = cumulativeWins > 0 ? cumulativeWinAmount / cumulativeWins : 0;
        const avgLoss = cumulativeLosses > 0 ? -cumulativeLossAmount / cumulativeLosses : 0;

        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          winRate: parseFloat(winRate.toFixed(1)),
          avgWin: parseFloat(avgWin.toFixed(2)),
          avgLoss: parseFloat(avgLoss.toFixed(2)),
        };
      });
  }, [trades]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Win %' 
                ? `${entry.value}%` 
                : formatCompactCurrency(entry.value, currency, exchangeRate)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted/50">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Win % - Avg Win - Avg Loss</h3>
        </div>
        <div className="group relative">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute right-0 top-6 w-48 p-2 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs text-muted-foreground">
            Cumulative win rate and average win/loss over time
          </div>
        </div>
      </div>

      <div className="p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid 
                stroke="var(--border)" 
                strokeDasharray="3 3" 
                vertical={false}
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                opacity={0.6}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickFormatter={(v) => formatCompactCurrency(v, currency, exchangeRate)}
                tickLine={false}
                axisLine={false}
                width={55}
                opacity={0.6}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
                width={40}
                opacity={0.6}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="winRate"
                name="Win %"
                stroke="#22C55E"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="avgWin"
                name="Avg Win"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="avgLoss"
                name="Avg Loss"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
            No trading data available
          </div>
        )}
      </div>
    </div>
  );
};

export default WinRateMetricsChart;
