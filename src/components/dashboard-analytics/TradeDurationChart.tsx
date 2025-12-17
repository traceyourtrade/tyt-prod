'use client';

import React, { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Clock, Info } from "lucide-react";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

interface TradeData {
  date: string;
  time?: string;
  OpenTime?: string;
  CloseTime?: string;
  Profit: number;
  [key: string]: unknown;
}

interface TradeDurationChartProps {
  trades: TradeData[];
}

const TradeDurationChart: React.FC<TradeDurationChartProps> = ({ trades }) => {
  const { currency, exchangeRate } = useCurrencyStore();

  const chartData = useMemo(() => {
    const parseTradeTime = (timeStr: string): Date | null => {
      try {
        const normalized = timeStr.replace(/\./g, '-').replace(' ', 'T');
        const date = new Date(normalized);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    };

    return trades
      .filter(trade => trade.OpenTime && trade.CloseTime)
      .map(trade => {
        const openTime = parseTradeTime(trade.OpenTime!);
        const closeTime = parseTradeTime(trade.CloseTime!);
        
        if (!openTime || !closeTime) {
          return null;
        }
        
        const durationMinutes = Math.max(1, Math.round((closeTime.getTime() - openTime.getTime()) / 60000));
        
        return {
          duration: durationMinutes,
          profit: trade.Profit || 0,
          durationLabel: durationMinutes < 60 
            ? `${durationMinutes}m` 
            : durationMinutes < 1440 
              ? `${Math.round(durationMinutes / 60)}h` 
              : `${Math.round(durationMinutes / 1440)}d`,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null && d.duration > 0 && d.duration < 10080);
  }, [trades]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-0.5">Duration: {data.durationLabel}</p>
          <p className={`text-sm font-bold ${data.profit >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCompactCurrency(data.profit, currency, exchangeRate)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted/50">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Trade Duration Performance</h3>
        </div>
        <div className="group relative">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute right-0 top-6 w-48 p-2 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs text-muted-foreground">
            Shows P&L based on how long you held each trade
          </div>
        </div>
      </div>

      <div className="p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid 
                stroke="var(--border)" 
                strokeDasharray="3 3" 
                opacity={0.3}
              />
              <XAxis
                type="number"
                dataKey="duration"
                name="Duration"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickFormatter={formatDuration}
                tickLine={false}
                axisLine={false}
                opacity={0.6}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis
                type="number"
                dataKey="profit"
                name="P&L"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickFormatter={(v) => formatCompactCurrency(v, currency, exchangeRate)}
                tickLine={false}
                axisLine={false}
                width={55}
                opacity={0.6}
              />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Trades" data={chartData} fillOpacity={0.7}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.profit >= 0 ? '#22C55E' : '#EF4444'} 
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
            No trade duration data available
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeDurationChart;
