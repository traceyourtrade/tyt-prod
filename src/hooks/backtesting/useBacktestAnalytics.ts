import { useMemo } from 'react';

export interface Trade {
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

export interface Session {
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

export interface EquityPoint {
  trade: number;
  balance: number;
  pnl: number;
  cumulativePnl: number;
  date: string;
  timestamp: number;
}

export interface RrMetrics {
  averageRR: number;
  maxRR: number;
  idealAverageRR: number;
  maxIdealRR: number;
  couldHaveProfitBE: number;
}

export interface WinLossStats {
  total: number;
  bestPercent: number;
  worstPercent: number;
  averagePercent: number;
  averageDuration: number;
  maxConsecutive: number;
  avgConsecutive: number;
}

export interface SidePerformance {
  side: 'long' | 'short';
  totalTrades: number;
  winRate: number;
  totalPnl: number;
}

export interface SessionPerformance {
  session: 'Asia' | 'London' | 'New York';
  winRate: number;
  totalTrades: number;
  avgRR: number;
  profit: number;
}

export interface TimePerformance {
  hour: number;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
}

export interface DayPerformance {
  day: string;
  dayIndex: number;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
}

export interface MonthPerformance {
  month: number;
  year: number;
  gainPercent: number;
  overallGainPercent: number;
  trades: number;
}

export interface CalendarDay {
  date: string;
  day: number;
  pnl: number;
  trades: number;
  isCurrentMonth: boolean;
}

export interface TradeFrequency {
  period: string;
  count: number;
  label: string;
}

export interface BacktestAnalytics {
  equityCurve: EquityPoint[];
  totalPnl: number;
  accountBalance: number;
  winRate: number;
  totalTrades: number;
  breakEvenTrades: number;
  rrMetrics: RrMetrics;
  winners: WinLossStats;
  losers: WinLossStats;
  sidePerformance: SidePerformance[];
  sessionPerformance: SessionPerformance[];
  timePerformance: TimePerformance[];
  dayPerformance: DayPerformance[];
  monthPerformance: MonthPerformance[];
  calendarData: CalendarDay[];
  tradeFrequency: {
    daily: TradeFrequency[];
    weekly: TradeFrequency[];
    monthly: TradeFrequency[];
    avgDaily: number;
    avgWeekly: number;
    avgMonthly: number;
  };
}

function getTradingSession(timestamp: number): 'Asia' | 'London' | 'New York' {
  const date = new Date(timestamp);
  const utcHour = date.getUTCHours();
  
  if (utcHour >= 0 && utcHour < 8) return 'Asia';
  if (utcHour >= 8 && utcHour < 13) return 'London';
  return 'New York';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

function getConsecutiveStats(trades: Trade[], isWinner: boolean): { max: number; avg: number } {
  let currentStreak = 0;
  let maxStreak = 0;
  const streaks: number[] = [];
  
  trades.forEach(trade => {
    const pnl = trade.pnl || 0;
    const matches = isWinner ? pnl > 0 : pnl < 0;
    
    if (matches) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (currentStreak > 0) {
      streaks.push(currentStreak);
      currentStreak = 0;
    }
  });
  
  if (currentStreak > 0) streaks.push(currentStreak);
  
  const avgStreak = streaks.length > 0 
    ? streaks.reduce((a, b) => a + b, 0) / streaks.length 
    : 0;
  
  return { max: maxStreak, avg: avgStreak };
}

export function useBacktestAnalytics(session: Session | null): BacktestAnalytics | null {
  return useMemo(() => {
    if (!session) return null;
    
    const closedTrades = (session.trades || [])
      .filter(t => t.status === 'closed')
      .sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0));
    
    if (closedTrades.length === 0) {
      return {
        equityCurve: [],
        totalPnl: 0,
        accountBalance: session.currentBalance,
        winRate: 0,
        totalTrades: 0,
        breakEvenTrades: 0,
        rrMetrics: { averageRR: 0, maxRR: 0, idealAverageRR: 0, maxIdealRR: 0, couldHaveProfitBE: 0 },
        winners: { total: 0, bestPercent: 0, worstPercent: 0, averagePercent: 0, averageDuration: 0, maxConsecutive: 0, avgConsecutive: 0 },
        losers: { total: 0, bestPercent: 0, worstPercent: 0, averagePercent: 0, averageDuration: 0, maxConsecutive: 0, avgConsecutive: 0 },
        sidePerformance: [],
        sessionPerformance: [],
        timePerformance: [],
        dayPerformance: [],
        monthPerformance: [],
        calendarData: [],
        tradeFrequency: { daily: [], weekly: [], monthly: [], avgDaily: 0, avgWeekly: 0, avgMonthly: 0 }
      };
    }

    let balance = session.initialBalance;
    let cumulativePnl = 0;
    const equityCurve: EquityPoint[] = [{
      trade: 0,
      balance,
      pnl: 0,
      cumulativePnl: 0,
      date: new Date(session.fromDate).toLocaleDateString(),
      timestamp: new Date(session.fromDate).getTime()
    }];

    closedTrades.forEach((trade, index) => {
      const tradePnl = trade.pnl || 0;
      balance += tradePnl;
      cumulativePnl += tradePnl;
      equityCurve.push({
        trade: index + 1,
        balance,
        pnl: tradePnl,
        cumulativePnl,
        date: trade.closedAt ? new Date(trade.closedAt).toLocaleDateString() : '',
        timestamp: trade.closedAt || 0
      });
    });

    const pnls = closedTrades.map(t => t.pnl || 0);
    const totalPnl = pnls.reduce((a, b) => a + b, 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
    const breakEvenTrades = closedTrades.filter(t => (t.pnl || 0) === 0);

    const rrs = closedTrades.map(t => t.rr || 0).filter(r => r !== 0);
    const idealRRs = closedTrades.map(t => {
      if (!t.tp || !t.sl || !t.entryPrice) return 0;
      const tpDiff = Math.abs(t.tp - t.entryPrice);
      const slDiff = Math.abs(t.sl - t.entryPrice);
      return slDiff > 0 ? tpDiff / slDiff : 0;
    }).filter(r => r > 0);

    const couldHaveProfitBE = closedTrades.filter(t => {
      if ((t.pnl || 0) >= 0) return false;
      if (!t.tp || !t.exitPrice || !t.entryPrice) return false;
      const side = t.side;
      if (side === 'long') {
        return t.exitPrice < t.entryPrice && t.tp > t.entryPrice;
      } else {
        return t.exitPrice > t.entryPrice && t.tp < t.entryPrice;
      }
    }).length;

    const rrMetrics: RrMetrics = {
      averageRR: rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0,
      maxRR: rrs.length > 0 ? Math.max(...rrs) : 0,
      idealAverageRR: idealRRs.length > 0 ? idealRRs.reduce((a, b) => a + b, 0) / idealRRs.length : 0,
      maxIdealRR: idealRRs.length > 0 ? Math.max(...idealRRs) : 0,
      couldHaveProfitBE
    };

    const calcWinLossStats = (trades: Trade[], isWinner: boolean): WinLossStats => {
      if (trades.length === 0) {
        return { total: 0, bestPercent: 0, worstPercent: 0, averagePercent: 0, averageDuration: 0, maxConsecutive: 0, avgConsecutive: 0 };
      }

      const percents = trades.map(t => {
        const pnl = t.pnl || 0;
        return (pnl / session.initialBalance) * 100;
      });

      const durations = trades.map(t => {
        if (!t.closedAt || !t.openedAt) return 0;
        return (t.closedAt - t.openedAt) / (1000 * 60);
      }).filter(d => d > 0);

      const consecutive = getConsecutiveStats(closedTrades, isWinner);

      return {
        total: trades.length,
        bestPercent: isWinner ? Math.max(...percents) : Math.min(...percents),
        worstPercent: isWinner ? Math.min(...percents.filter(p => p > 0)) : Math.max(...percents.filter(p => p < 0)),
        averagePercent: percents.reduce((a, b) => a + b, 0) / percents.length,
        averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        maxConsecutive: consecutive.max,
        avgConsecutive: consecutive.avg
      };
    };

    const longTrades = closedTrades.filter(t => t.side === 'long');
    const shortTrades = closedTrades.filter(t => t.side === 'short');

    const sidePerformance: SidePerformance[] = [
      {
        side: 'long',
        totalTrades: longTrades.length,
        winRate: longTrades.length > 0 ? (longTrades.filter(t => (t.pnl || 0) > 0).length / longTrades.length) * 100 : 0,
        totalPnl: longTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
      },
      {
        side: 'short',
        totalTrades: shortTrades.length,
        winRate: shortTrades.length > 0 ? (shortTrades.filter(t => (t.pnl || 0) > 0).length / shortTrades.length) * 100 : 0,
        totalPnl: shortTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
      }
    ];

    const sessionGroups = { 'Asia': [] as Trade[], 'London': [] as Trade[], 'New York': [] as Trade[] };
    closedTrades.forEach(t => {
      const sess = getTradingSession(t.openedAt);
      sessionGroups[sess].push(t);
    });

    const sessionPerformance: SessionPerformance[] = (['Asia', 'London', 'New York'] as const).map(sess => {
      const trades = sessionGroups[sess];
      const winners = trades.filter(t => (t.pnl || 0) > 0);
      const rrs = trades.map(t => t.rr || 0).filter(r => r !== 0);
      return {
        session: sess,
        totalTrades: trades.length,
        winRate: trades.length > 0 ? (winners.length / trades.length) * 100 : 0,
        avgRR: rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0,
        profit: trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
      };
    });

    const hourGroups: Record<number, Trade[]> = {};
    for (let i = 0; i < 24; i++) hourGroups[i] = [];
    closedTrades.forEach(t => {
      const hour = new Date(t.openedAt).getHours();
      hourGroups[hour].push(t);
    });

    const timePerformance: TimePerformance[] = Object.entries(hourGroups).map(([hour, trades]) => {
      const h = parseInt(hour);
      const winners = trades.filter(t => (t.pnl || 0) > 0);
      const rrs = trades.map(t => t.rr || 0).filter(r => r !== 0);
      return {
        hour: h,
        totalTrades: trades.length,
        winRate: trades.length > 0 ? (winners.length / trades.length) * 100 : 0,
        totalPnl: trades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        avgRR: rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0
      };
    }).filter(t => t.totalTrades > 0);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayGroups: Record<number, Trade[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    closedTrades.forEach(t => {
      const day = new Date(t.openedAt).getDay();
      dayGroups[day].push(t);
    });

    const dayPerformance: DayPerformance[] = Object.entries(dayGroups).map(([dayIndex, trades]) => {
      const d = parseInt(dayIndex);
      const winners = trades.filter(t => (t.pnl || 0) > 0);
      return {
        day: dayNames[d],
        dayIndex: d,
        totalTrades: trades.length,
        winRate: trades.length > 0 ? (winners.length / trades.length) * 100 : 0,
        totalPnl: trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
      };
    });

    const monthGroups: Record<string, Trade[]> = {};
    closedTrades.forEach(t => {
      const date = new Date(t.closedAt || t.openedAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push(t);
    });

    let runningBalance = session.initialBalance;
    const monthPerformance: MonthPerformance[] = Object.entries(monthGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, trades]) => {
        const [year, month] = key.split('-').map(Number);
        const monthPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const gainPercent = (monthPnl / runningBalance) * 100;
        runningBalance += monthPnl;
        const overallGainPercent = ((runningBalance - session.initialBalance) / session.initialBalance) * 100;
        return {
          month,
          year,
          gainPercent,
          overallGainPercent,
          trades: trades.length
        };
      });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    
    const calendarData: CalendarDay[] = [];
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDay);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTrades = closedTrades.filter(t => {
        const tradeDate = new Date(t.closedAt || t.openedAt);
        return tradeDate.toISOString().split('T')[0] === dateStr;
      });

      calendarData.push({
        date: dateStr,
        day: date.getDate(),
        pnl: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        trades: dayTrades.length,
        isCurrentMonth: date.getMonth() === currentMonth
      });
    }

    const tradeDates = new Set(closedTrades.map(t => {
      return new Date(t.closedAt || t.openedAt).toISOString().split('T')[0];
    }));

    const weekSet = new Set(closedTrades.map(t => {
      const d = new Date(t.closedAt || t.openedAt);
      const year = d.getFullYear();
      const week = Math.ceil((d.getDate() + new Date(year, d.getMonth(), 1).getDay()) / 7);
      return `${year}-${d.getMonth()}-${week}`;
    }));

    const monthSet = new Set(closedTrades.map(t => {
      const d = new Date(t.closedAt || t.openedAt);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }));

    const dailyFreq: TradeFrequency[] = Array.from(tradeDates).slice(-7).map(date => ({
      period: date,
      count: closedTrades.filter(t => new Date(t.closedAt || t.openedAt).toISOString().split('T')[0] === date).length,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    }));

    const weeklyFreq: TradeFrequency[] = Array.from(weekSet).slice(-8).map((week, i) => ({
      period: week,
      count: closedTrades.filter(t => {
        const d = new Date(t.closedAt || t.openedAt);
        const year = d.getFullYear();
        const w = Math.ceil((d.getDate() + new Date(year, d.getMonth(), 1).getDay()) / 7);
        return `${year}-${d.getMonth()}-${w}` === week;
      }).length,
      label: `${i + 1}`
    }));

    const monthlyFreq: TradeFrequency[] = Array.from(monthSet).slice(-6).map(month => {
      const [year, m] = month.split('-').map(Number);
      return {
        period: month,
        count: closedTrades.filter(t => {
          const d = new Date(t.closedAt || t.openedAt);
          return d.getFullYear() === year && d.getMonth() === m;
        }).length,
        label: new Date(year, m).toLocaleDateString('en-US', { month: 'short' })
      };
    });

    return {
      equityCurve,
      totalPnl,
      accountBalance: session.currentBalance,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      totalTrades: closedTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      rrMetrics,
      winners: calcWinLossStats(winningTrades, true),
      losers: calcWinLossStats(losingTrades, false),
      sidePerformance,
      sessionPerformance,
      timePerformance,
      dayPerformance,
      monthPerformance,
      calendarData,
      tradeFrequency: {
        daily: dailyFreq,
        weekly: weeklyFreq,
        monthly: monthlyFreq,
        avgDaily: tradeDates.size > 0 ? closedTrades.length / tradeDates.size : 0,
        avgWeekly: weekSet.size > 0 ? closedTrades.length / weekSet.size : 0,
        avgMonthly: monthSet.size > 0 ? closedTrades.length / monthSet.size : 0
      }
    };
  }, [session]);
}
