import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';
import { getCachedBarsModel } from '@/models/backtest/cachedBars.model';

const VPS_API_URL = 'http://72.61.242.6:5001';
const POLYGON_API_URL = 'https://api.polygon.io/v2/aggs/ticker';
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

// Map TradingView resolution to Polygon timespan format
function getPolygonTimespan(resolution: string): { multiplier: number; timespan: string } | null {
  const resolutionMap: Record<string, { multiplier: number; timespan: string }> = {
    '1': { multiplier: 1, timespan: 'minute' },
    '5': { multiplier: 5, timespan: 'minute' },
    '15': { multiplier: 15, timespan: 'minute' },
    '30': { multiplier: 30, timespan: 'minute' },
    '60': { multiplier: 1, timespan: 'hour' },
    '120': { multiplier: 2, timespan: 'hour' },
    '240': { multiplier: 4, timespan: 'hour' },
    'D': { multiplier: 1, timespan: 'day' },
    '1D': { multiplier: 1, timespan: 'day' },
    'W': { multiplier: 1, timespan: 'week' },
    '1W': { multiplier: 1, timespan: 'week' },
    'M': { multiplier: 1, timespan: 'month' },
    '1M': { multiplier: 1, timespan: 'month' },
  };
  return resolutionMap[resolution] || null;
}

// Convert symbol to Polygon forex ticker format (C:EURUSD)
function toPolygonTicker(symbol: string, market: string): string | null {
  if (market !== 'FOREX') return null;
  const clean = symbol.replace(/^(C:|FX:)/, '').replace(/[^A-Z]/gi, '').toUpperCase();
  if (clean.length === 6) {
    return `C:${clean}`;
  }
  return null;
}

