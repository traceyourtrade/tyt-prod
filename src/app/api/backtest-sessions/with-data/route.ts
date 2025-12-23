import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';

const VPS_API_URL = 'http://72.61.242.6:5001';

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
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const resolution = searchParams.get('resolution') || '60';

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    const session = await BacktestSession.findOne({
      sessionId: parseInt(sessionId),
      uniqueId: userId
    }).lean();

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const sessionData = {
      sessionId: session.sessionId,
      name: session.name,
      market: session.market || 'FOREX',
      symbol: session.symbol,
      fromDate: session.fromDate,
      toDate: session.toDate,
      initialBalance: session.initialBalance,
      currentBalance: session.currentBalance,
      progressPointer: session.progressPointer,
      replayTimestamp: session.replayTimestamp,
      status: session.status,
      trades: session.trades || [],
      timeInvested: session.timeInvested || 0,
      chartLayouts: session.chartLayouts || [],
      studyTemplates: session.studyTemplates || {},
      drawingTemplates: session.drawingTemplates || {},
      description: session.description || '',
      riskPerTrade: session.riskPerTrade || 1
    };

    const market = sessionData.market;
    const symbol = sessionData.symbol;
    const fromDate = sessionData.fromDate;
    const toDate = sessionData.toDate;

    const toTs = Math.floor(new Date(toDate).getTime() / 1000);
    const fromTs = Math.floor(new Date(fromDate).getTime() / 1000);

    const resolutionMap: Record<string, string> = {
      '1D': 'D',
      '1W': 'W',
      '1M': 'M',
    };
    const mappedResolution = resolutionMap[resolution] || resolution;

    const apiUrl = new URL(`${VPS_API_URL}/api/bars`);
    apiUrl.searchParams.set('market', market);
    apiUrl.searchParams.set('symbol', symbol);
    apiUrl.searchParams.set('resolution', mappedResolution);
    apiUrl.searchParams.set('to', String(toTs));
    apiUrl.searchParams.set('from', String(fromTs));
    apiUrl.searchParams.set('userId', userId);

    const barsResponse = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    let barsData = { s: 'no_data', t: [], o: [], h: [], l: [], c: [], v: [] };
    
    if (barsResponse.ok) {
      const data = await barsResponse.json();
      
      if (data.s === 'ok' && data.t && Array.isArray(data.t)) {
        const filteredIndices: number[] = [];
        for (let i = 0; i < data.t.length; i++) {
          if (data.t[i] <= toTs) {
            filteredIndices.push(i);
          }
        }
        
        if (filteredIndices.length < data.t.length) {
          data.t = filteredIndices.map(i => data.t[i]);
          data.o = filteredIndices.map(i => data.o[i]);
          data.h = filteredIndices.map(i => data.h[i]);
          data.l = filteredIndices.map(i => data.l[i]);
          data.c = filteredIndices.map(i => data.c[i]);
          if (data.v) {
            data.v = filteredIndices.map(i => data.v[i]);
          }
        }
        barsData = data;
      }
    }

    return NextResponse.json({
      success: true,
      session: sessionData,
      bars: barsData,
      resolution: resolution
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30'
      }
    });

  } catch (error) {
    console.error('Combined session+bars API error:', error);
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
  }
}
