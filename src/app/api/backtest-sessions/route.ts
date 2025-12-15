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
      
      return NextResponse.json({ success: true, data: session });
    }
    
    const sessions = await BacktestSession.find({ uniqueId: userId })
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, data: sessions });
    
  } catch (error) {
    console.error("Get backtest sessions error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
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
    const { name, symbol, fromDate, toDate, initialBalance, description, riskPerTrade } = body;

    if (!name || !symbol || !fromDate || !toDate) {
      return NextResponse.json({ error: "Name, symbol, and date range are required" }, { status: 400 });
    }

    await connectAccountsDB();
    const BacktestSession = await getBacktestSessionsModel();

    const lastSession = await BacktestSession.findOne({ uniqueId: userId })
      .sort({ sessionId: -1 })
      .lean();
    
    const nextSessionId = lastSession ? (lastSession as any).sessionId + 1 : 1;

    const fromDateTimestamp = new Date(fromDate).getTime();

    const newSession = new BacktestSession({
      uniqueId: userId,
      sessionId: nextSessionId,
      name,
      symbol,
      fromDate,
      toDate,
      initialBalance: initialBalance || 10000,
      currentBalance: initialBalance || 10000,
      progressPointer: fromDateTimestamp,
      status: 'active',
      description: description || '',
      riskPerTrade: riskPerTrade || 1,
      trades: [],
      timeInvested: 0
    });

    await newSession.save();

    return NextResponse.json({ 
      success: true, 
      data: newSession.toObject()
    });

  } catch (error) {
    console.error("Create backtest session error:", error);
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
    const { sessionId, ...updates } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await connectAccountsDB();
    const BacktestSession = await getBacktestSessionsModel();

    const session = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId: parseInt(sessionId) },
      { $set: updates },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: session });

  } catch (error) {
    console.error("Update backtest session error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    const result = await BacktestSession.deleteOne({
      uniqueId: userId,
      sessionId: parseInt(sessionId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete backtest session error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}