// Fetch data from Polygon API
async function fetchFromPolygon(
  symbol: string,
  market: string,
  resolution: string,
  fromTs: number,
  toTs: number
): Promise<{ s: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[] } | null> {
  if (!POLYGON_API_KEY) {
    console.log('Polygon API key not configured');
    return null;
  }

  const ticker = toPolygonTicker(symbol, market);
  if (!ticker) {
    console.log('Symbol not supported by Polygon:', { symbol, market });
    return null;
  }

  const timespan = getPolygonTimespan(resolution);
  if (!timespan) {
    console.log('Resolution not supported by Polygon:', resolution);
    return null;
  }

  const fromDate = new Date(fromTs * 1000).toISOString().split('T')[0];
  const toDate = new Date(toTs * 1000).toISOString().split('T')[0];

  const url = `${POLYGON_API_URL}/${ticker}/range/${timespan.multiplier}/${timespan.timespan}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;

  console.log('with-data: Fetching from Polygon:', { ticker, resolution, fromDate, toDate });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Polygon API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('No data from Polygon:', { status: data.status, resultsCount: data.resultsCount, ticker, fromDate, toDate });
      return null;
    }

    console.log('with-data: Polygon returned', data.results.length, 'bars for', ticker);

    const bars = data.results;
    return {
      s: 'ok',
      t: bars.map((b: { t: number }) => Math.floor(b.t / 1000)),
      o: bars.map((b: { o: number }) => b.o),
      h: bars.map((b: { h: number }) => b.h),
      l: bars.map((b: { l: number }) => b.l),
      c: bars.map((b: { c: number }) => b.c),
      v: bars.map((b: { v?: number }) => b.v || 0)
    };
  } catch (error) {
    console.error('Polygon fetch error:', error);
    return null;
  }
}

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
        // 1 min: very small window (0.25 months = 1 week each side) - VPS is slow
        if (numericRes === 1) return 0.25;
        // 5 min: smaller window (0.5 months = 2 weeks each side)
        if (numericRes <= 5) return 0.5;
        // 15-30 min: 1 month each side
        if (numericRes <= 30) return 1;
        // Medium timeframes (60-240 min): 2 months each side
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
    
    // Check MongoDB cache first for instant response - find ANY overlapping cached data
    try {
      const CachedBars = await getCachedBarsModel();
      
      // Find all cached documents that might have overlapping data
      const cachedDocs = await CachedBars.find({
        market,
        symbol,
        resolution,
        // At least some overlap: cached range overlaps with requested range
        $or: [
          { fromTs: { $lte: toTs }, toTs: { $gte: fromTs } },
        ]
      }).lean();

      if (cachedDocs && cachedDocs.length > 0) {
        // Merge all cached bars that fall within requested range
        const allBarsMap = new Map<number, { t: number; o: number; h: number; l: number; c: number; v: number }>();
        
        for (const cached of cachedDocs) {
          if (!cached.t || cached.t.length === 0) continue;
          const hasValidVolume = cached.v && cached.v.length === cached.t.length;
          
          for (let i = 0; i < cached.t.length; i++) {
            const timestamp = cached.t[i];
            if (timestamp >= fromTs && timestamp <= toTs && !allBarsMap.has(timestamp)) {
              allBarsMap.set(timestamp, {
                t: timestamp,
                o: cached.o[i],
                h: cached.h[i],
                l: cached.l[i],
                c: cached.c[i],
                v: hasValidVolume ? cached.v[i] : 0
              });
            }
          }
        }
        
        if (allBarsMap.size > 0) {
          // Sort by timestamp
          const mergedBars = Array.from(allBarsMap.values()).sort((a, b) => a.t - b.t);
          console.log('Cache HIT for with-data (merged):', { market, symbol, resolution, barCount: mergedBars.length, fromDocs: cachedDocs.length });
          
          barsData = {
            s: 'ok',
            t: mergedBars.map(b => b.t),
            o: mergedBars.map(b => b.o),
            h: mergedBars.map(b => b.h),
            l: mergedBars.map(b => b.l),
            c: mergedBars.map(b => b.c),
            v: mergedBars.map(b => b.v)
          };

          return NextResponse.json({
            success: true,
            session: sessionData,
            bars: barsData,
            resolution: resolution,
            cached: true
          }, {
            headers: {
              'Cache-Control': 'private, max-age=30'
            }
          });
        }
      }
    } catch (cacheError) {
      console.warn('Cache lookup failed:', cacheError);
    }
    
    console.log('Cache MISS for with-data - fetching data:', { market, symbol, resolution, fromTs, toTs });
    
    try {
      let data: { s: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[] } | null = null;
      
      // Try Polygon API first for FOREX (fast)
      if (market === 'FOREX') {
        data = await fetchFromPolygon(symbol, market, resolution, fromTs, toTs);
      }
      
      // Fall back to VPS if Polygon didn't return data
      if (!data) {
        console.log('with-data: Falling back to VPS:', { market, symbol, resolution });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        
        try {
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
            data = await barsResponse.json();
          }
        } catch (vpsError) {
          clearTimeout(timeoutId);
          console.error('VPS fetch error:', vpsError);
        }
      }
    
      if (data && data.s === 'ok' && data.t && data.o && data.h && data.l && data.c && Array.isArray(data.t)) {
        const filteredIndices: number[] = [];
        for (let i = 0; i < data.t.length; i++) {
          if (data.t[i] <= toTs) {
            filteredIndices.push(i);
          }
        }
        
        // Capture arrays for safe access
        const tArr = data.t;
        const oArr = data.o;
        const hArr = data.h;
        const lArr = data.l;
        const cArr = data.c;
        const vArr = data.v;
        
        if (filteredIndices.length < tArr.length) {
          data.t = filteredIndices.map(i => tArr[i]);
          data.o = filteredIndices.map(i => oArr[i]);
          data.h = filteredIndices.map(i => hArr[i]);
          data.l = filteredIndices.map(i => lArr[i]);
          data.c = filteredIndices.map(i => cArr[i]);
          if (vArr) {
            data.v = filteredIndices.map(i => vArr[i]);
          }
        }
        
        barsData = {
          s: 'ok',
          t: data.t,
          o: data.o,
          h: data.h,
          l: data.l,
          c: data.c,
          v: data.v || []
        };
        
        // Cache the response for future use
        const MAX_CACHED_BARS = 100000;
        try {
          const barsToCache = data.t.length > MAX_CACHED_BARS ? MAX_CACHED_BARS : data.t.length;
          
          let safeVolume: number[] = [];
          if (data.v && Array.isArray(data.v)) {
            safeVolume = data.v
              .slice(0, barsToCache)
              .map((v: unknown) => typeof v === 'number' ? v : parseFloat(String(v)))
              .filter((v: number) => !isNaN(v) && isFinite(v));
            if (safeVolume.length !== barsToCache) {
              safeVolume = [];
            }
          }
          
          const CachedBars = await getCachedBarsModel();
          await CachedBars.findOneAndUpdate(
            { market, symbol, resolution, fromTs, toTs },
            {
              market,
              symbol,
              resolution,
              fromTs,
              toTs,
              t: data.t.slice(0, barsToCache),
              o: data.o.slice(0, barsToCache),
              h: data.h.slice(0, barsToCache),
              l: data.l.slice(0, barsToCache),
              c: data.c.slice(0, barsToCache),
              v: safeVolume,
              cachedAt: new Date(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            { upsert: true }
          );
          console.log('Cached bars for future use:', { market, symbol, resolution, barCount: barsToCache });
        } catch (cacheError) {
          console.warn('Failed to cache bars:', cacheError);
        }
      }
    } catch (fetchError) {
      console.error('Data fetch error:', fetchError);
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
