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
    roi: typeof trade.roi === 'number' ? trade.roi : 0
  }));

  return {
    ...session,
    trades: normalizedTrades
  };
}
