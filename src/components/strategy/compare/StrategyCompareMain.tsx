"use client"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ------------------------------------------------------
// 🔧 Helper Functions
// ------------------------------------------------------
const formatINR = (n: number) =>
  `₹${Math.abs(Number(n || 0)).toLocaleString("en-IN")}`;

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

// Build a simple weekly P&L trend
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

// ------------------------------------------------------
// 📊 Component
// ------------------------------------------------------
const Compare = ({ selected = [], strategiesDataObj = {} }: CompareProps) => {
  
  const COLORS = ["#8fffac", "#ff6b6b"];

  // 🧠 Derived Stats per Strategy
  const computedStats: ComputedStat[] = selected.map((name) => {
    const trades = strategiesDataObj[name] || [];
    if (!trades.length) return null;

    const totalTrades = trades.length;
    const totalPnl = trades.reduce((s, t) => s + (t.Profit || 0), 0);
    const winTrades = trades.filter((t) => (t.Profit || 0) > 0);
    const lossTrades = trades.filter((t) => (t.Profit || 0) <= 0);
    const winRate = totalTrades ? ((winTrades.length / totalTrades) * 100).toFixed(1) : "0";

    // Profit factor & RR
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

    // Drawdown (max negative daily P&L)
    const dailyPnlMap: { [key: string]: number } = {};
    trades.forEach((t) => {
      const date = t.date || "Unknown";
      dailyPnlMap[date] = (dailyPnlMap[date] || 0) + (t.Profit || 0);
    });
    const pnlValues = Object.values(dailyPnlMap);
    const maxDD = pnlValues.length && totalPnl !== 0
      ? `${((Math.min(...pnlValues) / totalPnl) * 100).toFixed(1)}%`
      : "—";

    // Sharpe (mock for now: scaled win rate)
    const sharpe = (parseFloat(winRate) / 80).toFixed(2);

    // Duration
    const avgDuration = calculateAvgDuration(trades);

    // Trend
    const pnlTrend = buildWeeklyTrend(trades);

    return {
      name,
      pnl: `${totalPnl < 0 ? "-" : "+"}${formatINR(totalPnl)}`,
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

  // ------------------------------------------------------
  // 🧱 Render
  // ------------------------------------------------------
  return (
    <div className="w-full bg-[#0f0f0f] text-white rounded-xl p-6 flex flex-col gap-5 overflow-visible">
      <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#d57eeb] to-[#fccb90] bg-clip-text text-transparent">
        ⚖️ Strategy Comparison
      </h2>

      <div className="flex gap-5 overflow-x-auto overflow-y-visible p-4 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        {computedStats.map((s, idx) => {
          const pieData = [
            { name: "Wins", value: s.win },
            { name: "Losses", value: s.loss },
          ];

          return (
            <div 
              key={idx} 
              className="flex-none w-[360px] bg-[#1a1a1a] border border-[#262626] rounded-xl p-5 leading-relaxed transition-all duration-250 relative z-10 hover:scale-103 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(213,126,235,0.25)]"
            >
              <h3 className="text-xl font-semibold mb-3.5 text-center border-b border-[#2b2b2b] pb-2">
                {s.name}
              </h3>

              {/* --- Stats Section --- */}
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Total P&L</span>
                <span className={`${s.pnl.startsWith('-') ? 'text-[#ff6b6b]' : 'text-[#8fffac]'}`}>
                  {s.pnl}
                </span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Total Trades</span>
                <span>{s.trades}</span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Winning Trades</span>
                <span>{s.win}</span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Losing Trades</span>
                <span>{s.loss}</span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Win Rate</span>
                <span>{s.winRate}</span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Max Drawdown</span>
                <span className="text-[#ff6b6b]">{s.maxDD}</span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Risk-Reward Ratio</span>
                <span>{s.rr}</span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Profit Factor</span>
                <span>{s.profitFactor}</span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Avg Duration</span>
                <span>{s.avgDuration}</span>
              </div>
              <div className="flex justify-between my-2 text-sm text-[#ccc]">
                <span>Sharpe Ratio</span>
                <span>{s.sharpe}</span>
              </div>

              {/* --- Charts Section --- */}
              <div className="flex justify-between gap-3 mt-3.5">
                <div className="flex-1 bg-[#111] border border-[#2b2b2b] rounded-lg p-2.5 flex flex-col justify-center items-center">
                  <p className="text-xs text-[#aaa] mb-1 tracking-wide">PnL Trend</p>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={s.pnlTrend}>
                      <Tooltip
                        contentStyle={{
                          background: "#1a1a1a",
                          border: "1px solid #333",
                          color: "#fff",
                          fontSize: "0.75rem",
                        }}
                        cursor={{ stroke: "#444" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pnl"
                        stroke="#d57eeb"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 bg-[#111] border border-[#2b2b2b] rounded-lg p-2.5 flex flex-col justify-center items-center">
                  <p className="text-xs text-[#aaa] mb-1 tracking-wide">Win / Loss Ratio</p>
                  <ResponsiveContainer width="100%" height={90}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#1a1a1a",
                          border: "1px solid #333",
                          color: "#fff",
                          fontSize: "0.75rem",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Compare;
