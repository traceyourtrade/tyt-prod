'use client';

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

interface TradeData {
  date: string;
  Profit: number;
  [key: string]: unknown;
}

interface DailyPnLBarChartProps {
  data: TradeData[];
}

const DailyPnLBarChart: React.FC<DailyPnLBarChartProps> = ({ data }) => {
  const { currency, exchangeRate } = useCurrencyStore();
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

  const dailyData = Object.entries(
    data.reduce((acc: { [key: string]: number }, trade) => {
      const day = new Date(trade.date).getDate().toString();
      acc[day] = (acc[day] || 0) + (trade.Profit || 0);
      return acc;
    }, {})
  )
    .map(([day, profit]) => ({ 
      day, 
      profit: parseFloat(profit.toFixed(2)),
      fill: profit >= 0 ? colors.profit : colors.loss
    }))
    .sort((a, b) => parseInt(a.day) - parseInt(b.day));

  const formatCompact = (num: number) => {
    return formatCompactCurrency(num, currency, exchangeRate);
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-0.5">Day {label}</p>
          <p className={`text-sm font-bold ${value >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCompact(value)}
          </p>
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
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Daily P&L</h3>
        </div>
      </div>

      <div className="p-4">
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid 
                stroke="var(--border)" 
                strokeDasharray="3 3" 
                vertical={false} 
                opacity={0.3}
              />
              <XAxis
                dataKey="day"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                opacity={0.6}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                width={50}
                opacity={0.6}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.1 }} />
              <Bar 
                dataKey="profit" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {dailyData.map((entry, index) => (
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

export default DailyPnLBarChart;
