'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload,
  faTrophy,
  faScaleBalanced,
  faDollarSign,
  faPercent,
  faArrowTrendUp,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';
import { MetricCard, ChartCard, Skeleton } from '@/components/backtesting';

interface StatsData {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalProfit: number;
  totalLoss: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  initialBalance: number;
  currentBalance: number;
  totalSessions: number;
  recentTrades: any[];
  equityCurve: { date: string; balance: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-[var(--foreground-muted)] mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsMain() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const avgRR = stats && stats.avgLoss !== 0 
    ? Math.abs(stats.avgWin / stats.avgLoss) 
    : 0;

  const longTrades = stats?.recentTrades?.filter((t: any) => t.type === 'long').length || 0;
  const shortTrades = stats?.recentTrades?.filter((t: any) => t.type === 'short').length || 0;
  const totalRecentTrades = longTrades + shortTrades;

  const performanceBySideData = [
    { name: 'Long', value: totalRecentTrades > 0 ? Math.round((longTrades / totalRecentTrades) * 100) : 50, fill: 'var(--profit)' },
    { name: 'Short', value: totalRecentTrades > 0 ? Math.round((shortTrades / totalRecentTrades) * 100) : 50, fill: 'var(--primary)' },
  ];

  const winLossData = [
    { name: 'Wins', value: stats?.winningTrades || 0, fill: 'var(--profit)' },
    { name: 'Losses', value: stats?.losingTrades || 0, fill: 'var(--loss)' },
  ];

  const profitLossData = stats?.equityCurve?.map((item, index) => ({
    date: item.date,
    value: item.balance - (stats?.initialBalance || 5000)
  })) || [];

  const hourlyPerformance = stats?.recentTrades?.reduce((acc: Record<string, number>, trade: any) => {
    const hour = new Date(trade.timestamp).getHours();
    const hourStr = hour.toString().padStart(2, '0');
    acc[hourStr] = (acc[hourStr] || 0) + 1;
    return acc;
  }, {}) || {};

  const hourlyData = Object.entries(hourlyPerformance).map(([hour, trades]) => ({
    hour,
    trades
  })).sort((a, b) => a.hour.localeCompare(b.hour));

  const winnersData = [
    { name: 'Total Winners', value: stats?.winningTrades?.toString() || '0' },
    { name: 'Best Win', value: `$${stats?.recentTrades?.filter((t: any) => t.pnl > 0).reduce((max: number, t: any) => Math.max(max, t.pnl), 0).toFixed(2) || '0.00'}` },
    { name: 'Average Win', value: `$${stats?.avgWin?.toFixed(2) || '0.00'}` },
    { name: 'Win Rate', value: `${stats?.winRate?.toFixed(1) || '0'}%` },
  ];

  const losersData = [
    { name: 'Total Losers', value: stats?.losingTrades?.toString() || '0' },
    { name: 'Worst Loss', value: `$${stats?.recentTrades?.filter((t: any) => t.pnl < 0).reduce((min: number, t: any) => Math.min(min, t.pnl), 0).toFixed(2) || '0.00'}` },
    { name: 'Average Loss', value: `$${stats?.avgLoss?.toFixed(2) || '0.00'}` },
    { name: 'Total Loss', value: `$${stats?.totalLoss?.toFixed(2) || '0.00'}` },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Analytics</h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">Loading your performance data...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">Error loading analytics: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Analytics</h2>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Deep insights into your trading performance • {stats?.totalTrades || 0} trades analyzed
          </p>
        </div>
        
        <button className="btn-secondary flex items-center gap-2 text-sm">
          <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard 
          title="Total P&L" 
          value={`$${stats?.totalPnl?.toFixed(2) || '0.00'}`} 
          icon={faDollarSign} 
          trend={stats?.totalPnl && stats.totalPnl >= 0 ? "up" : "down"} 
          trendValue={stats?.totalPnl && stats.totalPnl >= 0 ? "Profit" : "Loss"} 
        />
        <MetricCard 
          title="Account Balance" 
          value={`$${stats?.currentBalance?.toFixed(2) || '0.00'}`} 
          icon={faChartLine} 
          trend={stats?.currentBalance && stats.currentBalance > (stats?.initialBalance || 0) ? "up" : "neutral"} 
        />
        <MetricCard 
          title="Win Rate" 
          value={`${stats?.winRate?.toFixed(1) || '0'}%`} 
          icon={faTrophy} 
          trend={stats?.winRate && stats.winRate >= 50 ? "up" : "down"} 
          trendValue={stats?.winRate && stats.winRate >= 50 ? "Above 50%" : "Below 50%"} 
        />
        <MetricCard 
          title="Total Trades" 
          value={stats?.totalTrades || 0} 
          icon={faPercent} 
          subtitle={`${stats?.winningTrades || 0} wins / ${stats?.losingTrades || 0} losses`} 
        />
        <MetricCard 
          title="Avg R:R" 
          value={avgRR.toFixed(2)} 
          icon={faScaleBalanced} 
          trend={avgRR >= 1 ? "up" : "neutral"} 
          trendValue={avgRR >= 1.5 ? "Good" : avgRR >= 1 ? "Neutral" : "Low"} 
        />
        <MetricCard 
          title="Profit Factor" 
          value={stats?.profitFactor === Infinity ? '∞' : stats?.profitFactor?.toFixed(2) || '0'} 
          icon={faArrowTrendUp} 
          trend={stats?.profitFactor && stats.profitFactor >= 1 ? "up" : "down"} 
          trendValue={stats?.profitFactor && stats.profitFactor >= 1.5 ? "Strong" : stats?.profitFactor && stats.profitFactor >= 1 ? "Positive" : "Losing"} 
        />
      </div>
      
      <ChartCard title="Profit & Loss Over Time">
        <div className="h-64 w-full">
          {profitLossData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitLossData}>
                <defs>
                  <linearGradient id="colorPnLAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="var(--profit)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="P&L" stroke="var(--profit)" strokeWidth={2} fill="url(#colorPnLAnalytics)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--foreground-muted)]">
              No trade data yet
            </div>
          )}
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--profit)]" />
            <h3 className="text-base font-medium text-[var(--foreground)]">Winners</h3>
          </div>
          <div className="space-y-3">
            {winnersData.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--border-light)] last:border-0">
                <span className="text-sm text-[var(--foreground-muted)]">{item.name}</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--loss)]" />
            <h3 className="text-base font-medium text-[var(--foreground)]">Losers</h3>
          </div>
          <div className="space-y-3">
            {losersData.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--border-light)] last:border-0">
                <span className="text-sm text-[var(--foreground-muted)]">{item.name}</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Performance by Side">
          <div className="h-48 flex items-center justify-center">
            {totalRecentTrades > 0 ? (
              <PieChart width={180} height={180}>
                <Pie
                  data={performanceBySideData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {performanceBySideData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <div className="text-[var(--foreground-muted)] text-sm">No trades yet</div>
            )}
          </div>
          <div className="flex justify-center gap-5 mt-2">
            {performanceBySideData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                <span className="text-xs text-[var(--foreground-muted)]">{entry.name}: {entry.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Win/Loss Ratio">
          <div className="h-48 flex items-center justify-center">
            {(winLossData[0].value + winLossData[1].value) > 0 ? (
              <PieChart width={180} height={180}>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <div className="text-[var(--foreground-muted)] text-sm">No trades yet</div>
            )}
          </div>
          <div className="flex justify-center gap-5 mt-2">
            {winLossData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                <span className="text-xs text-[var(--foreground-muted)]">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Hourly Performance">
          <div className="h-48 w-full">
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="hour" stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="trades" name="Trades" fill="var(--accent-purple)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--foreground-muted)]">
                No trade data yet
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-5 text-center">
          <p className="text-xs text-[var(--foreground-muted)] mb-2">Avg Risk:Reward</p>
          <p className="text-2xl font-semibold text-[var(--foreground)]">{avgRR.toFixed(2)}</p>
          <div className="w-full h-1.5 bg-[var(--background-hover)] rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${Math.min(avgRR / 3 * 100, 100)}%` }} />
          </div>
        </div>

        <div className="card p-5 text-center">
          <p className="text-xs text-[var(--foreground-muted)] mb-2">Win Rate</p>
          <p className="text-2xl font-semibold text-[var(--foreground)]">{stats?.winRate?.toFixed(1) || 0}%</p>
          <div className="w-full h-1.5 bg-[var(--background-hover)] rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[var(--profit)] rounded-full" style={{ width: `${stats?.winRate || 0}%` }} />
          </div>
        </div>

        <div className="card p-5 text-center">
          <p className="text-xs text-[var(--foreground-muted)] mb-2">Profit Factor</p>
          <p className="text-2xl font-semibold text-[var(--foreground)]">
            {stats?.profitFactor === Infinity ? '∞' : stats?.profitFactor?.toFixed(2) || '0'}
          </p>
          <div className="w-full h-1.5 bg-[var(--background-hover)] rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[var(--warning)] rounded-full" style={{ width: `${Math.min((stats?.profitFactor || 0) / 3 * 100, 100)}%` }} />
          </div>
        </div>

        <div className="card p-5 text-center">
          <p className="text-xs text-[var(--foreground-muted)] mb-2">Total Sessions</p>
          <p className="text-2xl font-semibold text-[var(--foreground)]">{stats?.totalSessions || 0}</p>
          <div className="w-full h-1.5 bg-[var(--background-hover)] rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[var(--accent-teal)] rounded-full" style={{ width: `${Math.min((stats?.totalSessions || 0) * 10, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
