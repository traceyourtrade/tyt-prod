import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';

const VPS_API_URL = 'http://72.61.242.6:5001';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const chartCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for historical data

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

function detectMarketType(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  
  // Crypto pairs
  if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH') || 
      upperSymbol.includes('USDT') || upperSymbol.includes('BNB') ||
      upperSymbol.includes('XRP') || upperSymbol.includes('SOL') ||
      upperSymbol.includes('ADA') || upperSymbol.includes('DOGE')) {
    return 'CRYPTO';
  }
  
  // Indian indices
  if (upperSymbol.includes('NIFTY') || upperSymbol.includes('BANKNIFTY') ||
      upperSymbol.includes('SENSEX') || upperSymbol.includes('FINNIFTY')) {
    return 'INDIAN_INDICES';
  }
  
  // Indian stocks (common suffixes)
  if (upperSymbol.endsWith('.NS') || upperSymbol.endsWith('.BO') ||
      upperSymbol.includes('RELIANCE') || upperSymbol.includes('TCS') ||
      upperSymbol.includes('INFY') || upperSymbol.includes('HDFC')) {
    return 'INDIAN_STOCK';
  }
  
  // Forex pairs (6 characters, all letters, common pairs)
  const forexPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'AUDNZD',
    'XAUUSD', 'XAGUSD', 'GOLD', 'SILVER'
  ];
  if (forexPairs.includes(upperSymbol) || 
      (upperSymbol.length === 6 && /^[A-Z]+$/.test(upperSymbol))) {
    return 'FOREX';
  }
  
  // Default to FOREX for unknown
  return 'FOREX';
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
  const market = searchParams.get('market');
  
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

    // Cache key includes userId to scope data per user
    const cacheKey = `${userId}:${symbol}:${date}:${interval}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      console.log(`[TradeChart Cache HIT] ${cacheKey}`);
      return NextResponse.json(cachedData);
    }

    const detectedMarket = market || detectMarketType(symbol);
    const resolution = mapIntervalToResolution(interval);
    
    // Calculate time range for the trade date
    const tradeDate = new Date(date);
    const startOfDay = new Date(tradeDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tradeDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const fromTs = Math.floor(startOfDay.getTime() / 1000);
    const toTs = Math.floor(endOfDay.getTime() / 1000);
    
    const apiUrl = new URL(`${VPS_API_URL}/api/bars`);
    apiUrl.searchParams.set('market', detectedMarket);
    apiUrl.searchParams.set('symbol', symbol);
    apiUrl.searchParams.set('resolution', resolution);
    apiUrl.searchParams.set('from', fromTs.toString());
    apiUrl.searchParams.set('to', toTs.toString());
    apiUrl.searchParams.set('userId', userId);

    console.log('[TradeChart] Fetching from VPS:', {
      symbol,
      market: detectedMarket,
      resolution,
      date,
      url: apiUrl.toString()
    });

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('[TradeChart] VPS API error:', response.status, response.statusText);
      return NextResponse.json({ 
        error: 'Failed to fetch chart data',
        candles: [] 
      }, { status: response.status });
    }

    const data = await response.json();
    
    if (data.s !== 'ok' || !data.t || !Array.isArray(data.t) || data.t.length === 0) {
      console.log('[TradeChart] No data from VPS:', data);
      return NextResponse.json({ 
        error: 'No data available for this symbol/date',
        candles: [],
        interval 
      });
    }
    
    // Filter candles to only include the requested date range
    // VPS API ignores 'from' parameter and returns all data since 2023
    const filteredIndices: number[] = [];
    for (let i = 0; i < data.t.length; i++) {
      const barTime = data.t[i];
      if (barTime >= fromTs && barTime <= toTs) {
        filteredIndices.push(i);
      }
    }
    
    console.log(`[TradeChart] Filtered ${data.t.length} bars to ${filteredIndices.length} for date ${date}`);
    
    if (filteredIndices.length === 0) {
      return NextResponse.json({ 
        error: 'No data available for this specific date',
        candles: [],
        interval 
      });
    }
    
    // Convert VPS array format to candles object format (only filtered data)
    const candles = filteredIndices.map((i) => ({
      time: new Date(data.t[i] * 1000).toISOString(),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v ? data.v[i] : 0,
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
