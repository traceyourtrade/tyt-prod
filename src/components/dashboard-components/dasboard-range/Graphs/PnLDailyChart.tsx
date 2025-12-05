'use client';

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Info } from "lucide-react";

interface DataPoint {
  time: string;
  value: number;
}

interface GradientAreaChartProps {
  data: DataPoint[];
}

const GradientAreaChart: React.FC<GradientAreaChartProps> = ({ data }) => {
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
    const formatted = Intl.NumberFormat("en", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(Math.abs(num));

    return num < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`text-sm font-semibold ${value >= 0 ? 'text-profit' : 'text-loss'}`}>
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
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="var(--profit)" stopOpacity={0} />
        </linearGradient>
      );
    }
    if (status === "negative") {
      return (
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--loss)" stopOpacity={0.1} />
          <stop offset="100%" stopColor="var(--loss)" stopOpacity={0.4} />
        </linearGradient>
      );
    }
    return (
      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.4} />
        <stop offset={zeroOffset} stopColor="var(--profit)" stopOpacity={0} />
        <stop offset={zeroOffset} stopColor="var(--loss)" stopOpacity={0} />
        <stop offset="100%" stopColor="var(--loss)" stopOpacity={0.4} />
      </linearGradient>
    );
  };

  const strokeColor = status === "negative" ? "var(--loss)" : status === "positive" ? "var(--profit)" : "var(--primary)";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Net Cumulative P&L
          </h3>
        </div>
        <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Chart */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {getGradientConfig()}
            </defs>

            <CartesianGrid 
              stroke="var(--border)" 
              strokeDasharray="3 3" 
              vertical={false} 
            />
            
            <XAxis
              dataKey="time"
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={formatCompact}
              tickLine={false}
              axisLine={false}
              width={60}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
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
