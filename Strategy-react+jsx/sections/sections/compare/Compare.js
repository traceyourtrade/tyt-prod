import "./Compare.css";
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
const formatINR = (n) =>
  `₹${Math.abs(Number(n || 0)).toLocaleString("en-IN")}`;

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

// Build a simple weekly P&L trend
const buildWeeklyTrend = (trades) => {
  if (!trades.length) return [];
  const weekMap = {};

  trades.forEach((t) => {
    const date = new Date(t.date || t.OpenTime);
    const weekNum = Math.ceil(date.getDate() / 7);
    const key = `W${weekNum}`;
    weekMap[key] = (weekMap[key] || 0) + (t.Profit || 0);
  });

  return Object.entries(weekMap).map(([week, pnl]) => ({ week, pnl }));
};

// ------------------------------------------------------
// 📊 Component
// ------------------------------------------------------
const Compare = ({ selected = [], strategiesDataObj = {} }) => {
  
  const COLORS = ["#8fffac", "#ff6b6b"];

  // 🧠 Derived Stats per Strategy
  const computedStats = selected.map((name) => {
    const trades = strategiesDataObj[name] || [];
    if (!trades.length) return null;

    const totalTrades = trades.length;
    const totalPnl = trades.reduce((s, t) => s + (t.Profit || 0), 0);
    const winTrades = trades.filter((t) => t.Profit > 0);
    const lossTrades = trades.filter((t) => t.Profit <= 0);
    const winRate = totalTrades ? ((winTrades.length / totalTrades) * 100).toFixed(1) : 0;

    // Profit factor & RR
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
    const rr = avgLoss ? `${(avgWin / avgLoss).toFixed(1)} : 1` : "—";

    // Drawdown (max negative daily P&L)
    const dailyPnlMap = {};
    trades.forEach((t) => {
      const date = t.date || "Unknown";
      dailyPnlMap[date] = (dailyPnlMap[date] || 0) + (t.Profit || 0);
    });
    const pnlValues = Object.values(dailyPnlMap);
    const maxDD = pnlValues.length
      ? `${((Math.min(...pnlValues) / totalPnl) * 100).toFixed(1)}%`
      : "—";

    // Sharpe (mock for now: scaled win rate)
    const sharpe = (winRate / 80).toFixed(2);

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
  }).filter(Boolean);

  // ------------------------------------------------------
  // 🧱 Render
  // ------------------------------------------------------
  return (
    <div className="compare-wrapper">
      <h2 className="compare-title">⚖️ Strategy Comparison</h2>

      <div className="compare-scroll">
        {computedStats.map((s, idx) => {
          const pieData = [
            { name: "Wins", value: s.win },
            { name: "Losses", value: s.loss },
          ];

          return (
            <div key={idx} className="compare-card">
              <h3 className="strategy-name">{s.name}</h3>

              {/* --- Stats Section --- */}
              <div className="stat"><span>Total P&L</span><span className={`value ${s.pnl.startsWith('-') ? 'negative' : 'positive'}`}>{s.pnl}</span></div>
              <div className="stat"><span>Total Trades</span><span>{s.trades}</span></div>
              <div className="stat"><span>Winning Trades</span><span>{s.win}</span></div>
              <div className="stat"><span>Losing Trades</span><span>{s.loss}</span></div>
              <div className="stat"><span>Win Rate</span><span>{s.winRate}</span></div>
              <div className="stat"><span>Max Drawdown</span><span className="value negative">{s.maxDD}</span></div>
              <div className="stat"><span>Risk-Reward Ratio</span><span>{s.rr}</span></div>
              <div className="stat"><span>Profit Factor</span><span>{s.profitFactor}</span></div>
              <div className="stat"><span>Avg Duration</span><span>{s.avgDuration}</span></div>
              <div className="stat"><span>Sharpe Ratio</span><span>{s.sharpe}</span></div>

              {/* --- Charts Section --- */}
              <div className="chart-wrapper">
                <div className="chart-box">
                  <p className="chart-title">PnL Trend</p>
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

                <div className="chart-box">
                  <p className="chart-title">Win / Loss Ratio</p>
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
