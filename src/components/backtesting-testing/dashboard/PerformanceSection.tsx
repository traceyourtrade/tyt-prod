'use client';

import { useState, useEffect } from 'react';
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
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
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
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? `$${entry.value.toLocaleString()}` : entry.value}
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
      <section className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <p className="text-destructive">Error loading stats: {error}</p>
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
    <section className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard title="Equity Curve" subtitle="Balance over time" className="xl:col-span-2">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
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
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Session Summary" subtitle="Overall statistics">
          <div className="h-52 w-full flex flex-col items-center justify-center text-center">
            <p className="text-4xl font-bold text-foreground">{metrics.totalSessions}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Sessions</p>
            <div className="w-12 h-px bg-border my-4" />
            <p className="text-2xl font-semibold text-primary">{metrics.tradesTaken.total}</p>
            <p className="text-xs text-muted-foreground">Trades Recorded</p>
          </div>
        </ChartCard>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Performance Stats" subtitle="Win/loss breakdown">
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-profit/5">
              <p className="text-3xl font-bold text-profit">{stats?.winningTrades || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Winning Trades</p>
              <p className="text-lg font-semibold text-profit mt-2">${(stats?.totalProfit || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Profit</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-loss/5">
              <p className="text-3xl font-bold text-loss">{stats?.losingTrades || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Losing Trades</p>
              <p className="text-lg font-semibold text-loss mt-2">${Math.abs(stats?.totalLoss || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Loss</p>
            </div>
          </div>
        </ChartCard>
        
        <ChartCard title="Account Summary" subtitle="Balance overview">
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Balance</p>
            <p className="text-4xl font-bold text-foreground mt-2">${(stats?.currentBalance || 5000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="mt-6 flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Initial</p>
                <p className="text-lg font-semibold text-foreground mt-1">${(stats?.initialBalance || 5000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Change</p>
                <p className={`text-lg font-semibold mt-1 ${metrics.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
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
