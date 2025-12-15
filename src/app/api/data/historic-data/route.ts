import { NextResponse } from 'next/server';

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

const CACHE_TTL_MS = 60 * 60 * 1000;
const HISTORICAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const MAX_CACHE_ENTRIES = 3000;
const dataCache = new Map<string, CacheEntry>();

function getCacheKey(symbol: string, interval: string, fromTs?: string, toTs?: string): string {
  return `${symbol}:${interval}:${fromTs || 'none'}:${toTs || 'none'}`;
}

function getFromCache(key: string): any | null {
  const entry = dataCache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    dataCache.delete(key);
    return null;
  }
  
  dataCache.delete(key);
  dataCache.set(key, entry);
  
  return entry.data;
}

function setCache(key: string, data: any, isHistorical: boolean = true): void {
  const ttl = isHistorical ? HISTORICAL_CACHE_TTL_MS : CACHE_TTL_MS;
  
  if (dataCache.has(key)) {
    dataCache.delete(key);
  }
  
  dataCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
  
  while (dataCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = dataCache.keys().next().value;
    if (oldestKey) dataCache.delete(oldestKey);
  }
}

const resolutionToInterval: Record<string, string> = {
  '1': '1min',
  '2': '2min',
  '3': '5min',
  '5': '5min',
  '10': '15min',
  '15': '15min',
  '30': '30min',
  '45': '45min',
  '60': '1h',
  '120': '2h',
  '180': '4h',
  '240': '4h',
  '360': '4h',
  '480': '8h',
  '720': '1day',
  'D': '1day',
  '1D': '1day',
  'W': '1week',
  '1W': '1week',
  'M': '1month',
  '1M': '1month',
};

function formatSymbolForTwelveData(fsym: string, tsym: string): string {
  return `${fsym}/${tsym}`;
}

function getOutputSize(fromTs?: number, toTs?: number, interval?: string): number {
  if (!fromTs || !toTs) return 500;
  
  const intervalSeconds: Record<string, number> = {
    '1min': 60,
    '2min': 120,
    '5min': 300,
    '15min': 900,
    '30min': 1800,
    '45min': 2700,
    '1h': 3600,
    '2h': 7200,
    '4h': 14400,
    '8h': 28800,
    '1day': 86400,
    '1week': 604800,
    '1month': 2592000,
  };
  
  const seconds = intervalSeconds[interval || '1h'] || 3600;
  const bars = Math.ceil((toTs - fromTs) / seconds);
  return Math.min(Math.max(bars, 100), 5000);
}

function isHistoricalRequest(toTs?: string): boolean {
  if (!toTs) return false;
  const endTime = parseInt(toTs, 10) * 1000;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return endTime < oneDayAgo;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const fsym = searchParams.get('fsym') || 'EUR';
  const tsym = searchParams.get('tsym') || 'USD';
  const toTs = searchParams.get('toTs');
  const fromTs = searchParams.get('fromTs');
  const resolution = searchParams.get('timeframe') || searchParams.get('resolution') || '60';
  
  const interval = resolutionToInterval[resolution] || '1h';
  const symbol = formatSymbolForTwelveData(fsym, tsym);
  
  const cacheKey = getCacheKey(symbol, interval, fromTs || undefined, toTs || undefined);
  const cachedData = getFromCache(cacheKey);
  
  if (cachedData) {
    console.log(`[Cache HIT] ${cacheKey}`);
    return NextResponse.json(cachedData);
  }
  
  console.log(`[Cache MISS] ${cacheKey}`);
  console.log('[Twelve Data] Request params:', { fsym, tsym, toTs, fromTs, resolution });
  
  if (!TWELVE_DATA_API_KEY) {
    console.error('[Twelve Data] API key not configured');
    return NextResponse.json({
      Response: 'Error',
      Message: 'Twelve Data API key not configured. Please add TWELVE_DATA_API_KEY to your environment.',
    }, { status: 500 });
  }
  
  const outputSize = getOutputSize(
    fromTs ? parseInt(fromTs, 10) : undefined,
    toTs ? parseInt(toTs, 10) : undefined,
    interval
  );
  
  console.log(`[Twelve Data] Fetching ${symbol} at ${interval} interval, outputSize: ${outputSize}`);
  
  try {
    const params = new URLSearchParams({
      symbol,
      interval,
      outputsize: String(outputSize),
      apikey: TWELVE_DATA_API_KEY,
      format: 'JSON',
      timezone: 'UTC',
    });
    
    if (toTs) {
      const endDate = new Date(parseInt(toTs, 10) * 1000);
      params.set('end_date', endDate.toISOString().split('.')[0].replace('T', ' '));
    }
    
    if (fromTs) {
      const startDate = new Date(parseInt(fromTs, 10) * 1000);
      params.set('start_date', startDate.toISOString().split('.')[0].replace('T', ' '));
    }
    
    const url = `${TWELVE_DATA_BASE_URL}/time_series?${params.toString()}`;
    console.log('[Twelve Data] Fetching from:', url.replace(TWELVE_DATA_API_KEY, '***'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'error') {
      console.error('[Twelve Data] API Error:', data.message);
      return NextResponse.json({
        Response: 'Error',
        Message: data.message || 'Failed to fetch data from Twelve Data',
      }, { status: 400 });
    }
    
    if (!data.values || !Array.isArray(data.values)) {
      console.error('[Twelve Data] No data returned:', data);
      return NextResponse.json({
        Response: 'Error',
        Message: 'No data available for the requested symbol and timeframe',
      }, { status: 404 });
    }
    
    const formattedData = data.values
      .map((bar: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }) => {
        const isoDatetime = bar.datetime.replace(' ', 'T') + 'Z';
        return {
          time: Math.floor(new Date(isoDatetime).getTime() / 1000),
          open: parseFloat(bar.open),
          high: parseFloat(bar.high),
          low: parseFloat(bar.low),
          close: parseFloat(bar.close),
          volume: bar.volume ? parseFloat(bar.volume) : 1,
        };
      })
      .sort((a: { time: number }, b: { time: number }) => a.time - b.time);
    
    console.log(`[Twelve Data] Returning ${formattedData.length} bars for ${symbol}`);
    
    if (formattedData.length > 0) {
      const first = formattedData[0];
      const last = formattedData[formattedData.length - 1];
      console.log(`[Twelve Data] Date range: ${new Date(first.time * 1000).toISOString()} to ${new Date(last.time * 1000).toISOString()}`);
      console.log(`[Twelve Data] Sample bar:`, first);
    }
    
    const responseData = {
      Response: 'Success',
      Type: 100,
      Data: formattedData,
    };
    
    const isHistorical = isHistoricalRequest(toTs || undefined);
    setCache(cacheKey, responseData, isHistorical);
    console.log(`[Cache SET] ${cacheKey} (TTL: ${isHistorical ? '24h' : '1h'})`);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Twelve Data] Fetch error:', errorMessage);
    return NextResponse.json({
      Response: 'Error',
      Message: 'Failed to fetch historical data',
      Error: errorMessage,
    }, { status: 500 });
  }
}
