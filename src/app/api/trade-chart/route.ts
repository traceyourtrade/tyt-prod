import { NextResponse } from 'next/server';

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

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
  // Limit cache size
  if (chartCache.size > 500) {
    const oldestKey = chartCache.keys().next().value;
    if (oldestKey) chartCache.delete(oldestKey);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const symbol = searchParams.get('symbol') || 'AAPL';
  const date = searchParams.get('date'); // Trade date in YYYY-MM-DD format
  const interval = searchParams.get('interval') || '5min';
  
  if (!date) {
    return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
  }
  
  const cacheKey = `${symbol}:${date}:${interval}`;
  const cachedData = getFromCache(cacheKey);
  
  if (cachedData) {
    console.log(`[TradeChart Cache HIT] ${cacheKey}`);
    return NextResponse.json(cachedData);
  }
  
  if (!TWELVE_DATA_API_KEY) {
    console.error('[TradeChart] API key not configured');
    return NextResponse.json({
      error: 'Twelve Data API key not configured',
    }, { status: 500 });
  }
  
  try {
    // For intraday charts, we get the whole day's data
    const tradeDate = new Date(date);
    const startDate = new Date(tradeDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(tradeDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Format dates for API
    const startStr = startDate.toISOString().split('T')[0] + ' 00:00:00';
    const endStr = endDate.toISOString().split('T')[0] + ' 23:59:59';
    
    const params = new URLSearchParams({
      symbol: symbol,
      interval: interval,
      start_date: startStr,
      end_date: endStr,
      apikey: TWELVE_DATA_API_KEY,
      format: 'JSON',
      timezone: 'America/New_York',
    });
    
    const url = `${TWELVE_DATA_BASE_URL}/time_series?${params.toString()}`;
    console.log('[TradeChart] Fetching:', url.replace(TWELVE_DATA_API_KEY, '***'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'error') {
      console.error('[TradeChart] API Error:', data.message);
      
      // If specific interval fails, try daily
      if (interval !== '1day') {
        const dailyParams = new URLSearchParams({
          symbol: symbol,
          interval: '1day',
          outputsize: '30',
          apikey: TWELVE_DATA_API_KEY,
          format: 'JSON',
          timezone: 'America/New_York',
        });
        
        const dailyUrl = `${TWELVE_DATA_BASE_URL}/time_series?${dailyParams.toString()}`;
        console.log('[TradeChart] Trying daily interval:', dailyUrl.replace(TWELVE_DATA_API_KEY, '***'));
        
        const dailyResponse = await fetch(dailyUrl);
        const dailyData = await dailyResponse.json();
        
        if (dailyData.values && Array.isArray(dailyData.values)) {
          const formattedData = dailyData.values
            .map((bar: any) => ({
              time: bar.datetime,
              open: parseFloat(bar.open),
              high: parseFloat(bar.high),
              low: parseFloat(bar.low),
              close: parseFloat(bar.close),
              volume: bar.volume ? parseFloat(bar.volume) : 0,
            }))
            .reverse();
          
          const result = { candles: formattedData, interval: '1day' };
          setCache(cacheKey, result);
          return NextResponse.json(result);
        }
      }
      
      return NextResponse.json({ error: data.message || 'Failed to fetch data' }, { status: 400 });
    }
    
    if (!data.values || !Array.isArray(data.values)) {
      console.error('[TradeChart] No data returned:', data);
      return NextResponse.json({ error: 'No data available', candles: [] }, { status: 200 });
    }
    
    const formattedData = data.values
      .map((bar: any) => ({
        time: bar.datetime,
        open: parseFloat(bar.open),
        high: parseFloat(bar.high),
        low: parseFloat(bar.low),
        close: parseFloat(bar.close),
        volume: bar.volume ? parseFloat(bar.volume) : 0,
      }))
      .reverse(); // API returns newest first, we want oldest first
    
    console.log(`[TradeChart] Returning ${formattedData.length} candles for ${symbol}`);
    
    const result = { candles: formattedData, interval };
    setCache(cacheKey, result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[TradeChart] Fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch chart data',
    }, { status: 500 });
  }
}
