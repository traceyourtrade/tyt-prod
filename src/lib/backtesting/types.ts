export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BarRange {
  from: number;
  to: number;
}

export interface BarRequest {
  market: string;
  symbol: string;
  resolution: string;
  from: number;
  to: number;
}

export interface BarResponse {
  bars: Bar[];
  coverage: {
    from: number;
    to: number;
    barCount: number;
  };
  source: 'cache' | 'polygon' | 'vps' | 'mixed';
}

export interface TradingViewBars {
  s: 'ok' | 'error' | 'no_data';
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
  errmsg?: string;
}

export const RESOLUTION_MS: Record<string, number> = {
  '1': 60 * 1000,
  '5': 5 * 60 * 1000,
  '15': 15 * 60 * 1000,
  '30': 30 * 60 * 1000,
  '60': 60 * 60 * 1000,
  '120': 2 * 60 * 60 * 1000,
  '240': 4 * 60 * 60 * 1000,
  'D': 24 * 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
  'W': 7 * 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
};

export function barsToTradingView(bars: Bar[]): TradingViewBars {
  if (!bars || bars.length === 0) {
    return { s: 'no_data' };
  }
  return {
    s: 'ok',
    t: bars.map(b => Math.floor(b.time / 1000)),
    o: bars.map(b => b.open),
    h: bars.map(b => b.high),
    l: bars.map(b => b.low),
    c: bars.map(b => b.close),
    v: bars.map(b => b.volume),
  };
}

export function tradingViewToBars(data: TradingViewBars): Bar[] {
  if (data.s !== 'ok' || !data.t || data.t.length === 0) {
    return [];
  }
  return data.t.map((timestamp, i) => ({
    time: timestamp * 1000,
    open: data.o![i],
    high: data.h![i],
    low: data.l![i],
    close: data.c![i],
    volume: data.v?.[i] || 0,
  }));
}

export function normalizeResolution(resolution: string): string {
  const map: Record<string, string> = {
    '1D': 'D',
    '1W': 'W',
    '1M': 'M',
  };
  return map[resolution] || resolution;
}

export function getPolygonTimespan(resolution: string): { multiplier: number; timespan: string } | null {
  const normalized = normalizeResolution(resolution);
  const map: Record<string, { multiplier: number; timespan: string }> = {
    '1': { multiplier: 1, timespan: 'minute' },
    '5': { multiplier: 5, timespan: 'minute' },
    '15': { multiplier: 15, timespan: 'minute' },
    '30': { multiplier: 30, timespan: 'minute' },
    '60': { multiplier: 1, timespan: 'hour' },
    '120': { multiplier: 2, timespan: 'hour' },
    '240': { multiplier: 4, timespan: 'hour' },
    'D': { multiplier: 1, timespan: 'day' },
    'W': { multiplier: 1, timespan: 'week' },
    'M': { multiplier: 1, timespan: 'month' },
  };
  return map[normalized] || null;
}

export function toPolygonTicker(symbol: string, market: string): string | null {
  if (market !== 'FOREX') return null;
  const clean = symbol.replace(/^(C:|FX:)/, '').replace(/[^A-Z]/gi, '').toUpperCase();
  if (clean.length === 6) {
    return `C:${clean}`;
  }
  return null;
}
