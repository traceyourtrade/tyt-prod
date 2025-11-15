"use client"
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
  const winTrades = allTrades.filter((t) => t.Profit && t.Profit > 0).length;
  const winRate = totalTrades ? ((winTrades / totalTrades) * 100).toFixed(1) : "0";

  // Avg duration (in mins/hours/days auto-scaled)
  const avgDurationFormatted = (() => {
    const valid = allTrades.filter((t) => t.OpenTime && t.CloseTime);
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

  // Chart 1 — Profit by Strategy (already derived above)
  // Chart 2 — Performance Over Time (group by date)
  const profitByDateMap: { [key: string]: number } = {};
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
    <div className="w-full min-h-[70vh] bg-[#0f0f0f] text-white flex flex-col p-6 rounded-xl box-border animate-fadeIn">
      <div className="overview-header">
        <h2 className="text-2xl font-semibold mb-1.5 bg-gradient-to-r from-[#d57eeb] to-[#fccb90] bg-clip-text text-transparent">
          Strategy Overview
        </h2>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((s, i) => (
          <div 
            key={i} 
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5 transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-[0_0_16px_rgba(213,126,235,0.2)]"
          >
            <div className="text-[#aaa] text-sm">{s.label}</div>
            <div className="text-white text-2xl font-semibold my-1.5">{s.value}</div>
            <div className="text-[#888] text-xs">
              {s.sub} <span className="text-[#8fffac]">{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8">
        {/* Profit by Strategy */}
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:shadow-[0_0_18px_rgba(255,255,255,0.08)]">
          <div className="font-medium text-[#ccc] mb-2.5">Profit by Strategy</div>
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
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:shadow-[0_0_18px_rgba(255,255,255,0.08)]">
          <div className="font-medium text-[#ccc] mb-2.5">Performance Over Time</div>
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
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:shadow-[0_0_18px_rgba(255,255,255,0.08)]">
          <div className="font-medium text-[#ccc] mb-2.5">Strategy Distribution</div>
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
                  background: "#c9ffdeff",
                  border: "1px solid #70ff68ff",
                  color: "#2201b5ff",
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