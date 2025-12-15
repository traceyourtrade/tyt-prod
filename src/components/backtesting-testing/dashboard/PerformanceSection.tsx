'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock,
  faHistory,
  faDatabase,
  faTrophy,
  faScaleBalanced,
  faCoins,
  faArrowTrendDown,
  faBullseye,
} from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { MetricCard, ChartCard, Skeleton } from '@/components/ui';

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

export default function PerformanceSection() {
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

  const buyTrades = stats?.recentTrades?.filter((t: any) => t.type === 'long').length || 0;
  const sellTrades = stats?.recentTrades?.filter((t: any) => t.type === 'short').length || 0;
  const totalRecentTrades = buyTrades + sellTrades;
  const buyPercentage = totalRecentTrades > 0 ? (buyTrades / totalRecentTrades) * 100 : 50;
  const sellPercentage = totalRecentTrades > 0 ? (sellTrades / totalRecentTrades) * 100 : 50;

  const avgRR = stats && stats.avgLoss !== 0 
    ? Math.abs(stats.avgWin / stats.avgLoss) 
    : 0;

  const expectancy = stats 
    ? (stats.winRate / 100) * stats.avgWin + ((100 - stats.winRate) / 100) * stats.avgLoss
    : 0;

  const equityCurveData = stats?.equityCurve?.length 
    ? stats.equityCurve 
    : [{ date: 'Start', balance: stats?.initialBalance || 5000 }];


  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Performance Overview</h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Loading your backtesting data...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">Error loading stats: {error}</p>
        </div>
      </section>
    );
  }

  const metrics = {
    tradesTaken: { 
      total: stats?.totalTrades || 0, 
      buyPercentage: buyPercentage.toFixed(1), 
      sellPercentage: sellPercentage.toFixed(1) 
    },
    winRate: stats?.winRate || 0,
    avgRR: avgRR,
    profitFactor: stats?.profitFactor || 0,
    expectancy: expectancy,
    totalPnl: stats?.totalPnl || 0,
    totalSessions: stats?.totalSessions || 0,
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Performance Overview</h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Track your backtesting progress and key metrics</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="btn-secondary text-xs py-1.5 px-3">Backtesting</button>
          <button className="btn-ghost text-xs py-1.5 px-3">Lifetime</button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Total Sessions"
          value={metrics.totalSessions}
          icon={faClock}
          animate={false}
        />
        
        <MetricCard
          title="Total P&L"
          value={`$${metrics.totalPnl.toFixed(2)}`}
          icon={faCoins}
          trend={metrics.totalPnl >= 0 ? "up" : "down"}
          trendValue={metrics.totalPnl >= 0 ? "Profit" : "Loss"}
        />
        
        <MetricCard
          title="Trades Taken"
          value={metrics.tradesTaken.total}
          icon={faDatabase}
          progressBar={{
            value: parseFloat(metrics.tradesTaken.buyPercentage),
            label: `${metrics.tradesTaken.buyPercentage}% buys`,
            secondaryLabel: `${metrics.tradesTaken.sellPercentage}% sells`,
          }}
        />
        
        <MetricCard
          title="Overall Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          icon={faTrophy}
          trend={metrics.winRate >= 50 ? "up" : "down"}
          trendValue={metrics.winRate >= 50 ? "Profitable" : "Below 50%"}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Avg Risk:Reward"
          value={`${metrics.avgRR.toFixed(2)}R`}
          icon={faScaleBalanced}
          trend={metrics.avgRR >= 1 ? "up" : "neutral"}
          trendValue={metrics.avgRR >= 1 ? "Good" : "Low"}
        />
        
        <MetricCard
          title="Profit Factor"
          value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
          icon={faHistory}
          trend={metrics.profitFactor >= 1 ? "up" : "down"}
          trendValue={metrics.profitFactor >= 1.5 ? "Strong" : metrics.profitFactor >= 1 ? "Positive" : "Losing"}
        />
        
        <MetricCard
          title="Avg Win"
          value={`$${(stats?.avgWin || 0).toFixed(2)}`}
          icon={faArrowTrendDown}
          trend="up"
          trendValue="Per trade"
        />
        
        <MetricCard
          title="Expectancy"
          value={`$${metrics.expectancy.toFixed(2)}`}
          icon={faBullseye}
          trend={metrics.expectancy > 0 ? "up" : "down"}
          trendValue={metrics.expectancy > 0 ? "Positive" : "Negative"}
        />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <ChartCard title="Equity Curve" className="xl:col-span-2">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--foreground-muted)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--foreground-muted)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  name="Balance"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Session Summary">
          <div className="h-44 w-full flex flex-col items-center justify-center text-center p-4">
            <p className="text-3xl font-bold text-[var(--foreground)]">{metrics.totalSessions}</p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">Total Sessions</p>
            <p className="text-xl font-semibold text-[var(--primary)] mt-3">{metrics.tradesTaken.total}</p>
            <p className="text-xs text-[var(--foreground-muted)]">Trades Recorded</p>
          </div>
        </ChartCard>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard title="Performance Stats">
          <div className="h-40 w-full grid grid-cols-2 gap-4 p-4">
            <div className="flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-[var(--profit)]">{stats?.winningTrades || 0}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Winning Trades</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-[var(--loss)]">{stats?.losingTrades || 0}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Losing Trades</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-xl font-semibold text-[var(--profit)]">${(stats?.totalProfit || 0).toFixed(2)}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Total Profit</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-xl font-semibold text-[var(--loss)]">${Math.abs(stats?.totalLoss || 0).toFixed(2)}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Total Loss</p>
            </div>
          </div>
        </ChartCard>
        
        <ChartCard title="Account Summary">
          <div className="h-40 w-full flex flex-col items-center justify-center p-4">
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-[var(--foreground)]">${(stats?.currentBalance || 5000).toFixed(2)}</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--foreground-muted)]">Initial</p>
                <p className="text-base font-semibold">${(stats?.initialBalance || 5000).toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--foreground-muted)]">Change</p>
                <p className={`text-base font-semibold ${metrics.totalPnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                  {metrics.totalPnl >= 0 ? '+' : ''}${metrics.totalPnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </section>
  );
}
