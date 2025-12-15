"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
  trades: Trade[];
  timeInvested: number;
  createdAt: string;
  updatedAt: string;
}

const SYMBOLS = [
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
  { value: "XAUUSD", label: "XAU/USD (Gold)" },
  { value: "BTCUSD", label: "BTC/USD" },
  { value: "ETHUSD", label: "ETH/USD" },
];

export default function BacktestingDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'pnl' | 'name'>('newest');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "EURUSD",
    fromDate: "",
    toDate: "",
    initialBalance: "10000",
    description: "",
    riskPerTrade: "1"
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/backtest-sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const globalStats = useMemo(() => {
    const allTrades = sessions.flatMap(s => s.trades || []);
    const closedTrades = allTrades.filter(t => t.status === 'closed');
    const longTrades = closedTrades.filter(t => t.side === 'long').length;
    const shortTrades = closedTrades.filter(t => t.side === 'short').length;
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalTimeInvested = sessions.reduce((sum, s) => sum + (s.timeInvested || 0), 0);
    
    const historicalDays = sessions.reduce((sum, s) => {
      if (!s.fromDate || !s.toDate) return sum;
      const from = new Date(s.fromDate);
      const to = new Date(s.toDate);
      const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      return sum + (isNaN(days) ? 0 : days);
    }, 0);

    return {
      totalTrades: closedTrades.length,
      longTrades,
      shortTrades,
      winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
      totalPnl,
      timeInvested: totalTimeInvested,
      historicalDays,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    let result = sessions.filter(s => 
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.symbol || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'pnl':
        result.sort((a, b) => (b.currentBalance - b.initialBalance) - (a.currentBalance - a.initialBalance));
        break;
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }

    return result;
  }, [sessions, searchQuery, sortBy]);

  const createSession = async () => {
    if (!formData.name.trim() || !formData.fromDate || !formData.toDate) return;
    
    try {
      const res = await fetch("/api/backtest-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          symbol: formData.symbol,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          initialBalance: parseFloat(formData.initialBalance) || 10000,
          description: formData.description,
          riskPerTrade: parseFloat(formData.riskPerTrade) || 1
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          name: "",
          symbol: "EURUSD",
          fromDate: "",
          toDate: "",
          initialBalance: "10000",
          description: "",
          riskPerTrade: "1"
        });
        fetchSessions();
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    
    try {
      const res = await fetch(`/api/backtest-sessions?sessionId=${sessionId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
    setMenuOpen(null);
  };

  const getProgress = (session: Session) => {
    const from = new Date(session.fromDate).getTime();
    const to = new Date(session.toDate).getTime();
    const current = session.progressPointer;
    if (to === from) return 0;
    return Math.min(100, Math.max(0, ((current - from) / (to - from)) * 100));
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                Backtesting Dashboard
              </h1>
              <p className="text-[var(--muted-foreground)] mt-1">
                Practice and refine your trading strategies with historical data
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Session
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4">
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Time Invested</div>
              <div className="text-xl font-bold text-[var(--foreground)]">{formatTime(globalStats.timeInvested)}</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Historical Days</div>
              <div className="text-xl font-bold text-[var(--foreground)]">{globalStats.historicalDays}</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Total Trades</div>
              <div className="text-xl font-bold text-[var(--foreground)]">
                {globalStats.totalTrades}
                <span className="text-xs font-normal text-[var(--muted-foreground)] ml-2">
                  ({globalStats.longTrades}L / {globalStats.shortTrades}S)
                </span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Win Rate</div>
              <div className="text-xl font-bold text-[var(--foreground)]">{globalStats.winRate.toFixed(1)}%</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Overall P&L</div>
              <div className={`text-xl font-bold ${globalStats.totalPnl >= 0 ? "text-[#4EBF94]" : "text-red-500"}`}>
                {globalStats.totalPnl >= 0 ? "+" : ""}${globalStats.totalPnl.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Sessions</h2>
                <span className="px-2 py-0.5 text-xs bg-[var(--muted)] rounded-full text-[var(--muted-foreground)]">
                  {sessions.length} total
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-48"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="pnl">Highest P&L</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-2-2-4 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              {searchQuery ? "No sessions found" : "No sessions yet"}
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              {searchQuery ? "Try a different search term" : "Create your first backtesting session to start practicing"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90"
              >
                Create Session
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session, index) => {
              const progress = getProgress(session);
              const pnl = session.currentBalance - session.initialBalance;
              const closedTrades = (session.trades || []).filter(t => t.status === 'closed');
              const winRate = closedTrades.length > 0 
                ? (closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length) * 100 
                : 0;

              return (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass-card rounded-xl overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[var(--primary)]">
                            {(session.symbol || '').slice(0, 3)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[var(--foreground)] truncate">
                              {session.name || 'Untitled'}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              session.status === 'active' 
                                ? 'bg-[#4EBF94]/10 text-[#4EBF94]' 
                                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {session.symbol || 'N/A'} • {new Date(session.fromDate).toLocaleDateString()} → {new Date(session.toDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden md:block text-center px-4">
                          <div className="text-xs text-[var(--muted-foreground)]">Trades</div>
                          <div className="font-semibold text-[var(--foreground)]">{closedTrades.length}</div>
                        </div>
                        <div className="hidden md:block text-center px-4">
                          <div className="text-xs text-[var(--muted-foreground)]">Win Rate</div>
                          <div className="font-semibold text-[var(--foreground)]">{winRate.toFixed(1)}%</div>
                        </div>
                        <div className="text-center px-4">
                          <div className="text-xs text-[var(--muted-foreground)]">P&L</div>
                          <div className={`font-semibold ${pnl >= 0 ? 'text-[#4EBF94]' : 'text-red-500'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </div>
                        </div>
                        <div className="hidden lg:block w-32">
                          <div className="text-xs text-[var(--muted-foreground)] mb-1">Progress</div>
                          <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[var(--primary)] rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">{progress.toFixed(0)}%</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/backtesting/${session.sessionId}`)}
                            className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 whitespace-nowrap"
                          >
                            Go to Chart
                          </button>
                          <button
                            onClick={() => router.push(`/backtesting/sessions?id=${session.sessionId}`)}
                            className="px-3 py-1.5 text-sm border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] whitespace-nowrap"
                          >
                            Summary
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === session.sessionId ? null : session.sessionId)}
                              className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="12" cy="5" r="1"/>
                                <circle cx="12" cy="19" r="1"/>
                              </svg>
                            </button>
                            <AnimatePresence>
                              {menuOpen === session.sessionId && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-full mt-1 w-40 glass-card rounded-lg shadow-lg overflow-hidden z-10"
                                >
                                  <button
                                    onClick={() => {
                                      setMenuOpen(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => {
                                      setMenuOpen(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                                  >
                                    Duplicate
                                  </button>
                                  <button
                                    onClick={() => deleteSession(session.sessionId)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-[var(--muted)]"
                                  >
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card rounded-xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                Create New Session
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Set up a new backtesting session with historical data
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Session Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., EUR/USD Trend Strategy"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Symbol *
                  </label>
                  <select
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {SYMBOLS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      From Date *
                    </label>
                    <input
                      type="date"
                      value={formData.fromDate}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      To Date *
                    </label>
                    <input
                      type="date"
                      value={formData.toDate}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Initial Balance
                    </label>
                    <input
                      type="number"
                      value={formData.initialBalance}
                      onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                      placeholder="10000"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Risk per Trade (%)
                    </label>
                    <input
                      type="number"
                      value={formData.riskPerTrade}
                      onChange={(e) => setFormData({ ...formData, riskPerTrade: e.target.value })}
                      placeholder="1"
                      step="0.5"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Strategy notes, goals, etc."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createSession}
                  disabled={!formData.name || !formData.fromDate || !formData.toDate}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
