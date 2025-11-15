"use client"
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

// ------------------------------------------------------
// 🔧 Utility Functions
// ------------------------------------------------------
const formatINR = (n: number) =>
  `$${Math.abs(Number(n || 0)).toLocaleString("en-IN")}`;

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

// ------------------------------------------------------
// 📊 Core Component
// ------------------------------------------------------
const Reports = ({ selected = [], strategiesDataObj = {} }: ReportsProps) => {
  // Combine all trades
  const allTrades = selected
    .map((s) => strategiesDataObj[s])
    .filter(Boolean)
    .flat();

  if (!allTrades.length) {
    return (
      <div className="w-full min-h-[80vh] bg-[#0f0f0f] text-white rounded-xl p-6 box-border animate-fadeIn flex flex-col gap-7">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#d57eeb] to-[#fccb90] bg-clip-text text-transparent">
          📑 Performance Report
        </h2>
        <p>No trades found for selected strategies.</p>
      </div>
    );
  }

  // ------------------------------------------------------
  // 🗓️ Group by Day
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // 🧮 Core Metrics
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // 🗂️ Day-based Aggregates
  // ------------------------------------------------------
  const loggedDays = Object.keys(dayStats).length;
  const avgTradePnl = totalTrades ? totalProfit / totalTrades : 0;
  const avgDailyNetPnl = loggedDays ? totalProfit / loggedDays : 0;

  const maxDailyDrawdown =
    dailyStats.length > 0
      ? Math.min(...dailyStats.map((d) => d.pnl))
      : 0;

  const avgDailyDrawdown =
    dailyStats.length > 0
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

  // ------------------------------------------------------
  // 🏆 Best/Worst Days
  // ------------------------------------------------------
  const bestDay = dailyStats.reduce((a, b) => (a.pnl > b.pnl ? a : b));
  const worstDay = dailyStats.reduce((a, b) => (a.pnl < b.pnl ? a : b));
  const activeDay = dailyStats.reduce((a, b) =>
    a.trades > b.trades ? a : b
  );
  const bestWinRateDay = dailyStats.reduce((a, b) =>
    parseFloat(a.winRate) > parseFloat(b.winRate) ? a : b
  );

  // ------------------------------------------------------
  // 🧠 Metrics Grid (16 items like before)
  // ------------------------------------------------------
  const metrics: Metric[] = [
    {
      label: "Net P&L",
      value: `${totalProfit < 0 ? "-" : ""}${formatINR(totalProfit)}`,
      negative: totalProfit < 0,
    },
    {
      label: "Win %",
      value: `${winRate.toFixed(2)}%`,
      negative: false,
    },
    {
      label: "Avg daily win %",
      value: `${avgDailyWinRate.toFixed(2)}%`,
      negative: false,
    },
    {
      label: "Profit factor",
      value: profitFactor,
      negative: false,
    },
    {
      label: "Trade expectancy",
      value: `${tradeExpectancy < 0 ? "-" : ""}${formatINR(tradeExpectancy)}`,
      negative: tradeExpectancy < 0,
    },
    {
      label: "Avg daily win/loss",
      value:
        avgLoss && loggedDays
          ? (avgDailyNetPnl / avgLoss).toFixed(2)
          : "—",
      negative: false,
    },
    {
      label: "Avg trade win/loss",
      value: avgLoss ? (avgWin / avgLoss).toFixed(2) : "—",
      negative: false,
    },
    {
      label: "Avg hold time",
      value: avgDurationFormatted,
      negative: false,
    },
    {
      label: "Avg net trade P&L",
      value: `${avgTradePnl < 0 ? "-" : ""}${formatINR(avgTradePnl)}`,
      negative: avgTradePnl < 0,
    },
    {
      label: "Avg daily net P&L",
      value: `${avgDailyNetPnl < 0 ? "-" : ""}${formatINR(avgDailyNetPnl)}`,
      negative: avgDailyNetPnl < 0,
    },
    {
      label: "Avg planned r-multiple",
      value: "—",
      negative: false,
    },
    {
      label: "Avg realized r-multiple",
      value: "—",
      negative: false,
    },
    {
      label: "Avg daily volume",
      value: (totalTrades / loggedDays).toFixed(1),
      negative: false,
    },
    {
      label: "Logged days",
      value: loggedDays.toString(),
      negative: false,
    },
    {
      label: "Max daily net drawdown",
      value: `${formatINR(maxDailyDrawdown)}`,
      negative: maxDailyDrawdown < 0,
    },
    {
      label: "Avg daily net drawdown",
      value: `${formatINR(avgDailyDrawdown)}`,
      negative: avgDailyDrawdown < 0,
    },
  ];

  // ------------------------------------------------------
  // 🧱 Render
  // ------------------------------------------------------
  return (
    <div className="w-full min-h-[80vh] bg-[#0f0f0f] text-white rounded-xl p-6 box-border animate-fadeIn flex flex-col gap-7">
      <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#d57eeb] to-[#fccb90] bg-clip-text text-transparent">
        📑 Performance Report
      </h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {metrics.map((m, i) => (
          <div 
            key={i} 
            className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg p-3.5 flex flex-col gap-1.5 transition-all duration-250 hover:bg-[#202020] hover:-translate-y-1"
          >
            <p className="text-[#aaa] text-xs">{m.label}</p>
            <h3 className={`text-lg font-semibold ${m.negative ? 'text-[#ff6b6b]' : 'text-white'}`}>
              {m.value}
            </h3>
          </div>
        ))}
      </div>

      {/* --- Best Days Section --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4.5 flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1">
          <h4 className="text-sm text-[#aaa] font-medium">Best performing day</h4>
          <h2 className="text-xl font-semibold text-[#22c55e]">{bestDay.day}</h2>
          <p className="text-[#22c55e] text-sm">
            <strong>{bestDay.trades} trades</strong> &nbsp;&nbsp; $
            {bestDay.pnl.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4.5 flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1">
          <h4 className="text-sm text-[#aaa] font-medium">Least performing day</h4>
          <h2 className="text-xl font-semibold text-[#ff6b6b]">{worstDay.day}</h2>
          <p className="text-[#ff6b6b] text-sm">
            <strong>{worstDay.trades} trades</strong> &nbsp;&nbsp; $
            {worstDay.pnl.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4.5 flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1">
          <h4 className="text-sm text-[#aaa] font-medium">Most active day</h4>
          <h2 className="text-xl font-semibold text-white">{activeDay.day}</h2>
          <p className="text-white text-sm">
            <strong>{activeDay.trades}</strong> trades
          </p>
        </div>

        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4.5 flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-1">
          <h4 className="text-sm text-[#aaa] font-medium">Best win rate</h4>
          <h2 className="text-xl font-semibold text-[#d57eeb]">{bestWinRateDay.day}</h2>
          <p className="text-[#d57eeb] text-sm">
            <strong>{bestWinRateDay.winRate}%</strong> /{" "}
            {bestWinRateDay.trades} trades
          </p>
        </div>
      </div>

      {/* --- Charts Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Line Chart */}
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4.5 flex flex-col gap-2.5">
          <h4 className="font-medium text-sm text-[#ccc]">📈 Trade Count by Day</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
              <XAxis dataKey="day" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="trades"
                stroke="#4e7dff"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4.5 flex flex-col gap-2.5">
          <h4 className="font-medium text-sm text-[#ccc]">🏆 Win % by Day</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
              <XAxis dataKey="day" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <Bar dataKey="winRate" fill="#22c55e" radius={[5, 5, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;