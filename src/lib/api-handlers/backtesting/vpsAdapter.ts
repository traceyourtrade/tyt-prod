import { Bar, normalizeResolution } from '@/lib/backtesting/types';

const VPS_API_URL = 'http://72.61.242.6:5001';

export interface VpsFetchResult {
  bars: Bar[];
  source: 'vps';
  success: boolean;
  error?: string;
}

export async function fetchFromVps(
  symbol: string,
  market: string,
  resolution: string,
  fromTs: number,
  toTs: number,
  userId: string,
  authToken?: string
): Promise<VpsFetchResult> {
  const mappedResolution = normalizeResolution(resolution);

  const apiUrl = new URL(`${VPS_API_URL}/api/bars`);
  apiUrl.searchParams.set('market', market);
  apiUrl.searchParams.set('symbol', symbol);
  apiUrl.searchParams.set('resolution', mappedResolution);
  apiUrl.searchParams.set('to', String(toTs));
  apiUrl.searchParams.set('from', String(fromTs));
  apiUrl.searchParams.set('userId', userId);

  console.log('[VpsAdapter] Fetching:', { symbol, market, resolution: mappedResolution, fromTs, toTs });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: controller.signal
    });

    if (!response.ok) {
      return { bars: [], source: 'vps', success: false, error: `VPS error: ${response.status}` };
    }

    const data = await response.json();

    if (data.s !== 'ok' || !data.t || data.t.length === 0) {
      console.log('[VpsAdapter] No data or error:', data.s, data.errmsg);
      return { bars: [], source: 'vps', success: data.s === 'ok' || data.s === 'no_data' };
    }

    console.log('[VpsAdapter] Got', data.t.length, 'bars');

    const bars: Bar[] = data.t.map((timestamp: number, i: number) => ({
      time: timestamp * 1000,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v?.[i] || 0,
    }));

    return { bars, source: 'vps', success: true };
  } catch (error) {
    console.error('[VpsAdapter] Fetch error:', error);
    return { bars: [], source: 'vps', success: false, error: String(error) };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isVpsSupported(market: string): boolean {
  return ['CRYPTO', 'INDIAN_INDICES', 'INDIAN_STOCK'].includes(market);
}
