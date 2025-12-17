'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBacktestAnalytics, type Session, type Trade } from '@/hooks/backtesting/useBacktestAnalytics';
import {
  ProfitAndLossChart,
  RrMetricsCards,
  WinnersLosersCards,
  PerformanceBySide,
  PerformanceBySession,
  PerformanceByTime,
  PerformanceByDay,
  PerformanceByMonth,
  PerformanceCalendar,
  TradeFrequencyCharts
} from '@/components/backtesting/analytics';

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

  const analytics = useBacktestAnalytics(selectedSession);

  const handleSessionChange = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    router.push(`/backtesting/sessions?id=${sessionId}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full animate-spin border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className={cn(
            "relative rounded-2xl p-12 text-center overflow-hidden",
            "bg-card border border-border",
            "dark:bg-zinc-900/50 dark:border-white/[0.08]"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
            <div className="relative">
              <div className={cn(
                "w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br from-primary/10 to-emerald-500/10",
                "border border-primary/20"
              )}>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Sessions Yet</h3>
              <p className="mb-6 text-muted-foreground">
                Create a backtesting session to view analytics
              </p>
              <motion.button
                onClick={() => router.push('/backtesting/dashboard')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "px-6 py-3 rounded-xl font-semibold text-sm",
                  "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
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
    <div className="min-h-screen p-4 sm:p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden rounded-2xl border p-6",
            "bg-gradient-to-br from-primary/5 via-card to-card",
            "dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800",
            "border-border dark:border-white/[0.08]"
          )}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-primary/20 to-emerald-500/20",
                "border border-primary/20"
              )}>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Session Analytics
                </h1>
                <p className="text-sm text-muted-foreground">
                  Comprehensive performance analysis
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-shrink-0">
              <select
                value={selectedSessionId || ''}
                onChange={(e) => handleSessionChange(parseInt(e.target.value))}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm focus:outline-none w-full sm:min-w-[200px] cursor-pointer",
                  "bg-card border border-border text-foreground",
                  "focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                )}
              >
                {sessions.map(session => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.name} ({session.symbol})
                  </option>
                ))}
              </select>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => router.push('/backtesting/dashboard')}
                  className={cn(
                    "px-4 py-2.5 text-sm rounded-xl font-medium transition-colors whitespace-nowrap",
                    "border border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  Back to Dashboard
                </button>
                
                {selectedSession && (
                  <motion.button
                    onClick={() => router.push(`/backtesting/${selectedSession.sessionId}`)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "px-4 py-2.5 text-sm rounded-xl font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap",
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    Open Chart
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Content */}
        {selectedSession && analytics && (
          <div className="space-y-6">
            {/* P&L Chart - Full Width */}
            <ProfitAndLossChart
              data={analytics.equityCurve}
              totalPnl={analytics.totalPnl}
              accountBalance={analytics.accountBalance}
              winRate={analytics.winRate}
              totalTrades={analytics.totalTrades}
              breakEvenTrades={analytics.breakEvenTrades}
              initialBalance={selectedSession.initialBalance}
            />

            {/* R:R Metrics */}
            <RrMetricsCards metrics={analytics.rrMetrics} />

            {/* Winners/Losers + Performance by Side - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WinnersLosersCards 
                winners={analytics.winners} 
                losers={analytics.losers} 
              />
              <PerformanceBySide data={analytics.sidePerformance} />
            </div>

            {/* Performance by Session - Full Width */}
            <PerformanceBySession data={analytics.sessionPerformance} />

            {/* Performance by Time + Day - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceByTime data={analytics.timePerformance} />
              <PerformanceByDay data={analytics.dayPerformance} />
            </div>

            {/* Performance by Month - Full Width */}
            <PerformanceByMonth 
              data={analytics.monthPerformance} 
              initialBalance={selectedSession.initialBalance}
            />

            {/* Calendar + Trade Frequency - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceCalendar 
                trades={selectedSession.trades || []} 
                initialBalance={selectedSession.initialBalance}
              />
              <TradeFrequencyCharts
                daily={analytics.tradeFrequency.daily}
                weekly={analytics.tradeFrequency.weekly}
                monthly={analytics.tradeFrequency.monthly}
                avgDaily={analytics.tradeFrequency.avgDaily}
                avgWeekly={analytics.tradeFrequency.avgWeekly}
                avgMonthly={analytics.tradeFrequency.avgMonthly}
              />
            </div>
          </div>
        )}

        {/* No Trades State */}
        {selectedSession && !analytics && (
          <div className={cn(
            "rounded-2xl p-12 text-center",
            "bg-card border border-border",
            "dark:bg-zinc-900/50 dark:border-white/[0.08]"
          )}>
            <p className="text-muted-foreground">
              No trade data available for analytics. Start trading to see your performance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
