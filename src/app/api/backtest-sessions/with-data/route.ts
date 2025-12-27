import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';
import { getCachedBarsModel } from '@/models/backtest/cachedBars.model';

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

// Fetch data from Polygon API with pagination for large date ranges
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

  const initialUrl = `${POLYGON_API_URL}/${ticker}/range/${timespan.multiplier}/${timespan.timespan}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;

  console.log('with-data: Fetching from Polygon:', { ticker, resolution, fromDate, toDate });

  try {
    const allBars: { t: number; o: number; h: number; l: number; c: number; v: number }[] = [];
    let nextUrl: string | null = initialUrl;
    let pageCount = 0;
    
    // Fetch all available pages until no more data
    while (nextUrl) {
      pageCount++;
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error('Polygon API error:', response.status, response.statusText);
        break;
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        if (allBars.length === 0) {
          console.log('No data from Polygon:', { status: data.status, resultsCount: data.resultsCount, ticker, fromDate, toDate });
          return null;
        }
        break;
      }

      // Add bars from this page
      for (const b of data.results) {
        allBars.push({
          t: Math.floor(b.t / 1000),
          o: b.o,
          h: b.h,
          l: b.l,
          c: b.c,
          v: b.v || 0
        });
      }
      
      console.log(`with-data: Polygon page ${pageCount}: got ${data.results.length} bars, total: ${allBars.length}`);

      // Check for next page
      if (data.next_url) {
        nextUrl = `${data.next_url}&apiKey=${POLYGON_API_KEY}`;
      } else {
        nextUrl = null;
      }
    }
    
    if (allBars.length === 0) {
      return null;
    }

    console.log('with-data: Polygon total bars fetched:', allBars.length, 'for', ticker, 'in', pageCount, 'pages');

    return {
      s: 'ok',
      t: allBars.map(b => b.t),
      o: allBars.map(b => b.o),
      h: allBars.map(b => b.h),
      l: allBars.map(b => b.l),
      c: allBars.map(b => b.c),
      v: allBars.map(b => b.v)
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
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

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
    
    // Load ALL historical data from market start (10 years) up to session's toDate
    // This gives users full historical context for technical analysis
    // Replay will start from session.fromDate and play through session.toDate
    const sessionFromDate = new Date(sessionData.fromDate);
    const sessionToDate = new Date(sessionData.toDate);
    
    // Data range: 10 years ago to session's end date
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    const fromTs = Math.floor(tenYearsAgo.getTime() / 1000);
    const toTs = Math.floor(sessionToDate.getTime() / 1000);
    
    // The replay start point (where user starts playing from)
    const replayStartTs = Math.floor(sessionFromDate.getTime() / 1000);
    
    console.log('with-data: Loading historical data range:', {
      dataFrom: tenYearsAgo.toISOString(),
      dataTo: sessionData.toDate,
      replayStartFrom: sessionData.fromDate,
      fromTs,
      toTs,
      replayStartTs
    });

    let barsData: { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[]; errmsg?: string } = { s: 'no_data', t: [], o: [], h: [], l: [], c: [], v: [] };
    
    // If forceRefresh, delete existing cache for this symbol/resolution first
    if (forceRefresh) {
      try {
        const CachedBars = await getCachedBarsModel();
        await CachedBars.deleteMany({ market, symbol, resolution });
        console.log('Force refresh: Cleared cache for', { market, symbol, resolution });
      } catch (err) {
        console.error('Error clearing cache:', err);
      }
    }
    
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
          const earliestCachedTs = mergedBars[0]?.t || 0;
          const latestCachedTs = mergedBars[mergedBars.length - 1]?.t || 0;
          
          // Check if cached data covers enough history (at least 5 years back from replay start)
          // AND has enough bars to be meaningful (not sparse/gappy coverage)
          const fiveYearsBeforeReplay = replayStartTs - (5 * 365 * 24 * 60 * 60);
          const hasEarlyEnoughData = earliestCachedTs <= fiveYearsBeforeReplay;
          
          // Minimum bar counts expected for different resolutions (accounting for forex weekends)
          const minBarsForResolution: Record<string, number> = {
            '1': 100000,    // 1min: ~2 years minimum
            '5': 20000,     // 5min: ~2 years minimum  
            '15': 10000,    // 15min: ~3 years minimum
            '30': 5000,     // 30min: ~3 years minimum
            '60': 10000,    // 1H: ~5 years minimum (120 bars/week * 52 weeks * 5 years = ~31,000)
            '120': 5000,    // 2H: ~5 years minimum
            '240': 2500,    // 4H: ~5 years minimum
            'D': 1000,      // Daily: ~4 years minimum
            '1D': 1000,
            'W': 200,       // Weekly: ~4 years minimum
            '1W': 200,
          };
          const minBars = minBarsForResolution[resolution] || 5000;
          const hasEnoughBars = mergedBars.length >= minBars;
          
          // Check for large gaps in data (more than 7 days = 604800 seconds)
          // This catches cases where we have early and late data but missing months in between
          let hasLargeGaps = false;
          let largestGapDays = 0;
          const maxGapAllowed = 7 * 24 * 60 * 60; // 7 days in seconds (forex closes on weekends)
          // Scan entire dataset for gaps - sample every 10th bar for efficiency
          for (let i = 1; i < mergedBars.length; i += 10) {
            const gap = mergedBars[i].t - mergedBars[Math.max(0, i-10)].t;
            const gapDays = gap / 86400;
            if (gapDays > largestGapDays) largestGapDays = gapDays;
            if (gap > maxGapAllowed * 10) { // 70 days gap when sampling every 10th bar
              hasLargeGaps = true;
              console.log('Detected large gap in cached data:', {
                fromDate: new Date(mergedBars[Math.max(0, i-10)].t * 1000).toISOString(),
                toDate: new Date(mergedBars[i].t * 1000).toISOString(),
                gapDays: Math.round(gapDays)
              });
              break;
            }
          }
          console.log('Gap check result:', { hasLargeGaps, largestGapDays: Math.round(largestGapDays) });
          
          const cacheCoversEnoughHistory = hasEarlyEnoughData && hasEnoughBars && !hasLargeGaps;
          
          console.log('Cache HIT for with-data (merged):', { 
            market, symbol, resolution, 
            barCount: mergedBars.length,
            minBars,
            hasEnoughBars,
            fromDocs: cachedDocs.length,
            earliestCachedDate: new Date(earliestCachedTs * 1000).toISOString(),
            latestCachedDate: new Date(latestCachedTs * 1000).toISOString(),
            fiveYearsBeforeReplay: new Date(fiveYearsBeforeReplay * 1000).toISOString(),
            hasEarlyEnoughData,
            cacheCoversEnoughHistory
          });
          
          // If cache doesn't have enough historical data, don't use it - fetch fresh
          if (cacheCoversEnoughHistory) {
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
              replayStartTs: replayStartTs,
              cached: true
            }, {
              headers: {
                'Cache-Control': 'private, max-age=30'
              }
            });
          } else {
            console.log('Cache does not cover enough history - fetching from Polygon');
          }
        }
      }
    } catch (cacheError) {
      console.warn('Cache lookup failed:', cacheError);
    }
    
    console.log('Cache MISS for with-data - fetching data:', { market, symbol, resolution, fromTs, toTs });
    
    try {
      let data: { s: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[] } | null = null;
      
      // Fetch from Polygon API (FOREX only)
      if (market === 'FOREX') {
        data = await fetchFromPolygon(symbol, market, resolution, fromTs, toTs);
        
        if (!data) {
          console.log('No data returned from Polygon:', { market, symbol, resolution });
          barsData = { 
            s: 'error', 
            t: [], o: [], h: [], l: [], c: [], v: [], 
            errmsg: 'Failed to fetch FOREX data from Polygon. Please try again.' 
          };
        }
      } else {
        // Non-FOREX markets not supported
        console.log('Non-FOREX market not supported:', { market, symbol });
        barsData = { 
          s: 'error', 
          t: [], o: [], h: [], l: [], c: [], v: [], 
          errmsg: `Market type "${market}" is not currently supported. Only FOREX is available.` 
        };
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
      resolution: resolution,
      replayStartTs: replayStartTs
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
