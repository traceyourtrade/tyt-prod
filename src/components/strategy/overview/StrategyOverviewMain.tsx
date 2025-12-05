"use client"
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Percent, BarChart3, Clock, DollarSign, Target, PieChartIcon, Activity } from "lucide-react";
import { formatCompactNumber } from "@/utils/formatNumber";

interface Trade {
  date: string;
  Profit?: number;
  OpenTime?: string;
  CloseTime?: string;
  [key: string]: any;
}

interface OverviewSectionProps {
  selected?: string[];
  strategiesDataObj?: { [key: string]: Trade[] };
}

const OverviewSection = ({ selected = [], strategiesDataObj = {} }: OverviewSectionProps) => {
  const [chartColors, setChartColors] = useState({
    primary: '',
    profit: '',
    loss: '',
    primaryLight: '',
    primaryDark: '',
    warning: '',
    text: '',
    grid: '',
    cardBg: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      setChartColors({
        primary: style.getPropertyValue('--color-primary').trim() || '',
        profit: style.getPropertyValue('--color-profit').trim() || '',
        loss: style.getPropertyValue('--color-loss').trim() || '',
        primaryLight: style.getPropertyValue('--color-primary-light').trim() || '',
        primaryDark: style.getPropertyValue('--color-primary-dark').trim() || '',
        warning: style.getPropertyValue('--color-warning').trim() || '',
        text: style.getPropertyValue('--color-muted-foreground').trim() || '',
        grid: style.getPropertyValue('--color-border').trim() || '',
        cardBg: style.getPropertyValue('--color-card').trim() || ''
      });
    }
  }, []);

  const profitByStrategy = selected.map((name) => {
    const trades = strategiesDataObj[name] || [];
    const totalPnl = trades.reduce((sum, t) => sum + (t.Profit || 0), 0);
    return { name, pnl: totalPnl };
  });

  const allTrades = Object.values(strategiesDataObj).flat();
  const totalProfit = allTrades.reduce((sum, t) => sum + (t.Profit || 0), 0);
  const totalTrades = allTrades.length;

  const winTrades = allTrades.filter((t) => t.Profit && t.Profit > 0).length;
  const winRate = totalTrades ? ((winTrades / totalTrades) * 100).toFixed(1) : "0";

  const avgDurationFormatted = (() => {
    const valid = allTrades.filter((t): t is Trade & { OpenTime: string; CloseTime: string } => 
      Boolean(t.OpenTime) && Boolean(t.CloseTime)
    );
    if (!valid.length) return "—";

    const totalDurationMs = valid.reduce((sum, t) => {
      const open = new Date(t.OpenTime.replace(/\./g, "-"));
      const close = new Date(t.CloseTime.replace(/\./g, "-"));
      return sum + Math.abs(close.getTime() - open.getTime());
    }, 0);

    const avgMs = totalDurationMs / valid.length;
    const mins = avgMs / (1000 * 60);
    const hours = mins / 60;
    const days = hours / 24;

    if (mins < 60) return `${mins.toFixed(1)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hr`;
    return `${days.toFixed(2)} days`;
  })();

  const profitByDateMap: { [key: string]: number } = {};
  allTrades.forEach((t) => {
    const date = t.date || "Unknown";
    profitByDateMap[date] = (profitByDateMap[date] || 0) + (t.Profit || 0);
  });

  const performanceOverTime = Object.entries(profitByDateMap).map(
    ([date, profit]) => ({ date, profit })
  );

  const strategyDistribution = selected.map((name) => ({
    name,
    value: strategiesDataObj[name]?.length || 0,
  }));

  const COLORS = [chartColors.primary, chartColors.profit, chartColors.warning, chartColors.primaryLight, chartColors.loss, chartColors.primaryDark].filter(Boolean);

  const stats = [
    {
      label: "Total P&L",
      value: `$${formatCompactNumber(totalProfit, 2)}`,
      sub: "Net Profit",
      icon: DollarSign,
      color: totalProfit >= 0 ? "profit" : "loss",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      sub: "Profitable Trades",
      icon: Percent,
      color: "primary",
    },
    {
      label: "Total Trades",
      value: `${totalTrades}`,
      sub: "Across All Strategies",
      icon: BarChart3,
      color: "primary",
    },
    {
      label: "Avg Duration",
      value: avgDurationFormatted,
      sub: "Per Trade",
      icon: Clock,
      color: "primary",
    },
  ];

  const tooltipStyle = {
    background: chartColors.cardBg || 'var(--color-card)',
    border: `1px solid ${chartColors.grid || 'var(--color-border)'}`,
    borderRadius: '8px',
    color: 'var(--color-foreground)',
  };

  return (
    <div className="w-full min-h-[70vh] text-foreground flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Strategy Overview</h2>
          <p className="text-sm text-muted-foreground">{selected.length} strategies selected</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const colorClass = s.color === "profit" ? "text-profit" : s.color === "loss" ? "text-loss" : "text-primary";
          const bgClass = s.color === "profit" ? "bg-profit/10" : s.color === "loss" ? "bg-loss/10" : "bg-primary/10";
          
          return (
            <div 
              key={i} 
              className="bg-card border border-border rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground text-sm font-medium">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${colorClass}`}>{s.value}</div>
              <div className="text-muted-foreground text-xs mt-1">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profit by Strategy */}
        <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Profit by Strategy</h3>
              <span className="text-xs text-muted-foreground">Net P&L per strategy</span>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={profitByStrategy}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="pnl" fill={chartColors.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Over Time */}
        <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Performance Over Time</h3>
              <span className="text-xs text-muted-foreground">Daily P&L trend</span>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="date" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke={chartColors.primaryLight}
                  strokeWidth={2}
                  dot={{ r: 3, fill: chartColors.primaryLight }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy Distribution */}
        <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <PieChartIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Strategy Distribution</h3>
              <span className="text-xs text-muted-foreground">Trade count by strategy</span>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={strategyDistribution}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {strategyDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
