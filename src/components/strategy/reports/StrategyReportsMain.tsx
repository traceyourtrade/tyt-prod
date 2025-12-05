"use client"
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { FileText, TrendingUp, TrendingDown, Activity, Award, Calendar, Clock, Target, BarChart3 } from "lucide-react";

const formatINR = (n: number) =>
  `$${Math.abs(Number(n || 0)).toLocaleString("en-US")}`;

interface Trade {
  OpenTime?: string;
  CloseTime?: string;
  date?: string;
  Profit?: number;
  [key: string]: any;
}

const getDayName = (dateStr: string) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(dateStr);
  return days[d.getUTCDay()] || "Unknown";
};

const calculateAvgDuration = (trades: Trade[]) => {
  const valid = trades.filter((t) => t.OpenTime && t.CloseTime);
  if (!valid.length) return "—";

  const totalMs = valid.reduce((sum, t) => {
    const open = new Date(t.OpenTime!.replace(/\./g, "-"));
    const close = new Date(t.CloseTime!.replace(/\./g, "-"));
    return sum + Math.abs(close.getTime() - open.getTime());
  }, 0);

  const avgMs = totalMs / valid.length;
  const mins = avgMs / (1000 * 60);
  const hours = mins / 60;
  const days = hours / 24;

  if (mins < 60) return `${mins.toFixed(1)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hr`;
  return `${days.toFixed(2)} days`;
};

interface DayStat {
  day: string;
  trades: number;
  wins: number;
  pnl: number;
  winRate?: string;
}

interface Metric {
  label: string;
  value: string;
  negative: boolean;
}

interface ReportsProps {
  selected?: string[];
  strategiesDataObj?: { [key: string]: Trade[] };
}

