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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom right, var(--af-bg-deep, #08090b), var(--af-bg-base, #0c0d10), var(--af-bg-elevated, #12141a))' }}
      >
        <div 
          className="w-10 h-10 rounded-full animate-spin"
          style={{ 
            border: '2px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
            borderTopColor: 'var(--af-accent-blue, #3b82f6)'
          }}
        />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div 
        className="min-h-screen p-6"
        style={{ background: 'linear-gradient(to bottom right, var(--af-bg-deep, #08090b), var(--af-bg-base, #0c0d10), var(--af-bg-elevated, #12141a))' }}
      >
        <div className="max-w-7xl mx-auto">
          <div 
            className="relative rounded-2xl p-12 text-center overflow-hidden"
            style={{ 
              background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
              border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
            }}
          >
            <div className="absolute inset-0 opacity-50" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), transparent, rgba(20, 184, 166, 0.05))' }} />
            <div className="relative">
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(20, 184, 166, 0.1))',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#emptyGradient)" strokeWidth="2">
                  <defs>
                    <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'var(--af-accent-blue, #3b82f6)' }} />
                      <stop offset="100%" style={{ stopColor: 'var(--af-accent-teal, #14b8a6)' }} />
                    </linearGradient>
                  </defs>
                  <path d="M3 3v18h18" />
                  <path d="M18 9l-5 5-2-2-4 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>No Sessions Yet</h3>
              <p className="mb-6" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>
                Create a backtesting session to view analytics
              </p>
              <motion.button
                onClick={() => router.push('/backtesting/dashboard')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl font-semibold text-sm"
                style={{ 
                  background: 'linear-gradient(to right, var(--af-accent-blue, #3b82f6), #2563eb)',
                  color: 'var(--af-text-primary, #f4f4f5)'
                }}
              >
                Go to Dashboard
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{ background: 'linear-gradient(to bottom right, var(--af-bg-deep, #08090b), var(--af-bg-base, #0c0d10), var(--af-bg-elevated, #12141a))' }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(20, 184, 166, 0.2))',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#headerGrad)" strokeWidth="2">
                  <defs>
                    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'var(--af-accent-blue, #3b82f6)' }} />
                      <stop offset="100%" style={{ stopColor: 'var(--af-accent-teal, #14b8a6)' }} />
                    </linearGradient>
                  </defs>
                  <path d="M3 3v18h18" />
                  <path d="M18 9l-5 5-2-2-4 4" />
                </svg>
              </div>
              <div>
                <h1 
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--af-text-primary, #f4f4f5), var(--af-text-muted, #a1a1aa))' }}
                >
                  Session Analytics
                </h1>
                <p className="text-sm" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>
                  Detailed performance analysis for your backtesting sessions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedSessionId || ''}
                onChange={(e) => handleSessionChange(parseInt(e.target.value))}
                className="px-4 py-2.5 rounded-xl text-sm focus:outline-none min-w-[200px] cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--af-bg-base, #0c0d10)',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                  color: 'var(--af-text-primary, #f4f4f5)'
                }}
              >
                {sessions.map(session => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.name} ({session.symbol})
                  </option>
                ))}
              </select>
              <button
                onClick={() => router.push('/backtesting/dashboard')}
                className="px-4 py-2.5 text-sm rounded-xl font-medium transition-colors hover:opacity-80"
                style={{ 
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                  color: 'var(--af-text-muted, #a1a1aa)'
                }}
              >
                Back to Dashboard
              </button>
              {selectedSession && (
                <motion.button
                  onClick={() => router.push(`/backtesting/${selectedSession.sessionId}`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2.5 text-sm rounded-xl font-semibold"
                  style={{ 
                    background: 'linear-gradient(to right, var(--af-accent-blue, #3b82f6), #2563eb)',
                    color: 'var(--af-text-primary, #f4f4f5)'
                  }}
                >
                  Open Chart
                </motion.button>
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
              className="relative rounded-2xl p-5 mb-6 overflow-hidden"
              style={{ 
                background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, var(--af-accent-blue, #3b82f6), var(--af-accent-teal, #14b8a6))' }} />
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  >
                    <span className="text-sm font-bold" style={{ color: 'var(--af-accent-blue, #3b82f6)' }}>
                      {selectedSession.symbol.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{selectedSession.name}</h2>
                    <p className="text-xs" style={{ color: 'var(--af-text-disabled, #52525b)' }}>
                      {selectedSession.symbol} • {new Date(selectedSession.fromDate).toLocaleDateString()} → {new Date(selectedSession.toDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--af-text-disabled, #52525b)' }}>Status:</span>
                    <span 
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ 
                        backgroundColor: selectedSession.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(82, 82, 91, 0.2)',
                        color: selectedSession.status === 'active' ? 'var(--af-profit, #10b981)' : 'var(--af-text-disabled, #52525b)'
                      }}
                    >
                      {selectedSession.status}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--af-text-disabled, #52525b)' }}>Time: </span>
                    <span className="font-medium" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{formatTime(selectedSession.timeInvested)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--af-text-disabled, #52525b)' }}>Balance: </span>
                    <span className="font-medium" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>${selectedSession.initialBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
            >
              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl p-4 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
                }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ backgroundColor: stats.totalPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: stats.totalPnl >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={stats.totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'} strokeWidth="2">
                      <path d="M12 2v20M17 5l-5-4-5 4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Total P&L</span>
                </div>
                <div className="text-xl font-bold" style={{ color: stats.totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)' }}>
                  {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl p-4 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
                }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--af-warning, #f59e0b)" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Win Rate</span>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{stats.winRate.toFixed(1)}%</div>
                <div className="text-[10px]" style={{ color: 'var(--af-text-disabled, #52525b)' }}>
                  {stats.winningTrades}W / {stats.losingTrades}L
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl p-4 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
                }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--af-purple, #8b5cf6)" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Avg R:R</span>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{stats.avgRR.toFixed(2)}</div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl p-4 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
                }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--af-profit, #10b981)" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Best Trade</span>
                </div>
                <div className="text-xl font-bold" style={{ color: stats.bestTrade >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)' }}>
                  {stats.bestTrade >= 0 ? '+' : ''}${stats.bestTrade.toFixed(2)}
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl p-4 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
                }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--af-loss, #ef4444)" strokeWidth="2">
                      <path d="M12 2v20M17 19l-5 4-5-4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Worst Trade</span>
                </div>
                <div className="text-xl font-bold" style={{ color: stats.worstTrade >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)' }}>
                  {stats.worstTrade >= 0 ? '+' : ''}${stats.worstTrade.toFixed(2)}
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="relative rounded-2xl p-4 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
                }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)' }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--af-accent-teal, #14b8a6)" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Profit Factor</span>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
                  {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                </div>
              </motion.div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 rounded-2xl p-5 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
                }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>Equity Curve</h3>
                {equityCurveData.length > 1 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={equityCurveData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                        <XAxis 
                          dataKey="trade" 
                          stroke="var(--af-text-disabled, #52525b)"
                          tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                        />
                        <YAxis 
                          stroke="var(--af-text-disabled, #52525b)"
                          tick={{ fill: 'var(--af-text-disabled, #52525b)', fontSize: 12 }}
                          tickFormatter={(v) => `$${v.toLocaleString()}`}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--af-bg-elevated, #12141a)',
                            border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))',
                            borderRadius: '12px',
                            color: 'var(--af-text-primary, #f4f4f5)'
                          }}
                          labelFormatter={(v) => `Trade #${v}`}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                        />
                        <ReferenceLine 
                          y={selectedSession.initialBalance} 
                          stroke="var(--af-text-disabled, #52525b)" 
                          strokeDasharray="5 5" 
                        />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke={stats.totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: stats.totalPnl >= 0 ? '#10b981' : '#ef4444' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>
                    No closed trades yet
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="rounded-2xl p-5"
                style={{ 
                  background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                  border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
                }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>Trade Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>Total Trades</span>
                      <span className="font-medium" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{stats.totalTrades}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)' }}>
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 0}%`,
                          background: 'linear-gradient(to right, var(--af-profit, #10b981), #34d399)'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--af-text-disabled, #52525b)' }}>
                      <span>{stats.winningTrades} winners</span>
                      <span>{stats.losingTrades} losers</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)' }}>
                      <div className="text-xs" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Long Trades</div>
                      <div className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{stats.longTrades}</div>
                    </div>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)' }}>
                      <div className="text-xs" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Short Trades</div>
                      <div className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{stats.shortTrades}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                      <div className="text-xs" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Avg Win</div>
                      <div className="text-lg font-semibold" style={{ color: 'var(--af-profit, #10b981)' }}>+${stats.avgWin.toFixed(2)}</div>
                    </div>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                      <div className="text-xs" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Avg Loss</div>
                      <div className="text-lg font-semibold" style={{ color: 'var(--af-loss, #ef4444)' }}>-${stats.avgLoss.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="rounded-2xl overflow-hidden"
              style={{ 
                background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
                border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
              }}
            >
              <div className="p-5" style={{ borderBottom: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))' }}>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>Trade History</h3>
              </div>
              {closedTrades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)' }}>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Side</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Entry</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Exit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>SL</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>TP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>R:R</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>P&L</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedTrades.map((trade, index) => (
                        <tr 
                          key={trade.id} 
                          className="transition-colors hover:opacity-80"
                          style={{ borderBottom: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.05))' }}
                        >
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{index + 1}</td>
                          <td className="px-4 py-3">
                            <span 
                              className="px-2 py-0.5 text-xs rounded font-medium"
                              style={{ 
                                backgroundColor: trade.side === 'long' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: trade.side === 'long' ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'
                              }}
                            >
                              {trade.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{trade.size}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{trade.entryPrice.toFixed(5)}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{trade.exitPrice?.toFixed(5) || '-'}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--af-text-disabled, #52525b)' }}>{trade.sl?.toFixed(5) || '-'}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--af-text-disabled, #52525b)' }}>{trade.tp?.toFixed(5) || '-'}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{trade.rr?.toFixed(2) || '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: (trade.pnl || 0) >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)' }}>
                            {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--af-text-disabled, #52525b)' }}>
                            {trade.closedAt ? new Date(trade.closedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center" style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>
                  No closed trades yet. Start trading to see your history.
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
