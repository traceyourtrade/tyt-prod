import "./Overview.css";
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

const OverviewSection = ({ selected = [], strategiesDataObj = {} }) => {
  // --- Log incoming props ---
  // console.log("Selected strategies", selected);
  // console.log("Strategy data refined", strategiesDataObj);

  // -------------------------------
  // 🧮 Derived data
  // -------------------------------

  // Calculate total profit, total trades, and per-strategy profit
  const profitByStrategy = selected.map((name) => {
    const trades = strategiesDataObj[name] || [];
    const totalPnl = trades.reduce((sum, t) => sum + (t.Profit || 0), 0);
    return { name, pnl: totalPnl };
  });

  const allTrades = Object.values(strategiesDataObj).flat();
  const totalProfit = allTrades.reduce((sum, t) => sum + (t.Profit || 0), 0);
  const totalTrades = allTrades.length;

  // Win rate = % of profitable trades
  const winTrades = allTrades.filter((t) => t.Profit > 0).length;
  const winRate = totalTrades ? ((winTrades / totalTrades) * 100).toFixed(1) : 0;

  // Avg duration (in mins/hours/days auto-scaled)
  const avgDurationFormatted = (() => {
    const valid = allTrades.filter((t) => t.OpenTime && t.CloseTime);
    if (!valid.length) return "—";

    const totalDurationMs = valid.reduce((sum, t) => {
      const open = new Date(t.OpenTime.replace(/\./g, "-"));
      const close = new Date(t.CloseTime.replace(/\./g, "-"));
      return sum + Math.abs(close - open);
    }, 0);

    const avgMs = totalDurationMs / valid.length;
    const mins = avgMs / (1000 * 60);
    const hours = mins / 60;
    const days = hours / 24;

    if (mins < 60) return `${mins.toFixed(1)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hr`;
    return `${days.toFixed(2)} days`;
  })();

  // Chart 1 — Profit by Strategy (already derived above)
  // Chart 2 — Performance Over Time (group by date)
  const profitByDateMap = {};
  allTrades.forEach((t) => {
    const date = t.date || "Unknown";
    profitByDateMap[date] = (profitByDateMap[date] || 0) + (t.Profit || 0);
  });

  const performanceOverTime = Object.entries(profitByDateMap).map(
    ([date, profit]) => ({ date, profit })
  );

  // Chart 3 — Strategy Distribution (based on trade count)
  const strategyDistribution = selected.map((name) => ({
    name,
    value: strategiesDataObj[name]?.length || 0,
  }));

  const COLORS = ["#d57eeb", "#22c55e", "#facc15", "#60a5fa", "#f472b6", "#34d399"];

  // -------------------------------
  // 🧠 Stats cards
  // -------------------------------
  const stats = [
    {
      label: "Total P&L",
      value: `₹${totalProfit.toLocaleString("en-IN")}`,
      sub: "Net Profit",
      trend: "",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      sub: "Profitable Trades",
      trend: "",
    },
    {
      label: "Total Trades",
      value: `${totalTrades}`,
      sub: "Across All Strategies",
      trend: "",
    },
    {
      label: "Avg Duration",
      value: avgDurationFormatted,
      sub: "Per Trade",
      trend: "",
    },
  ];

  // -------------------------------
  // 🧱 JSX Render
  // -------------------------------
  return (
    <div className="overview-section">
      <div className="overview-header">
        <h2>Strategy Overview</h2>
      </div>

      {/* Stats cards */}
      <div className="overview-cards">
        {stats.map((s, i) => (
          <div key={i} className="overview-card">
            <div className="card-label">{s.label}</div>
            <div className="card-value">{s.value}</div>
            <div className="card-sub">
              {s.sub} <span className="trend">{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="overview-charts">
        {/* Profit by Strategy */}
        <div className="chart-card">
          <div className="chart-header">Profit by Strategy</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={profitByStrategy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <Bar dataKey="pnl" fill="#d57eeb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Over Time */}
        <div className="chart-card">
          <div className="chart-header">Performance Over Time</div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={performanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke="#aaa" />
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
                dataKey="profit"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Strategy Distribution */}
        <div className="chart-card">
          <div className="chart-header">Strategy Distribution</div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={strategyDistribution}
                innerRadius={45}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {strategyDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