const Reports = ({ selected = [], strategiesDataObj = {} }: ReportsProps) => {
  const [chartColors, setChartColors] = useState({
    primary: '',
    profit: '',
    loss: '',
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
        text: style.getPropertyValue('--color-muted-foreground').trim() || '',
        grid: style.getPropertyValue('--color-border').trim() || '',
        cardBg: style.getPropertyValue('--color-card').trim() || ''
      });
    }
  }, []);

  const allTrades = selected
    .map((s) => strategiesDataObj[s])
    .filter(Boolean)
    .flat();

  if (!allTrades.length) {
    return (
      <div className="w-full min-h-[70vh] text-foreground flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Performance Report</h2>
            <p className="text-sm text-muted-foreground">Detailed trading analytics</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No trades found for selected strategies.</p>
        </div>
      </div>
    );
  }

  const dayStats: { [key: string]: DayStat } = {};
  allTrades.forEach((t) => {
    const day = getDayName(t.date || t.OpenTime!);
    if (!dayStats[day]) dayStats[day] = { day, trades: 0, wins: 0, pnl: 0 };

    dayStats[day].trades += 1;
    if ((t.Profit || 0) > 0) dayStats[day].wins += 1;
    dayStats[day].pnl += t.Profit || 0;
  });

  const orderedDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyStats = orderedDays
    .map((day) => {
      const d = dayStats[day];
      if (!d) return null;
      return {
        ...d,
        winRate: d.trades ? ((d.wins / d.trades) * 100).toFixed(1) : "0",
      };
    })
    .filter(Boolean) as (DayStat & { winRate: string })[];

  const totalTrades = allTrades.length;
  const totalProfit = allTrades.reduce((s, t) => s + (t.Profit || 0), 0);
  const winTrades = allTrades.filter((t) => (t.Profit || 0) > 0);
  const lossTrades = allTrades.filter((t) => (t.Profit || 0) <= 0);
  const winRate = totalTrades ? (winTrades.length / totalTrades) * 100 : 0;
  const avgWin =
    winTrades.length > 0
      ? winTrades.reduce((s, t) => s + (t.Profit || 0), 0) / winTrades.length
      : 0;
  const avgLoss =
    lossTrades.length > 0
      ? lossTrades.reduce((s, t) => s + Math.abs(t.Profit || 0), 0) /
      lossTrades.length
      : 0;

  const profitFactor = avgLoss ? (avgWin / avgLoss).toFixed(2) : "—";
  const tradeExpectancy = totalTrades ? totalProfit / totalTrades : 0;
  const avgDurationFormatted = calculateAvgDuration(allTrades);

  const loggedDays = Object.keys(dayStats).length;
  const avgTradePnl = totalTrades ? totalProfit / totalTrades : 0;
  const avgDailyNetPnl = loggedDays ? totalProfit / loggedDays : 0;

  const maxDailyDrawdown =
    dailyStats.length > 0
      ? Math.min(...dailyStats.map((d) => d.pnl))
      : 0;

  const avgDailyDrawdown =
    dailyStats.length > 0 && dailyStats.filter((d) => d.pnl < 0).length > 0
      ? (
        dailyStats
          .filter((d) => d.pnl < 0)
          .reduce((sum, d) => sum + d.pnl, 0) /
        dailyStats.filter((d) => d.pnl < 0).length
      )
      : 0;

  const avgDailyWinRate =
    dailyStats.length > 0
      ? (
        dailyStats.reduce((s, d) => s + Number(d.winRate || 0), 0) /
        dailyStats.length
      )
      : 0;

  const bestDay = dailyStats.reduce((a, b) => (a.pnl > b.pnl ? a : b));
  const worstDay = dailyStats.reduce((a, b) => (a.pnl < b.pnl ? a : b));
  const activeDay = dailyStats.reduce((a, b) =>
    a.trades > b.trades ? a : b
  );
  const bestWinRateDay = dailyStats.reduce((a, b) =>
    parseFloat(a.winRate) > parseFloat(b.winRate) ? a : b
  );

  const metrics: Metric[] = [
    { label: "Net P&L", value: `${totalProfit < 0 ? "-" : ""}${formatINR(totalProfit)}`, negative: totalProfit < 0 },
    { label: "Win %", value: `${winRate.toFixed(2)}%`, negative: false },
    { label: "Avg daily win %", value: `${avgDailyWinRate.toFixed(2)}%`, negative: false },
    { label: "Profit factor", value: profitFactor, negative: false },
    { label: "Trade expectancy", value: `${tradeExpectancy < 0 ? "-" : ""}${formatINR(tradeExpectancy)}`, negative: tradeExpectancy < 0 },
    { label: "Avg daily win/loss", value: avgLoss && loggedDays ? (avgDailyNetPnl / avgLoss).toFixed(2) : "—", negative: false },
    { label: "Avg trade win/loss", value: avgLoss ? (avgWin / avgLoss).toFixed(2) : "—", negative: false },
    { label: "Avg hold time", value: avgDurationFormatted, negative: false },
    { label: "Avg net trade P&L", value: `${avgTradePnl < 0 ? "-" : ""}${formatINR(avgTradePnl)}`, negative: avgTradePnl < 0 },
    { label: "Avg daily net P&L", value: `${avgDailyNetPnl < 0 ? "-" : ""}${formatINR(avgDailyNetPnl)}`, negative: avgDailyNetPnl < 0 },
    { label: "Avg planned r-multiple", value: "—", negative: false },
    { label: "Avg realized r-multiple", value: "—", negative: false },
    { label: "Avg daily volume", value: (totalTrades / loggedDays).toFixed(1), negative: false },
    { label: "Logged days", value: loggedDays.toString(), negative: false },
    { label: "Max daily net drawdown", value: `${formatINR(maxDailyDrawdown)}`, negative: maxDailyDrawdown < 0 },
    { label: "Avg daily net drawdown", value: `${formatINR(avgDailyDrawdown)}`, negative: avgDailyDrawdown < 0 },
  ];

  const tooltipStyle = {
    background: chartColors.cardBg || 'var(--color-card)',
    border: `1px solid ${chartColors.grid || 'var(--color-border)'}`,
    borderRadius: '8px',
    color: 'var(--color-foreground)',
  };

  const dayHighlights = [
    { label: "Best performing day", day: bestDay.day, value: `$${bestDay.pnl.toLocaleString("en-US")}`, sub: `${bestDay.trades} trades`, type: "profit", icon: TrendingUp },
    { label: "Least performing day", day: worstDay.day, value: `$${worstDay.pnl.toLocaleString("en-US")}`, sub: `${worstDay.trades} trades`, type: "loss", icon: TrendingDown },
    { label: "Most active day", day: activeDay.day, value: `${activeDay.trades}`, sub: "trades", type: "primary", icon: Activity },
    { label: "Best win rate", day: bestWinRateDay.day, value: `${bestWinRateDay.winRate}%`, sub: `${bestWinRateDay.trades} trades`, type: "primary", icon: Award },
  ];

  return (
    <div className="w-full min-h-[70vh] text-foreground flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Performance Report</h2>
          <p className="text-sm text-muted-foreground">Detailed trading analytics</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {metrics.map((m, i) => (
          <div 
            key={i} 
            className="bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
          >
            <p className="text-muted-foreground text-xs font-medium">{m.label}</p>
            <h3 className={`text-lg font-bold mt-1 ${m.negative ? 'text-loss' : 'text-foreground'}`}>
              {m.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Day Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dayHighlights.map((highlight, i) => {
          const Icon = highlight.icon;
          const colorClass = highlight.type === "profit" ? "text-profit" : highlight.type === "loss" ? "text-loss" : "text-primary";
          const bgClass = highlight.type === "profit" ? "bg-profit/10" : highlight.type === "loss" ? "bg-loss/10" : "bg-primary/10";
          
          return (
            <div 
              key={i}
              className="bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-xs font-medium">{highlight.label}</span>
                <div className={`w-7 h-7 rounded-lg ${bgClass} flex items-center justify-center`}>
                  <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
                </div>
              </div>
              <h2 className={`text-xl font-bold ${colorClass}`}>{highlight.day}</h2>
              <p className={`text-sm ${colorClass} mt-1`}>
                <span className="font-semibold">{highlight.value}</span> {highlight.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line Chart */}
        <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Trade Count by Day</h3>
              <span className="text-xs text-muted-foreground">Weekly distribution</span>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="day" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="trades"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ r: 4, fill: chartColors.primary }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-profit" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Win % by Day</h3>
              <span className="text-xs text-muted-foreground">Success rate per day</span>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="day" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="winRate" fill={chartColors.profit} radius={[6, 6, 0, 0]} name="Win %" />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
