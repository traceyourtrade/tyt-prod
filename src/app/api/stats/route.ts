import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';
import { connectAccountsDB } from '@/lib/db/connect';
import { getUserModel } from '@/models/main/user.model';
import { demoDashboardStats } from '@/lib/demo-data';

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

async function isDemoMode(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as any;
    return decoded.demoMode === true;
  } catch {
    return false;
  }
}

const DEFAULT_INITIAL_BALANCE = 100000;
const STATS_CACHE_TTL_MS = 30 * 1000;
const MAX_STATS_CACHE_ENTRIES = 2000;

interface StatsCache {
  data: any;
  timestamp: number;
}

const statsCache = new Map<string, StatsCache>();

function getCachedStats(userId: string): any | null {
  const cached = statsCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > STATS_CACHE_TTL_MS) {
    statsCache.delete(userId);
    return null;
  }
  statsCache.delete(userId);
  statsCache.set(userId, cached);
  return cached.data;
}

function setCachedStats(userId: string, data: any): void {
  if (statsCache.has(userId)) {
    statsCache.delete(userId);
  }
  statsCache.set(userId, { data, timestamp: Date.now() });
  while (statsCache.size > MAX_STATS_CACHE_ENTRIES) {
    const oldestKey = statsCache.keys().next().value;
    if (oldestKey) statsCache.delete(oldestKey);
  }
}

function parseBalance(balanceStr: string | number | undefined): number | null {
  if (typeof balanceStr === 'number') return balanceStr;
  if (typeof balanceStr === 'string') {
    const parsed = parseFloat(balanceStr.replace(/[$,]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    if (await isDemoMode()) {
      return NextResponse.json(demoDashboardStats);
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const cachedStats = getCachedStats(userId);
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    await connectAccountsDB();
    const BacktestSession = await getBacktestSessionsModel();
    
    const allSessions = await BacktestSession.find({ uniqueId: userId }).lean();
    
    const allTrades: any[] = [];
    let totalPnl = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let totalWinRateWeighted = 0;
    let sessionsWithWinRate = 0;
    let winningSessions = 0;
    let losingSessions = 0;
    let sumCurrentBalance = 0;
    let sumInitialBalance = 0;
    let sessionsWithValidBalance = 0;
    
    allSessions.forEach((session: any) => {
      const sessionPnl = Number(session.sessionInfo?.totalPnl) || 0;
      const currentBalance = parseBalance(session.sessionInfo?.currentBalance);
      
      if (currentBalance !== null) {
        sumCurrentBalance += currentBalance;
        sumInitialBalance += (currentBalance - sessionPnl);
        sessionsWithValidBalance++;
      }
      
      totalPnl += sessionPnl;
      
      if (sessionPnl > 0) {
        totalProfit += sessionPnl;
        winningSessions++;
      } else if (sessionPnl < 0) {
        totalLoss += Math.abs(sessionPnl);
        losingSessions++;
      }
      
      if (session.sessionInfo?.winRate != null) {
        totalWinRateWeighted += Number(session.sessionInfo.winRate) || 0;
        sessionsWithWinRate++;
      }
      
      if (session.trades && Array.isArray(session.trades)) {
        session.trades.forEach((trade: any, index: number) => {
          allTrades.push({
            ...trade,
            id: trade.id ?? `${session.sessionId}-${index}`,
            sessionId: session.sessionId,
            roi: typeof trade.roi === 'number' ? trade.roi : 0
          });
        });
      }
    });
    
    const totalTrades = allTrades.length;
    const winningTrades = allTrades.filter(t => t.roi > 0);
    const losingTrades = allTrades.filter(t => t.roi < 0);
    
    const winRate = sessionsWithWinRate > 0 
      ? totalWinRateWeighted / sessionsWithWinRate 
      : (totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0);
    
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const avgWinPerSession = winningSessions > 0 ? totalProfit / winningSessions : 0;
    const avgLossPerSession = losingSessions > 0 ? totalLoss / losingSessions : 0;
    
    const initialBalance = sessionsWithValidBalance > 0 
      ? sumInitialBalance
      : (allSessions.length > 0 ? 0 : DEFAULT_INITIAL_BALANCE);
    const currentBalance = sessionsWithValidBalance > 0 
      ? sumCurrentBalance
      : initialBalance + totalPnl;

    const recentTrades = allTrades
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date || 0).getTime();
        const dateB = new Date(b.timestamp || b.date || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(t => ({
        ...t,
        type: t.type || t.position || 'long',
        roi: t.roi,
        timestamp: t.timestamp || t.date || new Date().toISOString()
      }));

    const sessionsByDate: Record<string, { pnl: number; count: number }> = {};
    allSessions.forEach((session: any) => {
      const dateStr = session.sessionInfo?.startDate || session.createdAt || new Date().toISOString();
      const day = new Date(dateStr).toISOString().split('T')[0];
      const pnl = Number(session.sessionInfo?.totalPnl) || 0;
      if (!sessionsByDate[day]) {
        sessionsByDate[day] = { pnl: 0, count: 0 };
      }
      sessionsByDate[day].pnl += pnl;
      sessionsByDate[day].count++;
    });

    const equityCurve = Object.entries(sessionsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc: { date: string; balance: number }[], [date, data], i) => {
        const prevBalance = i > 0 ? acc[i - 1].balance : initialBalance;
        acc.push({ date, balance: prevBalance + data.pnl });
        return acc;
      }, []);

    const responseData = {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalPnl,
      totalProfit,
      totalLoss,
      profitFactor,
      avgWin: avgWinPerSession,
      avgLoss: avgLossPerSession,
      initialBalance,
      currentBalance,
      totalSessions: allSessions.length,
      recentTrades,
      equityCurve,
    };

    setCachedStats(userId, responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
