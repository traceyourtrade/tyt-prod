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
    
    // Resolution-based window sizing for faster initial loads
    // Intraday: smaller windows, Daily+: larger windows
    const getWindowMonths = (res: string): number => {
      // Handle numeric resolutions (minutes) - any resolution < 1440 is intraday
      const numericRes = parseInt(res, 10);
      if (!isNaN(numericRes) && numericRes < 1440) {
        // Very short timeframes (1-15 min): 1 month each side
        if (numericRes <= 15) return 1;
        // Medium timeframes (30-240 min): 2 months each side
        return 2;
      }
      // Daily, Weekly, Monthly: 8 months each side (16 months total)
      return 8;
    };
    
    const windowMonths = getWindowMonths(resolution);
    const sessionFromDate = new Date(sessionData.fromDate);
    
    // Calculate window start date
    const windowStartDate = new Date(sessionFromDate);
    const startOriginalDay = windowStartDate.getDate();
    windowStartDate.setMonth(windowStartDate.getMonth() - windowMonths);
    if (windowStartDate.getDate() !== startOriginalDay) {
      windowStartDate.setDate(0);
    }
    
    // Calculate window end date
    const windowEndDate = new Date(sessionFromDate);
    const endOriginalDay = windowEndDate.getDate();
    windowEndDate.setMonth(windowEndDate.getMonth() + windowMonths);
    if (windowEndDate.getDate() !== endOriginalDay) {
      windowEndDate.setDate(0);
    }
    
    const fromTs = Math.floor(windowStartDate.getTime() / 1000);
    const toTs = Math.floor(windowEndDate.getTime() / 1000);

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

    let barsData: { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[]; errmsg?: string } = { s: 'no_data', t: [], o: [], h: [], l: [], c: [], v: [] };
    
    try {
      // Add timeout to prevent hanging (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const barsResponse = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    
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
    } catch (vpsError) {
      // VPS connection failed - return session data with error message in bars
      console.error('VPS fetch error:', vpsError);
      barsData = { s: 'error', t: [], o: [], h: [], l: [], c: [], v: [], errmsg: 'Data server temporarily unavailable. Please try again.' };
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
