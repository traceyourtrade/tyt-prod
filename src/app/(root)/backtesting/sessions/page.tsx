'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface Trade {
  id: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  exitPrice?: number;
  sl?: number;
  tp?: number;
  openedAt: number;
  closedAt?: number;
  pnl?: number;
  rr?: number;
  notes?: string;
  tags?: string[];
  status: 'open' | 'closed';
}

interface Session {
  sessionId: number;
  name: string;
  symbol: string;
  fromDate: string;
  toDate: string;
  initialBalance: number;
  currentBalance: number;
  progressPointer: number;
  status: 'active' | 'completed';
  description?: string;
  riskPerTrade?: number;
  trades: Trade[];
  timeInvested: number;
  createdAt: string;
  updatedAt: string;
}

export default function BacktestingSessionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionIdParam = searchParams.get('id');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    sessionIdParam ? parseInt(sessionIdParam) : null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (sessionIdParam) {
      setSelectedSessionId(parseInt(sessionIdParam));
    }
  }, [sessionIdParam]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/backtest-sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
        if (!selectedSessionId && data.data?.length > 0) {
          setSelectedSessionId(data.data[0].sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSession = useMemo(() => {
    return sessions.find(s => s.sessionId === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  const closedTrades = useMemo(() => {
    if (!selectedSession) return [];
    return (selectedSession.trades || [])
      .filter(t => t.status === 'closed')
      .sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0));
  }, [selectedSession]);

  const stats = useMemo(() => {
    if (!selectedSession || closedTrades.length === 0) {
      return {
        totalPnl: 0,
        winRate: 0,
        avgRR: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        longTrades: 0,
        shortTrades: 0
      };
    }

    const pnls = closedTrades.map(t => t.pnl || 0);
    const winners = pnls.filter(p => p > 0);
    const losers = pnls.filter(p => p < 0);
    const rrs = closedTrades.map(t => t.rr || 0).filter(r => r !== 0);

    const totalWins = winners.reduce((a, b) => a + b, 0);
    const totalLosses = Math.abs(losers.reduce((a, b) => a + b, 0));

    return {
      totalPnl: pnls.reduce((a, b) => a + b, 0),
      winRate: (winners.length / closedTrades.length) * 100,
      avgRR: rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0,
      bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
      worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
      avgWin: winners.length > 0 ? totalWins / winners.length : 0,
      avgLoss: losers.length > 0 ? totalLosses / losers.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      totalTrades: closedTrades.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      longTrades: closedTrades.filter(t => t.side === 'long').length,
      shortTrades: closedTrades.filter(t => t.side === 'short').length
    };
  }, [closedTrades, selectedSession]);

  const equityCurveData = useMemo(() => {
    if (!selectedSession) return [];
    
    let balance = selectedSession.initialBalance;
    const data = [{ 
      trade: 0, 
      balance, 
      date: new Date(selectedSession.fromDate).toLocaleDateString() 
    }];

    if (closedTrades.length === 0) {
      data.push({
        trade: 1,
        balance: selectedSession.currentBalance,
        date: 'Current'
      });
      return data;
    }

    closedTrades.forEach((trade, index) => {
      balance += trade.pnl || 0;
      data.push({
        trade: index + 1,
        balance,
        date: trade.closedAt ? new Date(trade.closedAt).toLocaleDateString() : ''
      });
    });

    return data;
  }, [closedTrades, selectedSession]);

  const handleSessionChange = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    router.push(`/backtesting/sessions?id=${sessionId}`, { scroll: false });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-2-2-4 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No Sessions Yet</h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Create a backtesting session to view analytics
            </p>
            <button
              onClick={() => router.push('/backtesting/dashboard')}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Session Analytics</h1>
              <p className="text-[var(--muted-foreground)] text-sm mt-1">
                Detailed performance analysis for your backtesting sessions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedSessionId || ''}
                onChange={(e) => handleSessionChange(parseInt(e.target.value))}
                className="px-4 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-w-[200px]"
              >
                {sessions.map(session => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.name} ({session.symbol})
                  </option>
                ))}
              </select>
              <button
                onClick={() => router.push('/backtesting/dashboard')}
                className="px-3 py-2 text-sm border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]"
              >
                Back to Dashboard
              </button>
              {selectedSession && (
                <button
                  onClick={() => router.push(`/backtesting/${selectedSession.sessionId}`)}
                  className="px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90"
                >
                  Open Chart
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {selectedSession && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card rounded-xl p-5 mb-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[var(--primary)]">
                      {selectedSession.symbol.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-[var(--foreground)]">{selectedSession.name}</h2>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {selectedSession.symbol} • {new Date(selectedSession.fromDate).toLocaleDateString()} → {new Date(selectedSession.toDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)]">Status: </span>
                    <span className={`font-medium ${selectedSession.status === 'active' ? 'text-[#4EBF94]' : 'text-[var(--muted-foreground)]'}`}>
                      {selectedSession.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Time Invested: </span>
                    <span className="font-medium text-[var(--foreground)]">{formatTime(selectedSession.timeInvested)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Initial Balance: </span>
                    <span className="font-medium text-[var(--foreground)]">${selectedSession.initialBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="text-xs text-[var(--muted-foreground)] mb-1">Total P&L</div>
                <div className={`text-xl font-bold ${stats.totalPnl >= 0 ? 'text-[#4EBF94]' : 'text-red-500'}`}>
                  {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="text-xs text-[var(--muted-foreground)] mb-1">Win Rate</div>
                <div className="text-xl font-bold text-[var(--foreground)]">{stats.winRate.toFixed(1)}%</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {stats.winningTrades}W / {stats.losingTrades}L
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="text-xs text-[var(--muted-foreground)] mb-1">Avg R:R</div>
                <div className="text-xl font-bold text-[var(--foreground)]">{stats.avgRR.toFixed(2)}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="text-xs text-[var(--muted-foreground)] mb-1">Best Trade</div>
                <div className={`text-xl font-bold ${stats.bestTrade >= 0 ? 'text-[#4EBF94]' : 'text-red-500'}`}>
                  {stats.bestTrade >= 0 ? '+' : ''}${stats.bestTrade.toFixed(2)}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="text-xs text-[var(--muted-foreground)] mb-1">Worst Trade</div>
                <div className={`text-xl font-bold ${stats.worstTrade >= 0 ? 'text-[#4EBF94]' : 'text-red-500'}`}>
                  {stats.worstTrade >= 0 ? '+' : ''}${stats.worstTrade.toFixed(2)}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="text-xs text-[var(--muted-foreground)] mb-1">Profit Factor</div>
                <div className="text-xl font-bold text-[var(--foreground)]">
                  {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                </div>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="lg:col-span-2 glass-card rounded-xl p-5"
              >
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Equity Curve</h3>
                {equityCurveData.length > 1 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={equityCurveData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis 
                          dataKey="trade" 
                          stroke="var(--muted-foreground)"
                          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="var(--muted-foreground)"
                          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                          tickFormatter={(v) => `$${v.toLocaleString()}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)'
                          }}
                          labelFormatter={(v) => `Trade #${v}`}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                        />
                        <ReferenceLine 
                          y={selectedSession.initialBalance} 
                          stroke="var(--muted-foreground)" 
                          strokeDasharray="5 5" 
                        />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke={stats.totalPnl >= 0 ? '#4EBF94' : '#ef4444'}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-[var(--muted-foreground)]">
                    No closed trades yet
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="glass-card rounded-xl p-5"
              >
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Trade Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--muted-foreground)]">Total Trades</span>
                      <span className="font-medium text-[var(--foreground)]">{stats.totalTrades}</span>
                    </div>
                    <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#4EBF94] rounded-full" 
                        style={{ width: `${stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                      <span>{stats.winningTrades} winners</span>
                      <span>{stats.losingTrades} losers</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[var(--muted)]/50">
                      <div className="text-xs text-[var(--muted-foreground)]">Long Trades</div>
                      <div className="text-lg font-semibold text-[var(--foreground)]">{stats.longTrades}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--muted)]/50">
                      <div className="text-xs text-[var(--muted-foreground)]">Short Trades</div>
                      <div className="text-lg font-semibold text-[var(--foreground)]">{stats.shortTrades}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[#4EBF94]/10">
                      <div className="text-xs text-[var(--muted-foreground)]">Avg Win</div>
                      <div className="text-lg font-semibold text-[#4EBF94]">+${stats.avgWin.toFixed(2)}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10">
                      <div className="text-xs text-[var(--muted-foreground)]">Avg Loss</div>
                      <div className="text-lg font-semibold text-red-500">-${stats.avgLoss.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="p-5 border-b border-[var(--border)]">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Trade History</h3>
              </div>
              {closedTrades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--muted)]/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Side</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Entry</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Exit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">SL</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">TP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">R:R</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">P&L</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {closedTrades.map((trade, index) => (
                        <tr key={trade.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{index + 1}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                              trade.side === 'long' 
                                ? 'bg-[#4EBF94]/10 text-[#4EBF94]' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {trade.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{trade.size}</td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{trade.entryPrice.toFixed(5)}</td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{trade.exitPrice?.toFixed(5) || '-'}</td>
                          <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{trade.sl?.toFixed(5) || '-'}</td>
                          <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{trade.tp?.toFixed(5) || '-'}</td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{trade.rr?.toFixed(2) || '-'}</td>
                          <td className={`px-4 py-3 text-sm font-medium ${(trade.pnl || 0) >= 0 ? 'text-[#4EBF94]' : 'text-red-500'}`}>
                            {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                            {trade.closedAt ? formatDate(trade.closedAt) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-[var(--muted-foreground)]">
                  No trades closed yet. Start backtesting to see your trade history.
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
