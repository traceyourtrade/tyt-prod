import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';
import { connectAccountsDB } from '@/lib/db/connect';
import { getUserModel } from '@/models/main/user.model';

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
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
    const { sessionId, type, entry, exit, lotSize, pnl, reason, timestamp } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await connectAccountsDB();
    const BacktestSession = await getBacktestSessionsModel();

    const trade = {
      id: Date.now(),
      type,
      entry,
      exit,
      lotSize,
      pnl,
      reason,
      timestamp
    };

    const session = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId: parseInt(sessionId) },
      { 
        $push: { trades: trade },
        $inc: { 'sessionInfo.totalPnl': pnl }
      },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const trades = session.trades || [];
    const wins = trades.filter((t: any) => t.pnl > 0).length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

    await BacktestSession.updateOne(
      { uniqueId: userId, sessionId: parseInt(sessionId) },
      { $set: { 'sessionInfo.winRate': winRate } }
    );

    return NextResponse.json({ 
      success: true, 
      trade,
      totalPnl: session.sessionInfo.totalPnl,
      winRate
    });

  } catch (error) {
    console.error("Add trade error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
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

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await connectAccountsDB();
    const BacktestSession = await getBacktestSessionsModel();

    const session = await BacktestSession.findOne({
      uniqueId: userId,
      sessionId: parseInt(sessionId)
    }).lean();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      trades: session.trades || []
    });

  } catch (error) {
    console.error("Get trades error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}
