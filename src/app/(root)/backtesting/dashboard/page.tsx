"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  { value: "EURUSD", label: "EUR/USD", icon: "💶" },
  { value: "GBPUSD", label: "GBP/USD", icon: "💷" },
  { value: "USDJPY", label: "USD/JPY", icon: "💴" },
  { value: "XAUUSD", label: "XAU/USD", icon: "🥇" },
  { value: "BTCUSD", label: "BTC/USD", icon: "₿" },
  { value: "ETHUSD", label: "ETH/USD", icon: "⟠" },
];

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

export default function BacktestingDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'pnl' | 'name'>('newest');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');

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

    if (activeFilter !== 'all') {
      result = result.filter(s => s.status === activeFilter);
    }

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
  }, [sessions, searchQuery, sortBy, activeFilter]);

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

  const getProgress = useCallback((session: Session) => {
    const from = new Date(session.fromDate).getTime();
    const to = new Date(session.toDate).getTime();
    const current = session.progressPointer;
    if (to === from) return 0;
    return Math.min(100, Math.max(0, ((current - from) / (to - from)) * 100));
  }, []);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getSymbolIcon = (symbol: string) => {
    const found = SYMBOLS.find(s => s.value === symbol);
    return found?.icon || "📊";
  };

  return (
    <div className="min-h-screen af-bg-gradient" style={{ background: 'linear-gradient(to bottom right, var(--af-bg-deep, #08090b), var(--af-bg-base, #0c0d10), var(--af-bg-elevated, #12141a))' }}>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(20, 184, 166, 0.2))',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#headerGradient)" strokeWidth="2">
                    <defs>
                      <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--af-accent-blue, #3b82f6)' }} />
                        <stop offset="100%" style={{ stopColor: 'var(--af-accent-teal, #14b8a6)' }} />
                      </linearGradient>
                    </defs>
                    <path d="M3 3v18h18" />
                    <path d="M18 9l-5 5-2-2-4 4" />
                  </svg>
                </div>
                <h1 
                  className="text-3xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--af-text-primary, #f4f4f5), var(--af-text-muted, #a1a1aa))' }}
                >
                  Backtesting Lab
                </h1>
              </div>
              <p className="af-text-muted text-sm ml-[52px]">
                Master your strategies with historical market simulation
              </p>
            </div>
            
            <motion.button
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-5 py-2.5 rounded-xl font-semibold text-sm overflow-hidden"
              style={{ color: 'var(--af-text-primary, #f4f4f5)' }}
            >
              <div 
                className="absolute inset-0 transition-all duration-300"
                style={{ background: 'linear-gradient(to right, var(--af-accent-blue, #3b82f6), #2563eb)' }}
              />
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(20, 184, 166, 0.2))' }}
              />
              <span className="relative flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Session
              </span>
            </motion.button>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8"
          >
            <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl af-card p-5 transition-all duration-300" style={{ background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }} />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--af-accent-blue, #3b82f6)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Time Invested</span>
              </div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{formatTime(globalStats.timeInvested)}</div>
            </motion.div>

            <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl af-card p-5 transition-all duration-300" style={{ background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors" style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)' }} />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--af-accent-teal, #14b8a6)" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Historical Days</span>
              </div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{globalStats.historicalDays}</div>
            </motion.div>

            <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl af-card p-5 transition-all duration-300" style={{ background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors" style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }} />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--af-purple, #8b5cf6)" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Total Trades</span>
              </div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>
                {globalStats.totalTrades}
                <span className="text-xs font-medium ml-2" style={{ color: 'var(--af-text-disabled, #52525b)' }}>
                  {globalStats.longTrades}L / {globalStats.shortTrades}S
                </span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl af-card p-5 transition-all duration-300" style={{ background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)' }} />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--af-warning, #f59e0b)" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Win Rate</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--af-text-primary, #f4f4f5)' }}>{globalStats.winRate.toFixed(1)}%</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: 'var(--af-bg-hover, #1e222d)' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${globalStats.winRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(to right, #f59e0b, #fbbf24)' }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl af-card p-5 transition-all duration-300" style={{ background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors" style={{ backgroundColor: globalStats.totalPnl >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)' }} />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: globalStats.totalPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={globalStats.totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)'} strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d={globalStats.totalPnl >= 0 ? "M17 5l-5-4-5 4" : "M17 19l-5 4-5-4"} />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--af-text-disabled, #52525b)' }}>Total P&L</span>
              </div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: globalStats.totalPnl >= 0 ? 'var(--af-profit, #10b981)' : 'var(--af-loss, #ef4444)' }}>
                {globalStats.totalPnl >= 0 ? '+' : ''}${globalStats.totalPnl.toFixed(2)}
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl af-card p-5"
            style={{ background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))' }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <h2 className="text-lg font-semibold af-text-primary shrink-0">Sessions</h2>
                <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto" style={{ backgroundColor: 'var(--af-bg-base, #0c0d10)' }}>
                  {(['all', 'active', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                        activeFilter === filter 
                          ? 'bg-blue-500/20 af-text-blue border border-blue-500/30' 
                          : 'af-text-muted hover:af-text-primary'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      <span className="ml-1.5 text-[10px] opacity-60">
                        {filter === 'all' ? sessions.length : sessions.filter(s => s.status === filter).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full sm:w-56 rounded-xl border text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all af-text-primary"
                    style={{ backgroundColor: 'var(--af-bg-base, #0c0d10)', borderColor: 'var(--af-border-default, rgba(255, 255, 255, 0.08))' }}
                  />
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 af-text-disabled" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none pr-10 af-text-primary"
                  style={{ backgroundColor: 'var(--af-bg-base)', borderColor: 'var(--af-border-default)', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="pnl">Highest P&L</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-blue-500/20 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--af-accent-blue)', borderTopColor: 'transparent' }} />
            </div>
            <span className="af-text-disabled text-sm">Loading sessions...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl af-card p-16 text-center"
            style={{ background: 'linear-gradient(to bottom right, var(--af-bg-elevated), var(--af-bg-base))' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-teal-500/5" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 flex items-center justify-center border border-white/[0.06]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#emptyStateGradient)" strokeWidth="1.5">
                  <defs>
                    <linearGradient id="emptyStateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <path d="M3 3v18h18" />
                  <path d="M18 9l-5 5-2-2-4 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? "No sessions found" : "Start Your Backtesting Journey"}
              </h3>
              <p className="text-[#71717a] mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? "Try a different search term or filter" 
                  : "Create your first session to practice trading strategies on historical data without risking real money"}
              </p>
              {!searchQuery && (
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Create Your First Session
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
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
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12141a] to-[#0c0d10] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/[0.02] group-hover:via-transparent group-hover:to-teal-500/[0.02] transition-all duration-500" />
                  
                  <div className="relative p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#1e222d] to-[#181b23] flex items-center justify-center border border-white/[0.06] group-hover:border-blue-500/20 transition-colors">
                            <span className="text-lg sm:text-xl">{getSymbolIcon(session.symbol)}</span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-[#0c0d10] ${session.status === 'active' ? 'bg-emerald-500' : 'bg-[#52525b]'}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1">
                            <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors text-sm sm:text-base">
                              {session.name || 'Untitled Session'}
                            </h3>
                            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded-lg uppercase tracking-wide shrink-0 ${
                              session.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-[#1e222d] text-[#71717a] border border-white/[0.06]'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#71717a] overflow-hidden">
                            <span className="font-medium text-[#a1a1aa] shrink-0">{session.symbol || 'N/A'}</span>
                            <span className="text-[#3f3f46] shrink-0">•</span>
                            <span className="truncate">{new Date(session.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(session.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-8 justify-between sm:justify-end">
                        <div className="flex items-center gap-4 sm:gap-8">
                          <div className="hidden sm:block text-center">
                            <div className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider mb-1">Trades</div>
                            <div className="text-lg font-bold text-white tabular-nums">{closedTrades.length}</div>
                          </div>
                          <div className="hidden sm:block text-center">
                            <div className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider mb-1">Win Rate</div>
                            <div className="text-lg font-bold text-white tabular-nums">{winRate.toFixed(0)}%</div>
                          </div>
                          <div className="text-center min-w-[80px] sm:min-w-[100px]">
                            <div className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider mb-1">P&L</div>
                            <div className={`text-base sm:text-lg font-bold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="hidden lg:block w-36">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider">Progress</span>
                            <span className="text-xs font-medium text-[#a1a1aa] tabular-nums">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-[#1e222d] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <motion.button
                            onClick={() => router.push(`/backtesting/${session.sessionId}`)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-shadow whitespace-nowrap"
                          >
                            Continue
                          </motion.button>
                          
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === session.sessionId ? null : session.sessionId)}
                              className="p-2 rounded-xl hover:bg-white/[0.04] text-[#71717a] hover:text-white transition-colors"
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
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute right-0 top-full mt-2 w-44 bg-[#1a1d24] rounded-xl border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden z-20"
                                >
                                  <button
                                    onClick={() => {
                                      router.push(`/backtesting/sessions?id=${session.sessionId}`);
                                      setMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white flex items-center gap-3 transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                      <line x1="16" y1="13" x2="8" y2="13" />
                                      <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                    View Summary
                                  </button>
                                  <button
                                    onClick={() => setMenuOpen(null)}
                                    className="w-full px-4 py-2.5 text-left text-sm text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white flex items-center gap-3 transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                    </svg>
                                    Rename
                                  </button>
                                  <div className="h-px bg-white/[0.06] my-1" />
                                  <button
                                    onClick={() => deleteSession(session.sessionId)}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
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
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-2xl bg-gradient-to-br from-[#12141a] to-[#0c0d10] border border-white/[0.08] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500" />
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Create New Session
                    </h2>
                    <p className="text-sm text-[#71717a] mt-1">
                      Set up a backtesting session with historical data
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-xl hover:bg-white/[0.04] text-[#71717a] hover:text-white transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                      Session Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., EUR/USD Breakout Strategy"
                      className="w-full px-4 py-3 rounded-xl bg-[#0c0d10] border border-white/[0.06] text-white placeholder:text-[#52525b] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                      Trading Pair
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {SYMBOLS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setFormData({ ...formData, symbol: s.value })}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                            formData.symbol === s.value
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                              : 'bg-[#0c0d10] border-white/[0.06] text-[#a1a1aa] hover:border-white/[0.12] hover:text-white'
                          }`}
                        >
                          <span className="mr-2">{s.icon}</span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.fromDate}
                        onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0c0d10] border border-white/[0.06] text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.toDate}
                        onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#0c0d10] border border-white/[0.06] text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                        Starting Balance
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]">$</span>
                        <input
                          type="number"
                          value={formData.initialBalance}
                          onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                          placeholder="10000"
                          className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#0c0d10] border border-white/[0.06] text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                        Risk per Trade
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.riskPerTrade}
                          onChange={(e) => setFormData({ ...formData, riskPerTrade: e.target.value })}
                          placeholder="1"
                          step="0.5"
                          className="w-full pl-4 pr-8 py-3 rounded-xl bg-[#0c0d10] border border-white/[0.06] text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525b]">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Strategy rules, goals, or any notes..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-[#0c0d10] border border-white/[0.06] text-white placeholder:text-[#52525b] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={createSession}
                    disabled={!formData.name || !formData.fromDate || !formData.toDate}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
                  >
                    Create Session
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
