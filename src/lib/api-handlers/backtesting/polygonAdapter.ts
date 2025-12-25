import { Bar, getPolygonTimespan, toPolygonTicker } from '@/lib/backtesting/types';

const POLYGON_API_URL = 'https://api.polygon.io/v2/aggs/ticker';
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

export interface PolygonFetchResult {
  bars: Bar[];
  source: 'polygon';
  success: boolean;
  error?: string;
}

export async function fetchFromPolygon(
  symbol: string,
  market: string,
  resolution: string,
  fromTs: number,
  toTs: number
): Promise<PolygonFetchResult> {
  if (!POLYGON_API_KEY) {
    return { bars: [], source: 'polygon', success: false, error: 'Polygon API key not configured' };
  }

  const ticker = toPolygonTicker(symbol, market);
  if (!ticker) {
    return { bars: [], source: 'polygon', success: false, error: `Symbol not supported: ${symbol} (${market})` };
  }

  const timespan = getPolygonTimespan(resolution);
  if (!timespan) {
    return { bars: [], source: 'polygon', success: false, error: `Resolution not supported: ${resolution}` };
  }

  const fromDate = new Date(fromTs * 1000).toISOString().split('T')[0];
  const toDate = new Date(toTs * 1000).toISOString().split('T')[0];

  const url = `${POLYGON_API_URL}/${ticker}/range/${timespan.multiplier}/${timespan.timespan}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;

  console.log('[PolygonAdapter] Fetching:', { ticker, resolution, fromDate, toDate });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      return { bars: [], source: 'polygon', success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('[PolygonAdapter] No data:', { status: data.status, resultsCount: data.resultsCount });
      return { bars: [], source: 'polygon', success: true };
    }

    console.log('[PolygonAdapter] Got', data.results.length, 'bars for', ticker);

    const bars: Bar[] = data.results.map((b: { t: number; o: number; h: number; l: number; c: number; v?: number }) => ({
      time: b.t,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
      volume: b.v || 0,
    }));

    return { bars, source: 'polygon', success: true };
  } catch (error) {
    console.error('[PolygonAdapter] Fetch error:', error);
    return { bars: [], source: 'polygon', success: false, error: String(error) };
  }
}

export function isPolygonSupported(market: string): boolean {
  return market === 'FOREX';
}
