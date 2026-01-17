'use client';

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Info } from "lucide-react";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

interface DataPoint {
  time: string;
  value: number;
}

interface GradientAreaChartProps {
  data: DataPoint[];
}

const GradientAreaChart: React.FC<GradientAreaChartProps> = ({ data }) => {
  const { currency, exchangeRate } = useCurrencyStore();
  const [colors, setColors] = useState({ 
    profit: '#22C55E', 
    loss: '#EF4444',
    border: 'rgba(255,255,255,0.1)',
    muted: 'rgba(255,255,255,0.4)'
  });

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const profit = computedStyle.getPropertyValue('--profit').trim() || '#22C55E';
    const loss = computedStyle.getPropertyValue('--loss').trim() || '#EF4444';
    const border = computedStyle.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.1)';
    const muted = computedStyle.getPropertyValue('--muted-foreground').trim() || 'rgba(255,255,255,0.4)';
    setColors({ profit, loss, border, muted });
  }, []);

  const checkValueStatus = (data: DataPoint[]) => {
    const hasPositive = data.some(d => d.value > 0);
    const hasNegative = data.some(d => d.value < 0);

    if (hasPositive && hasNegative) return "both";
    if (hasPositive) return "positive";
    if (hasNegative) return "negative";
    return "both";
  };

  const status = checkValueStatus(data);

  const calculateOffset = (data: DataPoint[]) => {
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (minValue >= 0) return "0%";
    if (maxValue <= 0) return "100%";

    return `${(maxValue / (maxValue - minValue)) * 100}%`;
  };

  const zeroOffset = calculateOffset(data);

  const formatCompact = (num: number) => {
    return formatCompactCurrency(num, currency, exchangeRate, undefined, undefined, true);
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
          <p className={`text-sm font-bold ${value >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCompact(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getGradientConfig = () => {
    if (status === "positive") {
      return (
        <>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.profit} stopOpacity={0.25} />
            <stop offset="100%" stopColor={colors.profit} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.profit} />
            <stop offset="100%" stopColor={colors.profit} />
          </linearGradient>
        </>
      );
    }
    if (status === "negative") {
      return (
        <>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.loss} stopOpacity={0.05} />
            <stop offset="100%" stopColor={colors.loss} stopOpacity={0.25} />
          </linearGradient>
          <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.loss} />
            <stop offset="100%" stopColor={colors.loss} />
          </linearGradient>
        </>
      );
    }
    return (
      <>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.profit} stopOpacity={0.25} />
          <stop offset={zeroOffset} stopColor={colors.profit} stopOpacity={0} />
          <stop offset={zeroOffset} stopColor={colors.loss} stopOpacity={0} />
          <stop offset="100%" stopColor={colors.loss} stopOpacity={0.25} />
        </linearGradient>
        <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.profit} />
          <stop offset={zeroOffset} stopColor={colors.profit} />
          <stop offset={zeroOffset} stopColor={colors.loss} />
          <stop offset="100%" stopColor={colors.loss} />
        </linearGradient>
      </>
    );
  };

  return (
    <div className="bg-card backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-muted/50">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Net Cumulative P&L
          </h3>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Chart */}
      <div className="p-2">
        <ResponsiveContainer width="100%" height={265}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {getGradientConfig()}
            </defs>

            <CartesianGrid 
              stroke="var(--border)" 
              strokeDasharray="3 3" 
              vertical={false} 
              opacity={0.3}
            />
            
            <XAxis
              dataKey="time"
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
              width={55}
              opacity={0.6}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="linear"
              dataKey="value"
              stroke="url(#strokeGradient)"
              strokeWidth={1.5}
              fill="url(#chartGradient)"
              fillOpacity={1}
              isAnimationActive={true}
              animationDuration={750}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GradientAreaChart;
