import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';

const POLYGON_API_URL = 'https://api.polygon.io/v2/aggs/ticker';
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

interface CacheEntry {
  data: { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] };
  timestamp: number;
}

const barsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 4 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 50;

function getCachedBars(key: string): CacheEntry['data'] | null {
  const entry = barsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    barsCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedBars(key: string, data: CacheEntry['data']): void {
  if (barsCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = barsCache.keys().next().value;
    if (oldestKey) barsCache.delete(oldestKey);
  }
  barsCache.set(key, { data, timestamp: Date.now() });
}

interface AnomalyInfo {
  timestamp: number;
  reason: string;
  spread: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

function detectAndFilterAnomalies(
  t: number[], o: number[], h: number[], l: number[], c: number[], v: number[],
  symbol: string
): { 
  filtered: { t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] };
  anomalies: AnomalyInfo[];
} {
  const anomalies: AnomalyInfo[] = [];
  const validIndices: number[] = [];
  
  const maxSpreadThresholds: Record<string, number> = {
    'XAUUSD': 300,
    'XAGUSD': 5,
    'DEFAULT': 0.10
  };
  
  const threshold = maxSpreadThresholds[symbol] || maxSpreadThresholds['DEFAULT'];
  const usePercentage = !maxSpreadThresholds[symbol];
  
  for (let i = 0; i < t.length; i++) {
    const spread = h[i] - l[i];
    const priceLevel = (h[i] + l[i]) / 2;
    const spreadPercent = (spread / priceLevel) * 100;
    
    const isAnomaly = usePercentage 
      ? spreadPercent > 10 
      : spread > threshold;
    
    if (isAnomaly) {
      anomalies.push({
        timestamp: t[i],
        reason: `Extreme spread: $${spread.toFixed(2)} (${spreadPercent.toFixed(1)}%)`,
        spread,
        open: o[i],
        high: h[i],
        low: l[i],
        close: c[i]
      });
    } else {
      validIndices.push(i);
    }
  }
  
  return {
    filtered: {
      t: validIndices.map(i => t[i]),
      o: validIndices.map(i => o[i]),
      h: validIndices.map(i => h[i]),
      l: validIndices.map(i => l[i]),
      c: validIndices.map(i => c[i]),
      v: validIndices.map(i => v[i] || 0)
    },
    anomalies
  };
}

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

function toPolygonTicker(symbol: string, market: string): string | null {
  if (market !== 'FOREX') return null;
  const clean = symbol.replace(/^(C:|FX:)/, '').replace(/[^A-Z]/gi, '').toUpperCase();
  if (clean.length === 6) {
    return `C:${clean}`;
  }
  return null;
}

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
    
    while (nextUrl) {
      pageCount++;
      const fetchResponse = await fetch(nextUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (!fetchResponse.ok) {
        console.error('Polygon API error:', fetchResponse.status, fetchResponse.statusText);
        break;
      }

      const jsonData: { status: string; results?: Array<{ t: number; o: number; h: number; l: number; c: number; v?: number }>; resultsCount?: number; next_url?: string } = await fetchResponse.json();

      if (jsonData.status !== 'OK' || !jsonData.results || jsonData.results.length === 0) {
        if (allBars.length === 0) {
          console.log('No data from Polygon:', { status: jsonData.status, resultsCount: jsonData.resultsCount, ticker, fromDate, toDate });
          return null;
        }
        break;
      }

      for (const b of jsonData.results) {
        allBars.push({
          t: Math.floor(b.t / 1000),
          o: b.o,
          h: b.h,
          l: b.l,
          c: b.c,
          v: b.v || 0
        });
      }
      
      console.log(`with-data: Polygon page ${pageCount}: got ${jsonData.results.length} bars, total: ${allBars.length}`);

      if (jsonData.next_url) {
        nextUrl = `${jsonData.next_url}&apiKey=${POLYGON_API_KEY}`;
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

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    const session = await (BacktestSession as any).findOne({
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
    
    const sessionFromDate = new Date(sessionData.fromDate);
    const sessionToDate = new Date(sessionData.toDate);
    
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    const fromTs = Math.floor(tenYearsAgo.getTime() / 1000);
    const toTs = Math.floor(sessionToDate.getTime() / 1000);
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
    
    const cacheKey = `${market}:${symbol}:${resolution}:${fromTs}:${toTs}`;
    const cachedData = getCachedBars(cacheKey);
    
    if (cachedData) {
      console.log('with-data: Cache HIT for', { market, symbol, resolution });
      const { filtered: cleanedData, anomalies } = detectAndFilterAnomalies(
        cachedData.t, cachedData.o, cachedData.h, cachedData.l, cachedData.c, cachedData.v, symbol
      );
      barsData = { s: 'ok', ...cleanedData };
      
      return NextResponse.json({
        success: true,
        session: sessionData,
        bars: barsData,
        resolution: resolution,
        replayStartTs: replayStartTs,
        cached: true
      }, {
        headers: { 'Cache-Control': 'private, max-age=30' }
      });
    }
    
    try {
      let data: { s: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[] } | null = null;
      
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
        
        const { filtered: cleanedData, anomalies } = detectAndFilterAnomalies(
          data.t, data.o, data.h, data.l, data.c, data.v || [], symbol
        );
        
        if (anomalies.length > 0) {
          console.log('Filtered anomalies from fresh Polygon data:', {
            symbol,
            anomalyCount: anomalies.length,
            originalBars: data.t.length,
            filteredBars: cleanedData.t.length
          });
        }
        
        barsData = {
          s: 'ok',
          ...cleanedData
        };
        
        setCachedBars(cacheKey, {
          s: 'ok',
          t: data.t,
          o: data.o,
          h: data.h,
          l: data.l,
          c: data.c,
          v: data.v || []
        });
        console.log('with-data: Cached bars for', { market, symbol, resolution, barCount: data.t.length });
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
