import { Bar, BarRequest, BarResponse, barsToTradingView, TradingViewBars } from '@/lib/backtesting/types';
import { fetchFromPolygon } from './polygonAdapter';

export interface FetchOptions {
  userId?: string;
  authToken?: string;
  skipCache?: boolean;
}

export async function fetchBars(request: BarRequest, options: FetchOptions = {}): Promise<BarResponse> {
  const { market, symbol, resolution, from, to } = request;

  console.log('[BarFetcher] Request:', { market, symbol, resolution, from, to });

  let bars: Bar[] = [];

  const polygonResult = await fetchFromPolygon(symbol, market, resolution, from, to);
  if (polygonResult.success && polygonResult.bars.length > 0) {
    bars = polygonResult.bars;
  } else {
    console.log('[BarFetcher] Polygon returned no data:', polygonResult.error || 'empty result');
  }

  const coverage = {
    from: bars.length > 0 ? Math.floor(bars[0].time / 1000) : from,
    to: bars.length > 0 ? Math.floor(bars[bars.length - 1].time / 1000) : to,
    barCount: bars.length
  };

  console.log('[BarFetcher] Response:', { source: 'polygon', barCount: bars.length, coverage });

  return { bars, coverage, source: 'polygon' };
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
