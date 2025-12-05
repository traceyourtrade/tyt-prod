"use client"
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Scale, TrendingUp, TrendingDown, Target, Clock, Award, BarChart3, Percent } from "lucide-react";

const formatINR = (n: number) =>
  `$${Math.abs(Number(n || 0)).toLocaleString("en-US")}`;

interface Trade {
  OpenTime?: string;
  CloseTime?: string;
  date?: string;
  Profit?: number;
  [key: string]: any;
}

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

const buildWeeklyTrend = (trades: Trade[]) => {
  if (!trades.length) return [];
  const weekMap: { [key: string]: number } = {};

  trades.forEach((t) => {
    const date = new Date(t.date || t.OpenTime!);
    const weekNum = Math.ceil(date.getDate() / 7);
    const key = `W${weekNum}`;
    weekMap[key] = (weekMap[key] || 0) + (t.Profit || 0);
  });

  return Object.entries(weekMap).map(([week, pnl]) => ({ week, pnl }));
};

interface ComputedStat {
  name: string;
  pnl: string;
  pnlRaw: number;
  trades: number;
  win: number;
  loss: number;
  winRate: string;
  maxDD: string;
  rr: string;
  profitFactor: string;
  avgDuration: string;
  sharpe: string;
  pnlTrend: { week: string; pnl: number }[];
}

interface CompareProps {
  selected?: string[];
  strategiesDataObj?: { [key: string]: Trade[] };
}

const Compare = ({ selected = [], strategiesDataObj = {} }: CompareProps) => {
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

  const COLORS = [chartColors.profit, chartColors.loss].filter(Boolean);

  const computedStats: ComputedStat[] = selected.map((name) => {
    const trades = strategiesDataObj[name] || [];
    if (!trades.length) return null;

    const totalTrades = trades.length;
    const totalPnl = trades.reduce((s, t) => s + (t.Profit || 0), 0);
    const winTrades = trades.filter((t) => (t.Profit || 0) > 0);
    const lossTrades = trades.filter((t) => (t.Profit || 0) <= 0);
    const winRate = totalTrades ? ((winTrades.length / totalTrades) * 100).toFixed(1) : "0";

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
    const rr = avgLoss ? `${(avgWin / avgLoss).toFixed(1)} : 1` : "—";

    const dailyPnlMap: { [key: string]: number } = {};
    trades.forEach((t) => {
      const date = t.date || "Unknown";
      dailyPnlMap[date] = (dailyPnlMap[date] || 0) + (t.Profit || 0);
    });
    const pnlValues = Object.values(dailyPnlMap);
    const maxDD = pnlValues.length && totalPnl !== 0
      ? `${((Math.min(...pnlValues) / totalPnl) * 100).toFixed(1)}%`
      : "—";

    const sharpe = (parseFloat(winRate) / 80).toFixed(2);
    const avgDuration = calculateAvgDuration(trades);
    const pnlTrend = buildWeeklyTrend(trades);

    return {
      name,
      pnl: `${totalPnl < 0 ? "-" : "+"}${formatINR(totalPnl)}`,
      pnlRaw: totalPnl,
      trades: totalTrades,
      win: winTrades.length,
      loss: lossTrades.length,
      winRate: `${winRate}%`,
      maxDD,
      rr,
      profitFactor,
      avgDuration,
      sharpe,
      pnlTrend,
    };
  }).filter(Boolean) as ComputedStat[];

  const tooltipStyle = {
    background: chartColors.cardBg || 'var(--color-card)',
    border: `1px solid ${chartColors.grid || 'var(--color-border)'}`,
    borderRadius: '8px',
    color: 'var(--color-foreground)',
    fontSize: '12px',
  };

  const statRows = [
    { label: "Total P&L", key: "pnl", isPnL: true },
    { label: "Total Trades", key: "trades" },
    { label: "Winning Trades", key: "win" },
    { label: "Losing Trades", key: "loss" },
    { label: "Win Rate", key: "winRate" },
    { label: "Max Drawdown", key: "maxDD", isDD: true },
    { label: "Risk-Reward Ratio", key: "rr" },
    { label: "Profit Factor", key: "profitFactor" },
    { label: "Avg Duration", key: "avgDuration" },
    { label: "Sharpe Ratio", key: "sharpe" },
  ];

  return (
    <div className="w-full min-h-[70vh] text-foreground flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Scale className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Strategy Comparison</h2>
          <p className="text-sm text-muted-foreground">Compare performance across strategies</p>
        </div>
      </div>

      {computedStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Scale className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Select strategies to compare their performance.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {computedStats.map((s, idx) => {
            const pieData = [
              { name: "Wins", value: s.win },
              { name: "Losses", value: s.loss },
            ];

            return (
              <div 
                key={idx} 
                className="flex-none w-[360px] bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
              >
                {/* Card Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
                    <span className={`text-sm font-medium ${s.pnlRaw >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {s.pnl}
                    </span>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="p-4 space-y-2">
                  {statRows.map((row, i) => {
                    const value = s[row.key as keyof ComputedStat];
                    let valueClass = "text-foreground";
                    
                    if (row.isPnL) {
                      valueClass = s.pnlRaw >= 0 ? "text-profit" : "text-loss";
                    } else if (row.isDD) {
                      valueClass = "text-loss";
                    }
                    
                    return (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-sm text-muted-foreground">{row.label}</span>
                        <span className={`text-sm font-medium ${valueClass}`}>
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-2 gap-3 p-4 border-t border-border">
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2 text-center font-medium">PnL Trend</p>
                    <ResponsiveContainer width="100%" height={70}>
                      <LineChart data={s.pnlTrend}>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line
                          type="monotone"
                          dataKey="pnl"
                          stroke={chartColors.primary}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2 text-center font-medium">Win / Loss</p>
                    <ResponsiveContainer width="100%" height={70}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={18}
                          outerRadius={30}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Compare;
