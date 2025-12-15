'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay,
  faChartLine,
  faChevronLeft,
  faChevronRight,
  faClock,
  faTrophy,
  faScaleBalanced,
  faDollarSign,
  faCalendarAlt,
  faArrowUp,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MetricCard, ChartCard, Skeleton } from '@/components/backtesting';

interface SessionInfo {
  name: string;
  symbol: string;
  currentBalance: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  totalPnl: number;
  winRate: number;
  riskReward: number;
  monthGainLoss?: any;
  weekGainLoss?: any;
  dailyGainLoss?: any;
}

interface MongoSession {
  _id: string;
  uniqueId: string;
  sessionId: number;
  sessionInfo: SessionInfo;
  trades: Trade[];
  createdAt?: string;
  updatedAt?: string;
}

interface Trade {
  id: number;
  name?: string;
  date?: string;
  symbol?: string;
  position?: string;
  roi?: number;
  entryPrice?: number;
  stopPrice?: number;
  maxRR?: number;
  status?: string;
  type?: string;
  entry?: number;
  exit?: number;
  lotSize?: number;
  pnl?: number;
  reason?: string;
  timestamp?: string;
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

export default function SessionsMain() {
  const router = useRouter();
  const [sessions, setSessions] = useState<MongoSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<MongoSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/backtest-sessions');
        
        if (!res.ok) throw new Error('Failed to fetch sessions');
        
        const data = await res.json();
        
        if (data.success && data.data) {
          setSessions(data.data);
          if (data.data.length > 0) {
            setSelectedSession(data.data[0]);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const sessionTrades = selectedSession?.trades || [];

  const winningTrades = sessionTrades.filter(t => (t.pnl || t.roi || 0) > 0);
  const losingTrades = sessionTrades.filter(t => (t.pnl || t.roi || 0) < 0);
  const totalPnl = selectedSession?.sessionInfo.totalPnl || sessionTrades.reduce((sum, t) => sum + (t.pnl || t.roi || 0), 0);
  const winRate = selectedSession?.sessionInfo.winRate || (sessionTrades.length > 0 ? (winningTrades.length / sessionTrades.length) * 100 : 0);
  
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || t.roi || 0), 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || t.roi || 0), 0) / losingTrades.length) 
    : 0;
  const riskReward = selectedSession?.sessionInfo.riskReward || (avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0);

  const parseBalance = (balance: string | number): number => {
    if (typeof balance === 'number') return balance;
    return parseFloat(balance.replace(/[$,]/g, '')) || 0;
  };

  const initialBalance = selectedSession ? parseBalance(selectedSession.sessionInfo.currentBalance) : 0;
  const currentBalance = initialBalance + totalPnl;

  const equityData = sessionTrades.reduce((acc: { time: string; value: number }[], trade, i) => {
    const prevBalance = i > 0 ? acc[i - 1].value : initialBalance;
    const dateStr = trade.timestamp || trade.date || new Date().toISOString();
    const time = new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    acc.push({ time, value: prevBalance + (trade.pnl || trade.roi || 0) });
    return acc;
  }, []);

  const monthlyPnl = sessionTrades.reduce((acc: Record<string, number>, trade) => {
    const dateStr = trade.timestamp || trade.date || new Date().toISOString();
    const month = new Date(dateStr).toLocaleString('en-US', { month: 'short' });
    acc[month] = (acc[month] || 0) + (trade.pnl || trade.roi || 0);
    return acc;
  }, {});

  const monthlyData = Object.entries(monthlyPnl).map(([month, profit]) => ({
    month,
    profit,
    fill: profit >= 0 ? 'var(--profit)' : 'var(--loss)'
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">Error loading sessions: {error}</p>
        </div>
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="space-y-6">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faChartLine} className="h-7 w-7 text-[var(--primary)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">No Sessions Yet</h2>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">Create a new backtesting session to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sessions.map((session) => (
            <button
              key={session.sessionId}
              onClick={() => setSelectedSession(session)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedSession?.sessionId === session.sessionId
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background-hover)] text-[var(--foreground-muted)] hover:bg-[var(--background-elevated)]'
              }`}
            >
              {session.sessionInfo.name}
            </button>
          ))}
        </div>
      )}

      <div className="card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
              <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedSession.sessionInfo.name}</h2>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--profit-bg)] text-[var(--profit)]">
                  active
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                <span>{selectedSession.sessionInfo.symbol}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]" />
                <span>{selectedSession.sessionInfo.startDate} - {selectedSession.sessionInfo.endDate}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]" />
                <span>{selectedSession.sessionInfo.daysRemaining} days remaining</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => router.push(`/backtesting/${selectedSession.sessionId}`)}
            className="btn-primary flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlay} className="h-4 w-4" />
            Go to Chart
          </button>
        </div>

        <div className="mt-5 pt-5 border-t border-[var(--border-light)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[var(--background-hover)]">
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Account Balance</p>
              <p className="text-xl font-semibold text-[var(--foreground)]">${currentBalance.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--background-hover)]">
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Total P&L</p>
              <p className={`text-xl font-semibold ${totalPnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--background-hover)]">
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Win Rate</p>
              <p className="text-xl font-semibold text-[var(--foreground)]">{winRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--background-hover)]">
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Risk/Reward</p>
              <p className="text-xl font-semibold text-[var(--foreground)]">
                {riskReward === Infinity ? '∞' : riskReward.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Equity Curve" className="lg:col-span-2">
          <div className="h-56 w-full">
            {equityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="colorEquitySessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Balance" stroke="var(--primary)" strokeWidth={2} fill="url(#colorEquitySessions)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--foreground-muted)]">
                No trades yet
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Monthly Performance">
          <div className="h-56 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--foreground-muted)]">
                No trades yet
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="Total PnL" value={`$${totalPnl.toFixed(2)}`} icon={faDollarSign} />
        <MetricCard title="Win Rate" value={`${winRate.toFixed(1)}%`} icon={faTrophy} />
        <MetricCard title="Risk/Reward" value={riskReward === Infinity ? '∞' : riskReward.toFixed(2)} icon={faScaleBalanced} />
        <MetricCard title="Trades" value={sessionTrades.length} icon={faCalendarAlt} />
        <MetricCard title="Wins" value={winningTrades.length} icon={faClock} />
        <MetricCard title="Losses" value={losingTrades.length} icon={faChartLine} />
      </div>
      
      <ChartCard title="Recent Trades">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-light)]">
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Trade</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Date</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Type</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Entry</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Exit</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Lot Size</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">P&L</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Reason</th>
              </tr>
            </thead>
            <tbody>
              {sessionTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--foreground-muted)]">
                    No trades recorded yet
                  </td>
                </tr>
              ) : (
                sessionTrades.slice(0, 10).map((trade) => {
                  const tradeType = trade.type || trade.position || 'long';
                  const isLong = tradeType.toLowerCase() === 'long' || tradeType.toLowerCase() === 'buy';
                  const tradePnl = trade.pnl || trade.roi || 0;
                  const tradeDate = trade.timestamp || trade.date || new Date().toISOString();
                  const entryPrice = trade.entry || trade.entryPrice || 0;
                  const exitPrice = trade.exit || trade.stopPrice || 0;
                  
                  return (
                    <tr key={trade.id} className="border-b border-[var(--border-light)] hover:bg-[var(--background-hover)] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isLong ? 'bg-[var(--profit-bg)]' : 'bg-[var(--loss-bg)]'
                          }`}>
                            <FontAwesomeIcon 
                              icon={isLong ? faArrowUp : faArrowDown} 
                              className={`h-3 w-3 ${isLong ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}
                            />
                          </div>
                          <span className="text-sm font-medium text-[var(--foreground)]">#{trade.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-[var(--foreground-muted)]">
                        {new Date(tradeDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isLong 
                            ? 'bg-[var(--profit-bg)] text-[var(--profit)]' 
                            : 'bg-[var(--loss-bg)] text-[var(--loss)]'
                        }`}>
                          {tradeType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-right tabular-nums text-[var(--foreground)]">
                        {entryPrice.toFixed(5)}
                      </td>
                      <td className="py-3 px-3 text-sm text-right tabular-nums text-[var(--foreground-muted)]">
                        {exitPrice.toFixed(5)}
                      </td>
                      <td className="py-3 px-3 text-sm text-right tabular-nums text-[var(--foreground)]">
                        {trade.lotSize || '-'}
                      </td>
                      <td className={`py-3 px-3 text-sm text-right font-medium tabular-nums ${
                        tradePnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                      }`}>
                        {tradePnl >= 0 ? '+' : ''}${tradePnl.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-xs text-[var(--foreground-muted)] bg-[var(--background-elevated)]">
                          {trade.reason || trade.status || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {sessionTrades.length > 10 && (
          <div className="flex justify-center mt-4 pt-4 border-t border-[var(--border-light)]">
            <span className="text-xs text-[var(--foreground-muted)]">
              Showing 10 of {sessionTrades.length} trades
            </span>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
