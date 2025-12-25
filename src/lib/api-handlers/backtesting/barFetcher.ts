import { Bar, BarRequest, BarResponse, barsToTradingView, TradingViewBars } from '@/lib/backtesting/types';
import { getFromCache, mergeBarsToCache } from './cacheStore';
import { fetchFromPolygon, isPolygonSupported } from './polygonAdapter';
import { fetchFromVps, isVpsSupported } from './vpsAdapter';

export interface FetchOptions {
  userId?: string;
  skipCache?: boolean;
}

export async function fetchBars(request: BarRequest, options: FetchOptions = {}): Promise<BarResponse> {
  const { market, symbol, resolution, from, to } = request;
  const { userId = '', skipCache = false } = options;

  console.log('[BarFetcher] Request:', { market, symbol, resolution, from, to });

  if (!skipCache) {
    const cacheResult = await getFromCache({ market, symbol, resolution, from, to });

    if (cacheResult.coverage.complete) {
      console.log('[BarFetcher] Cache hit - complete coverage');
      return {
        bars: cacheResult.bars,
        coverage: {
          from: cacheResult.coverage.from,
          to: cacheResult.coverage.to,
          barCount: cacheResult.bars.length
        },
        source: 'cache'
      };
    }

    console.log('[BarFetcher] Cache incomplete, fetching from source');
  }

  let bars: Bar[] = [];
  let source: 'polygon' | 'vps' | 'mixed' = 'polygon';

  if (isPolygonSupported(market)) {
    const polygonResult = await fetchFromPolygon(symbol, market, resolution, from, to);
    if (polygonResult.success && polygonResult.bars.length > 0) {
      bars = polygonResult.bars;
      source = 'polygon';
    } else if (isVpsSupported(market)) {
      const vpsResult = await fetchFromVps(symbol, market, resolution, from, to, userId);
      if (vpsResult.success) {
        bars = vpsResult.bars;
        source = 'vps';
      }
    }
  } else if (isVpsSupported(market)) {
    const vpsResult = await fetchFromVps(symbol, market, resolution, from, to, userId);
    if (vpsResult.success) {
      bars = vpsResult.bars;
      source = 'vps';
    }
  } else {
    const polygonResult = await fetchFromPolygon(symbol, market, resolution, from, to);
    if (polygonResult.success) {
      bars = polygonResult.bars;
      source = 'polygon';
    } else {
      const vpsResult = await fetchFromVps(symbol, market, resolution, from, to, userId);
      if (vpsResult.success) {
        bars = vpsResult.bars;
        source = 'vps';
      }
    }
  }

  if (bars.length > 0) {
    await mergeBarsToCache({ market, symbol, resolution, from, to }, bars);
  }

  const coverage = {
    from: bars.length > 0 ? Math.floor(bars[0].time / 1000) : from,
    to: bars.length > 0 ? Math.floor(bars[bars.length - 1].time / 1000) : to,
    barCount: bars.length
  };

  console.log('[BarFetcher] Response:', { source, barCount: bars.length, coverage });

  return { bars, coverage, source };
}

export async function fetchBarsAsTradingView(request: BarRequest, options: FetchOptions = {}): Promise<TradingViewBars> {
  const response = await fetchBars(request, options);
  return barsToTradingView(response.bars);
}

export async function ensureRange(request: BarRequest, options: FetchOptions = {}): Promise<Bar[]> {
  const response = await fetchBars(request, options);
  return response.bars;
}

export function getDefaultWindow(resolution: string): number {
  const windows: Record<string, number> = {
    '1': 7 * 24 * 60 * 60,
    '5': 14 * 24 * 60 * 60,
    '15': 30 * 24 * 60 * 60,
    '30': 30 * 24 * 60 * 60,
    '60': 60 * 24 * 60 * 60,
    '120': 60 * 24 * 60 * 60,
    '240': 60 * 24 * 60 * 60,
    'D': 365 * 24 * 60 * 60,
    '1D': 365 * 24 * 60 * 60,
    'W': 3 * 365 * 24 * 60 * 60,
    '1W': 3 * 365 * 24 * 60 * 60,
    'M': 5 * 365 * 24 * 60 * 60,
    '1M': 5 * 365 * 24 * 60 * 60,
  };
  return windows[resolution] || 30 * 24 * 60 * 60;
}
