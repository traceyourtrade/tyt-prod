'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faChartLine, 
  faPlay, 
  faPause,
  faPlus,
  faDollarSign,
  faTrophy,
  faScaleBalanced,
  faArrowUp,
  faArrowDown,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, BarChart, Bar } from 'recharts';
import { MetricCard, ChartCard, Skeleton } from '@/components/backtesting';
import { useTestingStore } from '@/store/backtestingStore';

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

interface Session {
  _id?: string;
  uniqueId?: string;
  sessionId: number;
  sessionInfo: SessionInfo;
  trades: Trade[];
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

export default function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const { sessions: storeSessions, addTrade } = useTestingStore();
  
  const sessionId = resolvedParams.sessionId;

  useEffect(() => {
    async function fetchSession() {
      try {
        const storeSession = storeSessions.find(s => s.id?.toString() === sessionId);
        if (storeSession) {
          const mappedSession: Session = {
            sessionId: storeSession.id,
            sessionInfo: {
              name: storeSession.name,
              symbol: storeSession.symbol,
              currentBalance: storeSession.currentBalance,
              startDate: storeSession.startDate,
              endDate: storeSession.endDate,
              daysRemaining: storeSession.daysRemaining,
              totalPnl: storeSession.totalPnl,
              winRate: storeSession.winRate,
              riskReward: storeSession.riskReward
            },
            trades: storeSession.trades || []
          };
          setSession(mappedSession);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/backtest-sessions');
        if (!res.ok) throw new Error('Failed to fetch sessions');
        
        const data = await res.json();
        
        if (data.success && data.data) {
          const foundSession = data.data.find((s: any) => 
            s.sessionId?.toString() === sessionId || 
            s._id === sessionId ||
            s.uniqueId === sessionId
          );
          
          if (foundSession) {
            setSession(foundSession);
          } else {
            setError('Session not found');
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSession();
  }, [sessionId, storeSessions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[400px]" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/backtesting/dashboard')}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-xl bg-[var(--loss-bg)] flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faChartLine} className="h-7 w-7 text-[var(--loss)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Session Not Found</h2>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            {error || 'The session you are looking for does not exist or has been deleted.'}
          </p>
          <button
            onClick={() => router.push('/backtesting/dashboard')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const sessionInfo = session.sessionInfo;
  const trades = session.trades || [];
  
  const parseBalance = (balance: string | number): number => {
    if (typeof balance === 'number') return balance;
    return parseFloat(balance.replace(/[$,]/g, '')) || 0;
  };

  const initialBalance = parseBalance(sessionInfo.currentBalance);
  const winningTrades = trades.filter(t => (t.pnl || t.roi || 0) > 0);
  const losingTrades = trades.filter(t => (t.pnl || t.roi || 0) < 0);
  const totalPnl = sessionInfo.totalPnl || trades.reduce((sum, t) => sum + (t.pnl || t.roi || 0), 0);
  const winRate = sessionInfo.winRate || (trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0);
  const currentBalance = initialBalance + totalPnl;
  
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || t.roi || 0), 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || t.roi || 0), 0) / losingTrades.length) 
    : 0;
  const riskReward = sessionInfo.riskReward || (avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0);

  const equityData = trades.reduce((acc: { time: string; value: number }[], trade, i) => {
    const prevBalance = i > 0 ? acc[i - 1].value : initialBalance;
    const dateStr = trade.timestamp || trade.date || new Date().toISOString();
    const time = new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    acc.push({ time, value: prevBalance + (trade.pnl || trade.roi || 0) });
    return acc;
  }, []);

  const tradeResults = trades.map((trade, i) => ({
    trade: `#${i + 1}`,
    pnl: trade.pnl || trade.roi || 0,
    fill: (trade.pnl || trade.roi || 0) >= 0 ? 'var(--profit)' : 'var(--loss)'
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/backtesting/dashboard')}
            className="p-2 rounded-xl hover:bg-[var(--background-hover)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
              <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">{sessionInfo.name}</h1>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <span>{sessionInfo.symbol}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]" />
                <span>{trades.length} trades</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTrading(!isTrading)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              isTrading 
                ? 'bg-[var(--loss-bg)] text-[var(--loss)] hover:bg-[var(--loss)]/20' 
                : 'bg-[var(--profit-bg)] text-[var(--profit)] hover:bg-[var(--profit)]/20'
            }`}
          >
            <FontAwesomeIcon icon={isTrading ? faPause : faPlay} className="h-4 w-4" />
            {isTrading ? 'Stop Trading' : 'Start Trading'}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="aspect-[16/9] bg-[var(--background-card)] flex items-center justify-center border-b border-[var(--border-light)]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faChartLine} className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">TradingView Chart</h3>
            <p className="text-sm text-[var(--foreground-muted)] max-w-md">
              Chart integration coming soon. Record trades manually using the button above.
            </p>
          </div>
        </div>
        
        <div className="p-4 flex items-center justify-between bg-[var(--background-hover)]">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-[var(--foreground-muted)]">Balance</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">${currentBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--foreground-muted)]">P&L</p>
              <p className={`text-lg font-semibold ${totalPnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--foreground-muted)]">Win Rate</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">{winRate.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--profit-bg)] text-[var(--profit)]">
              {winningTrades.length}W
            </span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--loss-bg)] text-[var(--loss)]">
              {losingTrades.length}L
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total P&L" value={`$${totalPnl.toFixed(2)}`} icon={faDollarSign} />
        <MetricCard title="Win Rate" value={`${winRate.toFixed(1)}%`} icon={faTrophy} />
        <MetricCard title="Risk/Reward" value={riskReward === Infinity ? '∞' : riskReward.toFixed(2)} icon={faScaleBalanced} />
        <MetricCard title="Total Trades" value={trades.length} icon={faChartLine} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Equity Curve">
          <div className="h-56 w-full">
            {equityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="colorEquitySession" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Balance" stroke="var(--primary)" strokeWidth={2} fill="url(#colorEquitySession)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--foreground-muted)]">
                No trades yet
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Trade Results">
          <div className="h-56 w-full">
            {tradeResults.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="trade" stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                    {tradeResults.map((entry, index) => (
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

      <ChartCard title="Trade History">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-light)]">
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">#</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Date</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Type</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Entry</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Exit</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Lot Size</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--foreground-muted)]">
                    No trades recorded yet. Start trading to see your history.
                  </td>
                </tr>
              ) : (
                trades.map((trade, index) => {
                  const tradeType = trade.type || trade.position || 'long';
                  const isLong = tradeType.toLowerCase() === 'long' || tradeType.toLowerCase() === 'buy';
                  const tradePnl = trade.pnl || trade.roi || 0;
                  const tradeDate = trade.timestamp || trade.date || new Date().toISOString();
                  const entryPrice = trade.entry || trade.entryPrice || 0;
                  const exitPrice = trade.exit || trade.stopPrice || 0;
                  
                  return (
                    <tr key={trade.id || index} className="border-b border-[var(--border-light)] hover:bg-[var(--background-hover)] transition-colors">
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
                          <span className="text-sm font-medium text-[var(--foreground)]">#{index + 1}</span>
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
