import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';
import { connectAccountsDB } from '@/lib/db/connect';
import { getUserModel } from '@/models/main/user.model';

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

export async function GET(req: NextRequest) {
  try {
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

    await connectAccountsDB();
    const BacktestSession = await getBacktestSessionsModel();
    
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    
    if (sessionId) {
      const session = await BacktestSession.findOne({
        uniqueId: userId,
        sessionId: parseInt(sessionId)
      }).lean();
      
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      
      const normalizedSession = normalizeSession(session);
      return NextResponse.json({ success: true, data: normalizedSession });
    }
    
    const sessions = await BacktestSession.find({ uniqueId: userId })
      .sort({ sessionId: -1 })
      .lean();
    
    const normalizedSessions = sessions.map(normalizeSession);
    return NextResponse.json({ success: true, data: normalizedSessions });
    
  } catch (error) {
    console.error("Get backtest sessions error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

function normalizeSession(session: any) {
  const normalizedTrades = (session.trades || []).map((trade: any, index: number) => ({
    ...trade,
    id: trade.id ?? `${session.sessionId}-${index}`,
    pnl: typeof trade.pnl === 'number' ? trade.pnl : 0,
  }));

  return {
    ...session,
    trades: normalizedTrades
  };
}

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { sessionInfo, trades = [] } = body;

    if (!sessionInfo?.name) {
      return NextResponse.json({ error: "Session name is required" }, { status: 400 });
    }

    await connectAccountsDB();
    const BacktestSession = await getBacktestSessionsModel();

    const lastSession = await BacktestSession.findOne({ uniqueId: userId })
      .sort({ sessionId: -1 })
      .lean();
    
    const nextSessionId = lastSession ? (lastSession as any).sessionId + 1 : 1;

    const newSession = new BacktestSession({
      uniqueId: userId,
      sessionId: nextSessionId,
      sessionInfo: {
        name: sessionInfo.name,
        symbol: sessionInfo.symbol || "EURUSD",
        currentBalance: sessionInfo.currentBalance || "10000",
        startDate: sessionInfo.startDate || new Date().toISOString().split("T")[0],
        endDate: sessionInfo.endDate || "",
        daysRemaining: sessionInfo.daysRemaining || 0,
        totalPnl: sessionInfo.totalPnl || 0,
        winRate: sessionInfo.winRate || 0,
        riskReward: sessionInfo.riskReward || 0,
        monthGainLoss: sessionInfo.monthGainLoss || 0,
        weekGainLoss: sessionInfo.weekGainLoss || 0,
        dailyGainLoss: sessionInfo.dailyGainLoss || 0,
      },
      trades: trades,
      filters: {
        type: [],
        assets: [],
        side: [],
        tags: [],
        session: [],
        strategy: [],
        day: [],
        time: [],
        timezone: [],
        backtestingDate: [],
      },
      appliedFilters: [],
    });

    await newSession.save();

    return NextResponse.json({ 
      success: true, 
      data: {
        sessionId: nextSessionId,
        ...newSession.toObject()
      }
    });

  } catch (error) {
    console.error("Create backtest session error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}
