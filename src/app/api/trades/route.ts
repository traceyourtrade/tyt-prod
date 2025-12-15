import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';
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
    const { sessionId, side, size, entryPrice, sl, tp, openedAt } = body;

    if (!sessionId || !side || !entryPrice) {
      return NextResponse.json({ error: "Session ID, side, and entry price are required" }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    const trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      side,
      size: size || 0.01,
      entryPrice,
      sl,
      tp,
      openedAt: openedAt || Date.now(),
      status: 'open'
    };

    const session = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId: parseInt(sessionId) },
      { $push: { trades: trade } },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, trade });

  } catch (error) {
    console.error("Add trade error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    const { sessionId, tradeId, exitPrice, closedAt, pnl, rr, notes, tags } = body;

    if (!sessionId || !tradeId) {
      return NextResponse.json({ error: "Session ID and trade ID are required" }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    const updateFields: Record<string, any> = {};
    if (exitPrice !== undefined) updateFields['trades.$.exitPrice'] = exitPrice;
    if (closedAt !== undefined) updateFields['trades.$.closedAt'] = closedAt;
    if (pnl !== undefined) updateFields['trades.$.pnl'] = pnl;
    if (rr !== undefined) updateFields['trades.$.rr'] = rr;
    if (notes !== undefined) updateFields['trades.$.notes'] = notes;
    if (tags !== undefined) updateFields['trades.$.tags'] = tags;
    if (exitPrice !== undefined) updateFields['trades.$.status'] = 'closed';

    const session = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId: parseInt(sessionId), 'trades.id': tradeId },
      { $set: updateFields },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: "Session or trade not found" }, { status: 404 });
    }

    if (pnl !== undefined) {
      const totalPnl = session.trades
        .filter((t: any) => t.status === 'closed')
        .reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
      
      await BacktestSession.updateOne(
        { uniqueId: userId, sessionId: parseInt(sessionId) },
        { $set: { currentBalance: session.initialBalance + totalPnl } }
      );
    }

    return NextResponse.json({ success: true, session });

  } catch (error) {
    console.error("Update trade error:", error);
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

    const BacktestSession = await getBacktestSessionsModel();

    if (sessionId) {
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
    }

    const sessions = await BacktestSession.find({ uniqueId: userId }).lean();
    const allTrades = sessions.flatMap((s: any) => 
      (s.trades || []).map((t: any) => ({ ...t, sessionId: s.sessionId, symbol: s.symbol }))
    );

    return NextResponse.json({ success: true, trades: allTrades });

  } catch (error) {
    console.error("Get trades error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}
