'use client';

import React, { useMemo } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { BarChart3, Info } from "lucide-react";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

interface TradeData {
  date: string;
  Profit: number;
  [key: string]: unknown;
}

interface DailyCumulativePnLChartProps {
  trades: TradeData[];
}

const DailyCumulativePnLChart: React.FC<DailyCumulativePnLChartProps> = ({ trades }) => {
  const { currency, exchangeRate } = useCurrencyStore();

  const chartData = useMemo(() => {
    const dateMap: { [key: string]: number } = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.date).toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + (trade.Profit || 0);
    });

    let cumulative = 0;
    return Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, dailyPnL]) => {
        cumulative += dailyPnL;
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          daily: parseFloat(dailyPnL.toFixed(2)),
          cumulative: parseFloat(cumulative.toFixed(2)),
        };
      });
  }, [trades]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p 
              key={index} 
              className={`text-xs ${entry.dataKey === 'daily' 
                ? (entry.value >= 0 ? 'text-profit' : 'text-loss') 
                : 'text-blue-500'}`}
            >
              {entry.name}: {formatCompactCurrency(entry.value, currency, exchangeRate)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-muted/50">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Daily & Cumulative Net P&L</h3>
        </div>
        <div className="group relative">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute right-0 top-6 w-48 p-2 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs text-muted-foreground">
            Daily P&L bars with cumulative equity curve
          </div>
        </div>
      </div>

      <div className="p-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                tickFormatter={(v) => formatCompactCurrency(v, currency, exchangeRate)}
                tickLine={false}
                axisLine={false}
                width={55}
                opacity={0.6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                yAxisId="left"
                dataKey="daily"
                name="Daily P&L"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.daily >= 0 ? '#22C55E' : '#EF4444'} 
                    fillOpacity={0.6}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                name="Cumulative P&L"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
            No trading data available
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyCumulativePnLChart;
