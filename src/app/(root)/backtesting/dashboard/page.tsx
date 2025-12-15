"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SessionInfo {
  name: string;
  symbol: string;
  currentBalance: string;
  startDate: string;
  endDate: string;
  totalPnl: number;
  winRate: number;
}

interface Trade {
  id: number;
  type: string;
  entry: number;
  exit: number;
  lotSize: number;
  pnl: number;
  reason: string;
  timestamp: number;
}

interface Session {
  sessionId: number;
  sessionInfo: SessionInfo;
  trades: Trade[];
  createdAt: string;
  updatedAt: string;
}

export default function BacktestingDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionSymbol, setNewSessionSymbol] = useState("EURUSD");
  const [newSessionBalance, setNewSessionBalance] = useState("10000");

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

  const createSession = async () => {
    if (!newSessionName.trim()) return;
    
    try {
      const nextId = sessions.length > 0 
        ? Math.max(...sessions.map(s => s.sessionId)) + 1 
        : 1;

      const res = await fetch("/api/backtest-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: nextId,
          sessionInfo: {
            name: newSessionName,
            symbol: newSessionSymbol,
            currentBalance: newSessionBalance,
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            daysRemaining: 0,
            totalPnl: 0,
            winRate: 0,
            riskReward: 0,
            monthGainLoss: 0,
            weekGainLoss: 0,
            dailyGainLoss: 0,
          },
          trades: [],
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewSessionName("");
        fetchSessions();
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const totalPnl = sessions.reduce((sum, s) => sum + (s.sessionInfo?.totalPnl || 0), 0);
  const totalTrades = sessions.reduce((sum, s) => sum + (s.trades?.length || 0), 0);
  const avgWinRate = sessions.length > 0 
    ? sessions.reduce((sum, s) => sum + (s.sessionInfo?.winRate || 0), 0) / sessions.length 
    : 0;

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
                Practice and refine your trading strategies
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-xl p-5">
              <div className="text-sm text-[var(--muted-foreground)] mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-[var(--foreground)]">{sessions.length}</div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="text-sm text-[var(--muted-foreground)] mb-1">Total Trades</div>
              <div className="text-2xl font-bold text-[var(--foreground)]">{totalTrades}</div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="text-sm text-[var(--muted-foreground)] mb-1">Overall P&L</div>
              <div className={`text-2xl font-bold ${totalPnl >= 0 ? "text-[#4EBF94]" : "text-red-500"}`}>
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
              </div>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
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
              No sessions yet
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Create your first backtesting session to start practicing
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90"
            >
              Create Session
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, index) => (
              <motion.div
                key={session.sessionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/backtesting/${session.sessionId}`)}
                className="glass-card rounded-xl p-5 cursor-pointer hover:border-[var(--primary)]/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                      {session.sessionInfo?.name || `Session ${session.sessionId}`}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {session.sessionInfo?.symbol || "EUR/USD"}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    (session.sessionInfo?.totalPnl || 0) >= 0 
                      ? "bg-[#4EBF94]/10 text-[#4EBF94]" 
                      : "bg-red-500/10 text-red-500"
                  }`}>
                    {(session.sessionInfo?.totalPnl || 0) >= 0 ? "+" : ""}
                    ${(session.sessionInfo?.totalPnl || 0).toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-[var(--muted-foreground)]">Trades</div>
                    <div className="font-semibold text-[var(--foreground)]">
                      {session.trades?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted-foreground)]">Win Rate</div>
                    <div className="font-semibold text-[var(--foreground)]">
                      {(session.sessionInfo?.winRate || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted-foreground)]">Balance</div>
                    <div className="font-semibold text-[var(--foreground)]">
                      ${session.sessionInfo?.currentBalance || "10,000"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Created {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
              Create New Session
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g., EUR/USD Strategy Test"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                  Symbol
                </label>
                <select
                  value={newSessionSymbol}
                  onChange={(e) => setNewSessionSymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="EURUSD">EUR/USD</option>
                  <option value="GBPUSD">GBP/USD</option>
                  <option value="USDJPY">USD/JPY</option>
                  <option value="XAUUSD">XAU/USD (Gold)</option>
                  <option value="BTCUSD">BTC/USD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                  Starting Balance
                </label>
                <input
                  type="text"
                  value={newSessionBalance}
                  onChange={(e) => setNewSessionBalance(e.target.value)}
                  placeholder="10000"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createSession}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
