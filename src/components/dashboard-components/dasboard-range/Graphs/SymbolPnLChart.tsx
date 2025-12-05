'use client';

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

interface TradeData {
  date: string;
  Profit: number;
  Item: string;
  [key: string]: unknown;
}

interface SymbolPnLChartProps {
  data: TradeData[];
}

const SymbolPnLChart: React.FC<SymbolPnLChartProps> = ({ data }) => {
  const [colors, setColors] = useState({ 
    profit: '#22C55E', 
    loss: '#EF4444',
  });

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const profit = computedStyle.getPropertyValue('--profit').trim() || '#22C55E';
    const loss = computedStyle.getPropertyValue('--loss').trim() || '#EF4444';
    setColors({ profit, loss });
  }, []);

  const symbolData = Object.entries(
    data.reduce((acc: { [key: string]: { profit: number; trades: number } }, trade) => {
      const symbol = trade.Item || 'Unknown';
      if (!acc[symbol]) acc[symbol] = { profit: 0, trades: 0 };
      acc[symbol].profit += trade.Profit || 0;
      acc[symbol].trades += 1;
      return acc;
    }, {})
  )
    .map(([symbol, data]) => ({ 
      symbol, 
      profit: parseFloat(data.profit.toFixed(2)),
      trades: data.trades
    }))
    .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit))
    .slice(0, 8);

  const formatCompact = (num: number) => {
    const formatted = Intl.NumberFormat("en", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(Math.abs(num));
    return num < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { trades: number } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const trades = payload[0].payload.trades;
      return (
        <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
          <p className={`text-sm font-bold ${value >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCompact(value)}
          </p>
          <p className="text-[10px] text-muted-foreground">{trades} trades</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted/50">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">P&L by Symbol</h3>
        </div>
      </div>

      <div className="p-4">
        {symbolData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={symbolData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid 
                stroke="var(--border)" 
                strokeDasharray="3 3" 
                horizontal={false} 
                opacity={0.3}
              />
              <XAxis
                type="number"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                opacity={0.6}
              />
              <YAxis
                type="category"
                dataKey="symbol"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={60}
                opacity={0.6}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.1 }} />
              <Bar 
                dataKey="profit" 
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
              >
                {symbolData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? colors.profit : colors.loss} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No trading data available
          </div>
        )}
      </div>
    </div>
  );
};

export default SymbolPnLChart;
