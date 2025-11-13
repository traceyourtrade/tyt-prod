import "./Reports.css";
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
const formatINR = (n) =>
  `$${Math.abs(Number(n || 0)).toLocaleString("en-IN")}`;

const getDayName = (dateStr) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(dateStr);
  return days[d.getUTCDay()] || "Unknown";
};

const calculateAvgDuration = (trades) => {
  const valid = trades.filter((t) => t.OpenTime && t.CloseTime);
  if (!valid.length) return "—";

  const totalMs = valid.reduce((sum, t) => {
    const open = new Date(t.OpenTime.replace(/\./g, "-"));
    const close = new Date(t.CloseTime.replace(/\./g, "-"));
    return sum + Math.abs(close - open);
  }, 0);

  const avgMs = totalMs / valid.length;
  const mins = avgMs / (1000 * 60);
  const hours = mins / 60;
  const days = hours / 24;

  if (mins < 60) return `${mins.toFixed(1)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hr`;
  return `${days.toFixed(2)} days`;
};

// ------------------------------------------------------
// 📊 Core Component
// ------------------------------------------------------
const Reports = ({ selected = [], strategiesDataObj = {} }) => {
  // Combine all trades
  // const allTrades = Object.values(strategiesDataObj).flat();

  const allTrades = selected
    .map((s) => strategiesDataObj[s])
    .filter(Boolean)
    .flat();

  if (!allTrades.length) {
    return (
      <div className="reports-wrapper">
        <h2 className="reports-title">📑 Performance Report</h2>
        <p>No trades found for selected strategies.</p>
      </div>
    );
  }

  // ------------------------------------------------------
  // 🗓️ Group by Day
  // ------------------------------------------------------
  const dayStats = {};
  allTrades.forEach((t) => {
    const day = getDayName(t.date || t.OpenTime);
    if (!dayStats[day]) dayStats[day] = { day, trades: 0, wins: 0, pnl: 0 };

    dayStats[day].trades += 1;
    if (t.Profit > 0) dayStats[day].wins += 1;
    dayStats[day].pnl += t.Profit || 0;
  });

  const orderedDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyStats = orderedDays
    .map((day) => {
      const d = dayStats[day];
      if (!d) return null;
      return {
        ...d,
        winRate: d.trades ? ((d.wins / d.trades) * 100).toFixed(1) : 0,
      };
    })
    .filter(Boolean);

  // ------------------------------------------------------
  // 🧮 Core Metrics
  // ------------------------------------------------------
  const totalTrades = allTrades.length;
  const totalProfit = allTrades.reduce((s, t) => s + (t.Profit || 0), 0);
  const winTrades = allTrades.filter((t) => t.Profit > 0);
  const lossTrades = allTrades.filter((t) => t.Profit <= 0);
  const winRate = totalTrades ? (winTrades.length / totalTrades) * 100 : 0;
  const avgWin =
    winTrades.length > 0
      ? winTrades.reduce((s, t) => s + t.Profit, 0) / winTrades.length
      : 0;
  const avgLoss =
    lossTrades.length > 0
      ? lossTrades.reduce((s, t) => s + Math.abs(t.Profit), 0) /
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
      ).toFixed(2)
      : 0;

  const avgDailyWinRate =
    dailyStats.length > 0
      ? (
        dailyStats.reduce((s, d) => s + Number(d.winRate || 0), 0) /
        dailyStats.length
      ).toFixed(2)
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
  const metrics = [
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
      value: `${avgDailyWinRate}%`,
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
      value: loggedDays,
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
    <div className="reports-wrapper">
      <h2 className="reports-title">📑 Performance Report</h2>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <div key={i} className="metric-card">
            <p className="metric-label">{m.label}</p>
            <h3 className={`metric-value ${m.negative ? "negative" : ""}`}>
              {m.value}
            </h3>
          </div>
        ))}
      </div>

      {/* --- Best Days Section --- */}
      <div className="best-days">
        <div className="day-card good">
          <h4>Best performing day</h4>
          <h2>{bestDay.day}</h2>
          <p>
            <strong>{bestDay.trades} trades</strong> &nbsp;&nbsp; $
            {bestDay.pnl.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="day-card bad">
          <h4>Least performing day</h4>
          <h2>{worstDay.day}</h2>
          <p>
            <strong>{worstDay.trades} trades</strong> &nbsp;&nbsp; $
            {worstDay.pnl.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="day-card neutral">
          <h4>Most active day</h4>
          <h2>{activeDay.day}</h2>
          <p>
            <strong>{activeDay.trades}</strong> trades
          </p>
        </div>

        <div className="day-card purple">
          <h4>Best win rate</h4>
          <h2>{bestWinRateDay.day}</h2>
          <p>
            <strong>{bestWinRateDay.winRate}%</strong> /{" "}
            {bestWinRateDay.trades} trades
          </p>
        </div>
      </div>

      {/* --- Charts Row --- */}
      <div className="charts-row">
        {/* Line Chart */}
        <div className="chart-box">
          <h4>📈 Trade Count by Day</h4>
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
        <div className="chart-box">
          <h4>🏆 Win % by Day</h4>
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
