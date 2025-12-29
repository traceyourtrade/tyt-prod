import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
import { fetchFromPolygon } from '@/lib/api-handlers/backtesting/polygonAdapter';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const chartCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getFromCache(key: string): any | null {
  const entry = chartCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    chartCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any): void {
  chartCache.set(key, { data, timestamp: Date.now() });
  if (chartCache.size > 500) {
    const oldestKey = chartCache.keys().next().value;
    if (oldestKey) chartCache.delete(oldestKey);
  }
}

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

function mapIntervalToResolution(interval: string): string {
  const intervalMap: Record<string, string> = {
    '1min': '1',
    '5min': '5',
    '15min': '15',
    '30min': '30',
    '1h': '60',
    '4h': '240',
    '1day': 'D',
    '1week': 'W',
    '1month': 'M',
  };
  return intervalMap[interval] || interval;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const symbol = searchParams.get('symbol') || '';
  const date = searchParams.get('date');
  const interval = searchParams.get('interval') || '5min';
  
  if (!symbol) {
    return NextResponse.json({ 
      error: 'Symbol parameter required',
      candles: [] 
    }, { status: 400 });
  }
  
  if (!date) {
    return NextResponse.json({ 
      error: 'Date parameter required',
      candles: [] 
    }, { status: 400 });
  }
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        candles: [] 
      }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ 
        error: 'Invalid token',
        candles: [] 
      }, { status: 401 });
    }

    const cacheKey = `${userId}:${symbol}:${date}:${interval}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      console.log(`[TradeChart Cache HIT] ${cacheKey}`);
      return NextResponse.json(cachedData);
    }

    const resolution = mapIntervalToResolution(interval);
    
    const tradeDate = new Date(date);
    const startOfDay = new Date(tradeDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tradeDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const fromTs = Math.floor(startOfDay.getTime() / 1000);
    const toTs = Math.floor(endOfDay.getTime() / 1000);

    console.log('[TradeChart] Fetching from Polygon:', {
      symbol,
      resolution,
      date,
      from: fromTs,
      to: toTs
    });

    const polygonResult = await fetchFromPolygon(symbol, 'FOREX', resolution, fromTs, toTs);

    if (!polygonResult.success || polygonResult.bars.length === 0) {
      console.log('[TradeChart] No data from Polygon:', polygonResult.error || 'empty result');
      return NextResponse.json({ 
        error: 'No data available for this symbol/date',
        candles: [],
        interval 
      });
    }

    const filteredBars = polygonResult.bars.filter(bar => {
      const barTime = Math.floor(bar.time / 1000);
      return barTime >= fromTs && barTime <= toTs;
    });

    console.log(`[TradeChart] Filtered ${polygonResult.bars.length} bars to ${filteredBars.length} for date ${date}`);
    
    if (filteredBars.length === 0) {
      return NextResponse.json({ 
        error: 'No data available for this specific date',
        candles: [],
        interval 
      });
    }

    const candles = filteredBars.map((bar) => ({
      time: new Date(bar.time).toISOString(),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume || 0,
    }));
    
    console.log(`[TradeChart] Returning ${candles.length} candles for ${symbol}`);
    
    const result = { candles, interval };
    setCache(cacheKey, result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[TradeChart] Fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch chart data',
      candles: []
    }, { status: 500 });
  }
}
