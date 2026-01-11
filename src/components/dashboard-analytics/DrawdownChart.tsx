'use client';

import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, Info } from "lucide-react";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

interface TradeData {
  date: string;
  Profit: number;
  [key: string]: unknown;
}

interface DrawdownChartProps {
  trades: TradeData[];
  startingBalance?: number;
}

const DrawdownChart: React.FC<DrawdownChartProps> = ({ trades, startingBalance = 10000 }) => {
  const { currency, exchangeRate } = useCurrencyStore();

  const chartData = useMemo(() => {
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const initialBalance = startingBalance > 0 ? startingBalance : 10000;
    let balance = initialBalance;
    let peak = initialBalance;
    const data: { date: string; drawdown: number; balance: number }[] = [];

    const dateMap: { [key: string]: number } = {};
    sortedTrades.forEach(trade => {
      const date = new Date(trade.date).toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + (trade.Profit || 0);
    });

    Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(([date, dailyPnL]) => {
        balance += dailyPnL;
        if (balance > peak) peak = balance;
        
        const drawdown = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
        const safeDrawdown = isFinite(drawdown) ? drawdown : 0;
        
        data.push({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          drawdown: -parseFloat(safeDrawdown.toFixed(2)),
          balance: parseFloat(balance.toFixed(2)),
        });
      });

    return data;
  }, [trades, startingBalance]);

  const maxDrawdown = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.min(...chartData.map(d => d.drawdown));
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
          <p className="text-xs text-loss">
            Drawdown: {payload[0].value.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Balance: {formatCompactCurrency(payload[0].payload.balance, currency, exchangeRate)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10">
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Drawdown</h3>
            <p className="text-xs text-muted-foreground">Max: {maxDrawdown.toFixed(2)}%</p>
          </div>
        </div>
        <div className="group relative">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute right-0 top-6 w-48 p-2 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs text-muted-foreground">
            Peak-to-trough decline in account equity
          </div>
        </div>
      </div>

      <div className="p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
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
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
                width={45}
                opacity={0.6}
                domain={['dataMin', 0]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#drawdownGradient)"
              />
            </AreaChart>
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

export default DrawdownChart;
