"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Star, 
  DollarSign,
  Plus,
  Search,
  MoreVertical,
  FileText,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Square,
  CheckCircle2
} from "lucide-react";

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
  market?: MarketType;
  symbol: string;
  fromDate: string;
  toDate: string;
  initialBalance: number;
  currentBalance: number;
  progressPointer: number;
  replayTimestamp?: number;
  status: 'active' | 'completed';
  description?: string;
  trades: Trade[];
  timeInvested: number;
  createdAt: string;
  updatedAt: string;
}

type MarketType = 'FOREX' | 'CRYPTO' | 'INDIAN_INDICES' | 'INDIAN_STOCK';

const MARKETS: { value: MarketType; label: string; icon: string }[] = [
  { value: "FOREX", label: "Forex", icon: "💱" },
  { value: "CRYPTO", label: "Crypto", icon: "₿" },
  { value: "INDIAN_INDICES", label: "Indian Indices", icon: "📊" },
  { value: "INDIAN_STOCK", label: "Indian Stocks", icon: "🇮🇳" },
];

const SYMBOLS_BY_MARKET: Record<MarketType, { value: string; label: string; icon: string }[]> = {
  FOREX: [
    { value: "EURUSD", label: "EUR/USD", icon: "💶" },
    { value: "GBPUSD", label: "GBP/USD", icon: "💷" },
    { value: "USDJPY", label: "USD/JPY", icon: "💴" },
    { value: "XAUUSD", label: "XAU/USD", icon: "🥇" },
    { value: "XAGUSD", label: "XAG/USD", icon: "🥈" },
    { value: "AUDUSD", label: "AUD/USD", icon: "🇦🇺" },
    { value: "USDCAD", label: "USD/CAD", icon: "🇨🇦" },
    { value: "USDCHF", label: "USD/CHF", icon: "🇨🇭" },
    { value: "NZDUSD", label: "NZD/USD", icon: "🇳🇿" },
    { value: "EURJPY", label: "EUR/JPY", icon: "🇪🇺" },
    { value: "GBPJPY", label: "GBP/JPY", icon: "🇬🇧" },
    { value: "EURGBP", label: "EUR/GBP", icon: "🇪🇺" },
  ],
  CRYPTO: [
    { value: "BTCUSDT", label: "BTC/USDT", icon: "₿" },
    { value: "ETHUSDT", label: "ETH/USDT", icon: "⟠" },
    { value: "BNBUSDT", label: "BNB/USDT", icon: "🔶" },
    { value: "XRPUSDT", label: "XRP/USDT", icon: "✕" },
    { value: "SOLUSDT", label: "SOL/USDT", icon: "◎" },
    { value: "ADAUSDT", label: "ADA/USDT", icon: "₳" },
    { value: "DOGEUSDT", label: "DOGE/USDT", icon: "🐕" },
    { value: "DOTUSDT", label: "DOT/USDT", icon: "●" },
    { value: "MATICUSDT", label: "MATIC/USDT", icon: "⬡" },
    { value: "LINKUSDT", label: "LINK/USDT", icon: "⬡" },
  ],
  INDIAN_INDICES: [
    { value: "NIFTY50", label: "NIFTY 50", icon: "📈" },
    { value: "BANKNIFTY", label: "Bank NIFTY", icon: "🏦" },
    { value: "FINNIFTY", label: "FIN NIFTY", icon: "💰" },
    { value: "NIFTYMIDCAP", label: "NIFTY Midcap", icon: "📊" },
    { value: "SENSEX", label: "SENSEX", icon: "🏛️" },
  ],
  INDIAN_STOCK: [
    { value: "RELIANCE", label: "Reliance", icon: "🛢️" },
    { value: "TCS", label: "TCS", icon: "💻" },
    { value: "HDFCBANK", label: "HDFC Bank", icon: "🏦" },
    { value: "INFY", label: "Infosys", icon: "💻" },
    { value: "ICICIBANK", label: "ICICI Bank", icon: "🏦" },
    { value: "SBIN", label: "SBI", icon: "🏦" },
    { value: "BHARTIARTL", label: "Bharti Airtel", icon: "📱" },
    { value: "ITC", label: "ITC", icon: "🏢" },
    { value: "KOTAKBANK", label: "Kotak Bank", icon: "🏦" },
    { value: "LT", label: "L&T", icon: "🏗️" },
    { value: "AXISBANK", label: "Axis Bank", icon: "🏦" },
    { value: "WIPRO", label: "Wipro", icon: "💻" },
    { value: "TATAMOTORS", label: "Tata Motors", icon: "🚗" },
    { value: "TATASTEEL", label: "Tata Steel", icon: "🏭" },
    { value: "MARUTI", label: "Maruti", icon: "🚗" },
  ],
};

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
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    market: "FOREX" as MarketType,
    symbol: "EURUSD",
    fromDate: "",
    toDate: "",
    initialBalance: "10000",
    description: ""
  });
  const [symbolSearch, setSymbolSearch] = useState("");

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

  const filteredSymbols = useMemo(() => {
    const symbols = SYMBOLS_BY_MARKET[formData.market] || [];
    if (!symbolSearch.trim()) return symbols;
    return symbols.filter(s => 
      s.value.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      s.label.toLowerCase().includes(symbolSearch.toLowerCase())
    );
  }, [formData.market, symbolSearch]);

  const handleMarketChange = (market: MarketType) => {
    const firstSymbol = SYMBOLS_BY_MARKET[market]?.[0]?.value || "";
    setFormData({ ...formData, market, symbol: firstSymbol });
    setSymbolSearch("");
  };

  const createSession = async () => {
    if (!formData.name.trim() || !formData.fromDate || !formData.toDate) return;
    
    try {
      const res = await fetch("/api/backtest-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          market: formData.market,
          symbol: formData.symbol,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          initialBalance: parseFloat(formData.initialBalance) || 10000,
          description: formData.description
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          name: "",
          market: "FOREX",
          symbol: "EURUSD",
          fromDate: "",
          toDate: "",
          initialBalance: "10000",
          description: ""
        });
        setSymbolSearch("");
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

  const toggleSessionSelection = (sessionId: number) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.sessionId)));
    }
  };

  const clearSelection = () => {
    setSelectedSessions(new Set());
  };

  const bulkDeleteSessions = async () => {
    if (selectedSessions.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedSessions.size} session${selectedSessions.size > 1 ? 's' : ''}?`)) return;
    
    setIsDeleting(true);
    const failedDeletes: number[] = [];
    
    try {
      const deletePromises = Array.from(selectedSessions).map(async (sessionId) => {
        try {
          const res = await fetch(`/api/backtest-sessions?sessionId=${sessionId}`, { method: "DELETE" });
          if (!res.ok) {
            failedDeletes.push(sessionId);
          }
        } catch {
          failedDeletes.push(sessionId);
        }
      });
      
      await Promise.all(deletePromises);
      
      if (failedDeletes.length > 0) {
        setSelectedSessions(new Set(failedDeletes));
        alert(`Failed to delete ${failedDeletes.length} session${failedDeletes.length > 1 ? 's' : ''}. They remain selected.`);
      } else {
        setSelectedSessions(new Set());
      }
      
      await fetchSessions();
    } catch (error) {
      console.error("Failed to delete sessions:", error);
    } finally {
      setIsDeleting(false);
    }
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

  const getSymbolIcon = (symbol: string, market?: string) => {
    if (market) {
      const marketSymbols = SYMBOLS_BY_MARKET[market as MarketType] || [];
      const found = marketSymbols.find(s => s.value === symbol);
      if (found) return found.icon;
    }
    for (const m of Object.values(SYMBOLS_BY_MARKET)) {
      const found = m.find(s => s.value === symbol);
      if (found) return found.icon;
    }
    return "📊";
  };

  const getMarketLabel = (market?: string) => {
    const found = MARKETS.find(m => m.value === market);
    return found?.label || market || "Forex";
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden rounded-xl border px-4 py-3",
            "bg-gradient-to-br from-primary/5 via-card to-card",
            "dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800",
            "border-border dark:border-white/[0.08]"
          )}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br from-primary/20 to-emerald-500/20",
                "border border-primary/20"
              )}>
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Backtesting Lab
                </h1>
                <p className="text-xs text-muted-foreground">
                  Master your strategies with historical market simulation
                </p>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "px-4 py-2 rounded-lg font-semibold text-sm inline-flex items-center justify-center gap-2",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Plus className="w-4 h-4" />
              New Session
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
        >
          {/* Time Invested */}
          <motion.div 
            variants={itemVariants} 
            className={cn(
              "relative overflow-hidden rounded-2xl p-4 sm:p-5",
              "bg-card border border-border",
              "dark:bg-zinc-900/50 dark:border-white/[0.08]"
            )}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                "bg-primary/10"
              )}>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Time Invested
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatTime(globalStats.timeInvested)}
            </div>
          </motion.div>

          {/* Historical Days */}
          <motion.div 
            variants={itemVariants} 
            className={cn(
              "relative overflow-hidden rounded-2xl p-4 sm:p-5",
              "bg-card border border-border",
              "dark:bg-zinc-900/50 dark:border-white/[0.08]"
            )}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10">
                <Calendar className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Historical Days
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {globalStats.historicalDays}
            </div>
          </motion.div>

          {/* Total Trades */}
          <motion.div 
            variants={itemVariants} 
            className={cn(
              "relative overflow-hidden rounded-2xl p-4 sm:p-5",
              "bg-card border border-border",
              "dark:bg-zinc-900/50 dark:border-white/[0.08]"
            )}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10">
                <TrendingUp className="w-4 h-4 text-violet-500" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Trades
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {globalStats.totalTrades}
              <span className="text-xs font-medium ml-2 text-muted-foreground">
                {globalStats.longTrades}L / {globalStats.shortTrades}S
              </span>
            </div>
          </motion.div>

          {/* Win Rate */}
          <motion.div 
            variants={itemVariants} 
            className={cn(
              "relative overflow-hidden rounded-2xl p-4 sm:p-5",
              "bg-card border border-border",
              "dark:bg-zinc-900/50 dark:border-white/[0.08]"
            )}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Win Rate
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {globalStats.winRate.toFixed(1)}%
              </span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden mb-1.5 bg-muted">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${globalStats.winRate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                />
              </div>
            </div>
          </motion.div>

          {/* Total P&L */}
          <motion.div 
            variants={itemVariants} 
            className={cn(
              "relative overflow-hidden rounded-2xl p-4 sm:p-5",
              "bg-card border border-border",
              "dark:bg-zinc-900/50 dark:border-white/[0.08]"
            )}
          >
            <div className={cn(
              "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl",
              globalStats.totalPnl >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"
            )} />
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                globalStats.totalPnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                {globalStats.totalPnl >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total P&L
              </span>
            </div>
            <div className={cn(
              "text-2xl font-bold tracking-tight",
              globalStats.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {globalStats.totalPnl >= 0 ? '+' : ''}${globalStats.totalPnl.toFixed(2)}
            </div>
          </motion.div>
        </motion.div>

        {/* Sessions Toolbar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "rounded-2xl p-4 sm:p-5",
            "bg-card border border-border",
            "dark:bg-zinc-900/50 dark:border-white/[0.08]"
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                {filteredSessions.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-md transition-all",
                      "hover:bg-muted border",
                      selectedSessions.size === filteredSessions.length && filteredSessions.length > 0
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    )}
                    title={selectedSessions.size === filteredSessions.length ? "Deselect all" : "Select all"}
                  >
                    {selectedSessions.size === filteredSessions.length && filteredSessions.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                )}
                <h2 className="text-lg font-semibold text-foreground shrink-0">Sessions</h2>
              </div>
              <div className={cn(
                "flex items-center gap-1 p-1 rounded-xl overflow-x-auto",
                "bg-muted"
              )}>
                {(['all', 'active', 'completed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
                      activeFilter === filter 
                        ? "bg-primary/20 text-primary border border-primary/30" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
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
                  className={cn(
                    "pl-10 pr-4 py-2.5 w-full sm:w-56 rounded-xl text-sm transition-all",
                    "bg-background border border-border text-foreground",
                    "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  )}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm cursor-pointer appearance-none pr-10",
                  "bg-background border border-border text-foreground",
                  "focus:outline-none focus:border-primary/50"
                )}
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, 
                  backgroundRepeat: 'no-repeat', 
                  backgroundPosition: 'right 12px center' 
                }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="pnl">Highest P&L</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full animate-spin border-2 border-border border-t-primary" />
            <span className="text-muted-foreground text-sm">Loading sessions...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative overflow-hidden rounded-2xl p-12 sm:p-16 text-center",
              "bg-card border border-border",
              "dark:bg-zinc-900/50 dark:border-white/[0.08]"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
            <div className="relative">
              <div className={cn(
                "w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br from-primary/10 to-emerald-500/10",
                "border border-primary/20"
              )}>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? "No sessions found" : "Start Your Backtesting Journey"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? "Try a different search term or filter" 
                  : "Create your first session to practice trading strategies on historical data without risking real money"}
              </p>
              {!searchQuery && (
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm",
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <Plus className="w-4 h-4" />
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
            {filteredSessions.map((session) => {
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
                  className={cn(
                    "group relative rounded-2xl transition-all duration-300",
                    "bg-card border border-border hover:border-primary/20",
                    "dark:bg-zinc-900/50 dark:border-white/[0.04] dark:hover:border-white/[0.08]",
                    menuOpen === session.sessionId && "z-30"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-transparent to-emerald-500/0 group-hover:from-primary/[0.02] group-hover:to-emerald-500/[0.02] transition-all duration-500 rounded-2xl overflow-hidden pointer-events-none" />
                  
                  <div className="relative p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSessionSelection(session.sessionId);
                          }}
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-md transition-all shrink-0",
                            "border",
                            selectedSessions.has(session.sessionId)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100",
                            selectedSessions.size > 0 && "opacity-100"
                          )}
                        >
                          {selectedSessions.has(session.sessionId) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="relative shrink-0">
                          <div className={cn(
                            "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center",
                            "bg-muted border border-border group-hover:border-primary/20 transition-colors"
                          )}>
                            <span className="text-lg sm:text-xl">{getSymbolIcon(session.symbol, session.market)}</span>
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-card",
                            session.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-sm sm:text-base">
                              {session.name || 'Untitled Session'}
                            </h3>
                            <span className={cn(
                              "px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded-lg uppercase tracking-wide shrink-0",
                              session.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : 'bg-muted text-muted-foreground border border-border'
                            )}>
                              {session.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground overflow-hidden">
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium shrink-0">
                              {getMarketLabel(session.market)}
                            </span>
                            <span className="font-medium text-foreground/70 shrink-0">{session.symbol || 'N/A'}</span>
                            <span className="shrink-0">•</span>
                            <span className="truncate">
                              {new Date(session.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(session.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-8 justify-between sm:justify-end">
                        <div className="flex items-center gap-4 sm:gap-8">
                          <div className="hidden sm:block text-center">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Trades</div>
                            <div className="text-lg font-bold text-foreground tabular-nums">{closedTrades.length}</div>
                          </div>
                          <div className="hidden sm:block text-center">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Win Rate</div>
                            <div className="text-lg font-bold text-foreground tabular-nums">{winRate.toFixed(0)}%</div>
                          </div>
                          <div className="text-center min-w-[80px] sm:min-w-[100px]">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">P&L</div>
                            <div className={cn(
                              "text-base sm:text-lg font-bold tabular-nums",
                              pnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                            )}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="hidden lg:block w-36">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Progress</span>
                            <span className="text-xs font-medium text-foreground/70 tabular-nums">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <motion.button
                            onClick={() => router.push(`/backtesting/${session.sessionId}`)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap",
                              "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                          >
                            Continue
                          </motion.button>
                          
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === session.sessionId ? null : session.sessionId)}
                              className={cn(
                                "p-2 rounded-xl transition-colors",
                                "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            <AnimatePresence>
                              {menuOpen === session.sessionId && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className={cn(
                                    "absolute right-0 top-full mt-2 w-44 rounded-xl z-50",
                                    "bg-card border border-border shadow-xl"
                                  )}
                                >
                                  <button
                                    onClick={() => {
                                      router.push(`/backtesting/sessions?id=${session.sessionId}`);
                                      setMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View Summary
                                  </button>
                                  <button
                                    onClick={() => setMenuOpen(null)}
                                    className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Rename
                                  </button>
                                  <div className="h-px bg-border my-1" />
                                  <button
                                    onClick={() => deleteSession(session.sessionId)}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
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

      {/* Create Session Modal */}
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
              className={cn(
                "relative w-full max-w-xl rounded-2xl overflow-hidden",
                "bg-card border border-border shadow-2xl"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary" />
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Create New Session
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set up a backtesting session with historical data
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Session Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., EUR/USD Breakout Strategy"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground",
                        "bg-background border border-border",
                        "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Market Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {MARKETS.map(m => (
                        <button
                          key={m.value}
                          onClick={() => handleMarketChange(m.value)}
                          className={cn(
                            "p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1",
                            formData.market === m.value
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-background border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                          )}
                        >
                          <span className="text-lg">{m.icon}</span>
                          <span className="text-xs">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Symbol
                    </label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={symbolSearch}
                        onChange={(e) => setSymbolSearch(e.target.value)}
                        placeholder="Search symbols..."
                        className={cn(
                          "w-full pl-10 pr-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground",
                          "bg-background border border-border",
                          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {filteredSymbols.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setFormData({ ...formData, symbol: s.value })}
                          className={cn(
                            "p-2.5 rounded-xl border text-sm font-medium transition-all",
                            formData.symbol === s.value
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-background border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                          )}
                        >
                          <span className="mr-1.5">{s.icon}</span>
                          {s.label}
                        </button>
                      ))}
                      {filteredSymbols.length === 0 && (
                        <div className="col-span-3 py-4 text-center text-muted-foreground text-sm">
                          No symbols found
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.fromDate}
                        onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl text-foreground",
                          "bg-background border border-border",
                          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.toDate}
                        onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl text-foreground",
                          "bg-background border border-border",
                          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Starting Balance
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={formData.initialBalance}
                        onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                        placeholder="10000"
                        className={cn(
                          "w-full pl-8 pr-4 py-3 rounded-xl text-foreground",
                          "bg-background border border-border",
                          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Strategy rules, goals, or any notes..."
                      rows={2}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground resize-none",
                        "bg-background border border-border",
                        "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl font-medium transition-colors",
                      "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={createSession}
                    disabled={!formData.name || !formData.fromDate || !formData.toDate}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl font-semibold transition-all",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Create Session
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedSessions.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className={cn(
              "flex items-center gap-4 px-6 py-3 rounded-2xl shadow-2xl",
              "bg-card/95 backdrop-blur-xl border border-border",
              "dark:bg-zinc-900/95 dark:border-white/[0.08]"
            )}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">
                  {selectedSessions.size} selected
                </span>
              </div>
              <div className="w-px h-6 bg-border" />
              <button
                onClick={clearSelection}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Cancel
              </button>
              <motion.button
                onClick={bulkDeleteSessions}
                disabled={isDeleting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  "bg-red-500 text-white hover:bg-red-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
