'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
                  Comprehensive performance analysis
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

        {selectedSession && analytics && (
          <div className="space-y-6">
            <ProfitAndLossChart
              data={analytics.equityCurve}
              totalPnl={analytics.totalPnl}
              accountBalance={analytics.accountBalance}
              winRate={analytics.winRate}
              totalTrades={analytics.totalTrades}
              breakEvenTrades={analytics.breakEvenTrades}
              initialBalance={selectedSession.initialBalance}
            />

            <RrMetricsCards metrics={analytics.rrMetrics} />

            <WinnersLosersCards 
              winners={analytics.winners} 
              losers={analytics.losers} 
            />

            <PerformanceBySide data={analytics.sidePerformance} />

            <PerformanceBySession data={analytics.sessionPerformance} />

            <PerformanceByTime data={analytics.timePerformance} />

            <PerformanceByDay data={analytics.dayPerformance} />

            <PerformanceByMonth 
              data={analytics.monthPerformance} 
              initialBalance={selectedSession.initialBalance}
            />

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
        )}

        {selectedSession && !analytics && (
          <div 
            className="rounded-2xl p-12 text-center"
            style={{ 
              background: 'linear-gradient(to bottom right, var(--af-bg-elevated, #12141a), var(--af-bg-base, #0c0d10))',
              border: '1px solid var(--af-border-default, rgba(255, 255, 255, 0.08))'
            }}
          >
            <p style={{ color: 'var(--af-text-muted, #a1a1aa)' }}>
              No trade data available for analytics. Start trading to see your performance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
