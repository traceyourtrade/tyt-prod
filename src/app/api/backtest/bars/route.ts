import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
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
  
  // Remove any existing prefixes or formatting
  let clean = symbol.replace(/^(C:|FX:)/, '').replace(/[^A-Z]/gi, '').toUpperCase();
  
  // Common forex pair mappings
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

  // Convert timestamps to dates for Polygon API
  const fromDate = new Date(fromTs * 1000).toISOString().split('T')[0];
  const toDate = new Date(toTs * 1000).toISOString().split('T')[0];

  const url = `${POLYGON_API_URL}/${ticker}/range/${timespan.multiplier}/${timespan.timespan}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;

  console.log('Fetching from Polygon:', { ticker, resolution, fromDate, toDate });

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
    
    console.log('Polygon returned', data.results.length, 'bars for', ticker, 'from', fromDate, 'to', toDate);

    // Convert Polygon format to TradingView format
    // Polygon timestamps are in milliseconds, TradingView expects seconds
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
      return NextResponse.json({ s: "error", errmsg: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ s: "error", errmsg: "Invalid token" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const market = searchParams.get('market');
    const symbol = searchParams.get('symbol');
    const resolution = searchParams.get('resolution');
    const to = searchParams.get('to');
    const from = searchParams.get('from');

    if (!market || !symbol || !resolution || !to) {
      return NextResponse.json({ 
        s: "error", 
        errmsg: "Missing required parameters: market, symbol, resolution, to" 
      }, { status: 400 });
    }

    const toTs = parseInt(to, 10);
    
    // Calculate default fromTs based on resolution when not provided
    // This ensures Polygon gets a sensible date range, not 1970-01-01
    let fromTs: number;
    if (from) {
      fromTs = parseInt(from, 10);
    } else {
      // Default data windows by resolution (in seconds)
      const defaultWindows: Record<string, number> = {
        '1': 7 * 24 * 60 * 60,       // 1 week for 1-minute
        '5': 14 * 24 * 60 * 60,      // 2 weeks for 5-minute
        '15': 30 * 24 * 60 * 60,     // 1 month for 15-minute
        '30': 30 * 24 * 60 * 60,     // 1 month for 30-minute
        '60': 60 * 24 * 60 * 60,     // 2 months for 1-hour
        '120': 60 * 24 * 60 * 60,    // 2 months for 2-hour
        '240': 60 * 24 * 60 * 60,    // 2 months for 4-hour
        'D': 365 * 24 * 60 * 60,     // 1 year for daily
        '1D': 365 * 24 * 60 * 60,    // 1 year for daily
        'W': 3 * 365 * 24 * 60 * 60, // 3 years for weekly
        '1W': 3 * 365 * 24 * 60 * 60,
        'M': 5 * 365 * 24 * 60 * 60, // 5 years for monthly
        '1M': 5 * 365 * 24 * 60 * 60,
      };
      const windowSize = defaultWindows[resolution] || 30 * 24 * 60 * 60; // Default 1 month
      fromTs = toTs - windowSize;
    }

    // Check cache first for instant response - find ANY overlapping cached data
    try {
      const CachedBars = await getCachedBarsModel();
      
      // Find all cached documents that might have overlapping data
      const cachedDocs = await CachedBars.find({
        market,
        symbol,
        resolution,
        // At least some overlap: cached range overlaps with requested range
        $or: [
          // Cached range contains part of requested range
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
          
          // Check if cache covers the requested range adequately
          // Calculate expected range duration and compare with actual cached coverage
          const expectedBarsMinimum = 10;
          const firstCachedTs = mergedBars[0]?.t || toTs;
          const lastCachedTs = mergedBars[mergedBars.length - 1]?.t || fromTs;
          const requestedDuration = toTs - fromTs;
          const cachedDuration = lastCachedTs - firstCachedTs;
          
          // If cache covers less than 50% of requested range OR has very few bars, fetch from source
          // Also fetch if there's a significant gap at the start of the range
          const coverageRatio = requestedDuration > 0 ? cachedDuration / requestedDuration : 0;
          const hasGapAtStart = firstCachedTs > fromTs + 3600; // Gap of more than 1 hour at start
          const hasGapAtEnd = lastCachedTs < toTs - 3600; // Gap of more than 1 hour at end
          
          if (mergedBars.length < expectedBarsMinimum || coverageRatio < 0.5 || hasGapAtStart || hasGapAtEnd) {
            console.log('Cache partial coverage, fetching from source:', { 
              market, symbol, resolution, 
              cachedBars: mergedBars.length, 
              requestedFrom: fromTs,
              requestedTo: toTs,
              firstCachedTs,
              lastCachedTs,
              coverageRatio: coverageRatio.toFixed(2),
              hasGapAtStart,
              hasGapAtEnd
            });
            // Continue to Polygon/VPS fetch below
          } else {
            console.log('Cache HIT (merged):', { market, symbol, resolution, barCount: mergedBars.length, fromDocs: cachedDocs.length });
            
            return NextResponse.json({
              s: 'ok',
              t: mergedBars.map(b => b.t),
              o: mergedBars.map(b => b.o),
              h: mergedBars.map(b => b.h),
              l: mergedBars.map(b => b.l),
              c: mergedBars.map(b => b.c),
              v: mergedBars.map(b => b.v)
            });
          }
        }
      }
    } catch (cacheError) {
      console.warn('Cache lookup failed:', cacheError);
    }

    // Map TradingView resolution formats to VPS API expected formats
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
    apiUrl.searchParams.set('to', to);
    apiUrl.searchParams.set('userId', userId);
    if (from) {
      apiUrl.searchParams.set('from', from);
    }

    console.log('Cache MISS - fetching data:', { market, symbol, resolution, from, to });

    // Try Polygon API first (fast) for FOREX, fall back to VPS (slow)
    let data: { s: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[] } | null = null;
    
    if (market === 'FOREX') {
      data = await fetchFromPolygon(symbol, market, resolution, fromTs, toTs);
      if (data) {
        console.log('Got data from Polygon:', { barCount: data.t?.length || 0 });
      }
    }

    // Fall back to VPS if Polygon didn't return data
    if (!data) {
      console.log('Falling back to VPS:', { market, symbol, resolution });
      
      // Add timeout to VPS fetch (3 minutes - VPS can be very slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        const response = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error('VPS API error:', response.status, response.statusText);
          return NextResponse.json({ s: "no_data" });
        }

        data = await response.json();
      } catch (vpsError) {
        clearTimeout(timeoutId);
        console.error('VPS fetch error:', vpsError);
        return NextResponse.json({ s: "no_data" });
      }
    }
    
    if (!data) {
      return NextResponse.json({ s: "no_data" });
    }
    
    // Cache the response for future use
    // MongoDB has a 16MB BSON document limit - each bar ~50 bytes, so limit to ~100k bars safely
    const MAX_CACHED_BARS = 100000;
    if (data.s === 'ok' && data.t && data.o && data.h && data.l && data.c && data.t.length > 0) {
      try {
        // Limit bars to cache if dataset is too large
        const barsToCache = data.t.length > MAX_CACHED_BARS ? MAX_CACHED_BARS : data.t.length;
        
        // Sanitize volume data - VPS sometimes returns malformed data
        let safeVolume: number[] = [];
        if (data.v && Array.isArray(data.v)) {
          safeVolume = data.v
            .slice(0, barsToCache)
            .map((v: unknown) => typeof v === 'number' ? v : parseFloat(String(v)))
            .filter((v: number) => !isNaN(v) && isFinite(v));
          // If volume array doesn't match bar count, use empty array
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
        console.log('Cached bars:', { market, symbol, resolution, barCount: barsToCache, totalBars: data.t.length });
      } catch (cacheError) {
        console.warn('Failed to cache bars:', cacheError);
      }
    }
    
    // Only filter out bars AFTER the 'to' date - keep all historical data before 'to'
    // This allows users to see historical context while starting playback at their 'from' date
    if (data.s === 'ok' && data.t && data.o && data.h && data.l && data.c && Array.isArray(data.t)) {
      const toTimestamp = parseInt(to, 10);
      
      // Find indices of bars up to (and including) the 'to' date
      const filteredIndices: number[] = [];
      for (let i = 0; i < data.t.length; i++) {
        const barTime = data.t[i];
        if (barTime <= toTimestamp) {
          filteredIndices.push(i);
        }
      }
      
      // Only filter if there are bars after the 'to' date
      if (filteredIndices.length < data.t.length) {
        console.log('Filtering future bars:', {
          originalCount: data.t.length,
          filteredCount: filteredIndices.length,
          toTimestamp,
          firstBarTime: data.t[0],
          lastBarTime: data.t[data.t.length - 1]
        });
        
        // Capture arrays for safe access in map
        const tArr = data.t;
        const oArr = data.o;
        const hArr = data.h;
        const lArr = data.l;
        const cArr = data.c;
        const vArr = data.v;
        
        // Rebuild arrays with only filtered data
        data.t = filteredIndices.map(i => tArr[i]);
        data.o = filteredIndices.map(i => oArr[i]);
        data.h = filteredIndices.map(i => hArr[i]);
        data.l = filteredIndices.map(i => lArr[i]);
        data.c = filteredIndices.map(i => cArr[i]);
        if (vArr) {
          data.v = filteredIndices.map(i => vArr[i]);
        }
      }
    }
    
    // Debug log for daily/weekly/monthly resolutions
    if (['1D', 'D', '1W', 'W', '1M', 'M'].includes(resolution)) {
      console.log('Higher TF response:', {
        resolution,
        mappedResolution,
        status: data.s,
        barCount: data.t?.length || 0,
        firstBar: data.t?.[0],
        lastBar: data.t?.[data.t?.length - 1]
      });
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('Backtest bars API error:', error);
    return NextResponse.json({ s: "error", errmsg: "Failed to fetch data" }, { status: 500 });
  }
}
