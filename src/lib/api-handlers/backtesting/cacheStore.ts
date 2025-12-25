import { getCachedBarsModel } from '@/models/backtest/cachedBars.model';
import { Bar } from '@/lib/backtesting/types';

export interface CacheResult {
  bars: Bar[];
  coverage: {
    from: number;
    to: number;
    complete: boolean;
  };
  source: 'cache';
}

export interface CacheQuery {
  market: string;
  symbol: string;
  resolution: string;
  from: number;
  to: number;
}

export async function getFromCache(query: CacheQuery): Promise<CacheResult> {
  const { market, symbol, resolution, from, to } = query;

  try {
    const CachedBars = await getCachedBarsModel();

    const cachedDocs = await CachedBars.find({
      market,
      symbol,
      resolution,
      $or: [
        { fromTs: { $lte: to }, toTs: { $gte: from } },
      ]
    }).lean();

    if (!cachedDocs || cachedDocs.length === 0) {
      return {
        bars: [],
        coverage: { from: to, to: from, complete: false },
        source: 'cache'
      };
    }

    const allBarsMap = new Map<number, Bar>();
    let minTs = Infinity;
    let maxTs = -Infinity;

    for (const cached of cachedDocs) {
      if (!cached.t || cached.t.length === 0) continue;
      const hasValidVolume = cached.v && cached.v.length === cached.t.length;

      for (let i = 0; i < cached.t.length; i++) {
        const timestamp = cached.t[i];
        if (timestamp >= from && timestamp <= to && !allBarsMap.has(timestamp)) {
          minTs = Math.min(minTs, timestamp);
          maxTs = Math.max(maxTs, timestamp);
          allBarsMap.set(timestamp, {
            time: timestamp * 1000,
            open: cached.o[i],
            high: cached.h[i],
            low: cached.l[i],
            close: cached.c[i],
            volume: hasValidVolume ? cached.v[i] : 0
          });
        }
      }
    }

    const bars = Array.from(allBarsMap.values()).sort((a, b) => a.time - b.time);

    const requestedDuration = to - from;
    const cachedDuration = maxTs - minTs;
    const coverageRatio = requestedDuration > 0 ? cachedDuration / requestedDuration : 0;
    const hasGapAtStart = minTs > from + 3600;
    const hasGapAtEnd = maxTs < to - 3600;
    const isComplete = bars.length >= 10 && coverageRatio >= 0.5 && !hasGapAtStart && !hasGapAtEnd;

    console.log('[CacheStore] Query result:', {
      market, symbol, resolution,
      requestedFrom: from, requestedTo: to,
      barsFound: bars.length,
      cachedRange: { from: minTs, to: maxTs },
      coverageRatio: coverageRatio.toFixed(2),
      isComplete
    });

    return {
      bars,
      coverage: { from: minTs, to: maxTs, complete: isComplete },
      source: 'cache'
    };
  } catch (error) {
    console.error('[CacheStore] Query error:', error);
    return {
      bars: [],
      coverage: { from: to, to: from, complete: false },
      source: 'cache'
    };
  }
}

export async function saveToCache(
  query: CacheQuery,
  bars: Bar[]
): Promise<void> {
  if (!bars || bars.length === 0) return;

  const { market, symbol, resolution, from, to } = query;

  try {
    const CachedBars = await getCachedBarsModel();

    const timestamps = bars.map(b => Math.floor(b.time / 1000));
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);

    const cacheDoc = {
      market,
      symbol,
      resolution,
      fromTs: Math.min(from, minTs),
      toTs: Math.max(to, maxTs),
      t: timestamps,
      o: bars.map(b => b.open),
      h: bars.map(b => b.high),
      l: bars.map(b => b.low),
      c: bars.map(b => b.close),
      v: bars.map(b => b.volume),
      fetchedAt: new Date(),
    };

    await CachedBars.findOneAndUpdate(
      {
        market,
        symbol,
        resolution,
        fromTs: { $lte: minTs },
        toTs: { $gte: maxTs }
      },
      { $set: cacheDoc },
      { upsert: true, new: true }
    );

    console.log('[CacheStore] Saved:', { market, symbol, resolution, barCount: bars.length });
  } catch (error) {
    console.error('[CacheStore] Save error:', error);
  }
}

export async function mergeBarsToCache(
  query: CacheQuery,
  newBars: Bar[]
): Promise<void> {
  if (!newBars || newBars.length === 0) return;

  const { market, symbol, resolution } = query;

  try {
    const CachedBars = await getCachedBarsModel();

    const cachedDocs = await CachedBars.find({ market, symbol, resolution }).lean();

    const allBarsMap = new Map<number, Bar>();

    for (const cached of cachedDocs) {
      if (!cached.t) continue;
      const hasVolume = cached.v && cached.v.length === cached.t.length;
      for (let i = 0; i < cached.t.length; i++) {
        const ts = cached.t[i];
        if (!allBarsMap.has(ts)) {
          allBarsMap.set(ts, {
            time: ts * 1000,
            open: cached.o[i],
            high: cached.h[i],
            low: cached.l[i],
            close: cached.c[i],
            volume: hasVolume ? cached.v[i] : 0
          });
        }
      }
    }

    for (const bar of newBars) {
      const ts = Math.floor(bar.time / 1000);
      if (!allBarsMap.has(ts)) {
        allBarsMap.set(ts, bar);
      }
    }

    const mergedBars = Array.from(allBarsMap.values()).sort((a, b) => a.time - b.time);

    if (mergedBars.length === 0) return;

    const timestamps = mergedBars.map(b => Math.floor(b.time / 1000));
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);

    await CachedBars.deleteMany({ market, symbol, resolution });

    await CachedBars.create({
      market,
      symbol,
      resolution,
      fromTs: minTs,
      toTs: maxTs,
      t: timestamps,
      o: mergedBars.map(b => b.open),
      h: mergedBars.map(b => b.high),
      l: mergedBars.map(b => b.low),
      c: mergedBars.map(b => b.close),
      v: mergedBars.map(b => b.volume),
      fetchedAt: new Date(),
    });

    console.log('[CacheStore] Merged and saved:', { market, symbol, resolution, totalBars: mergedBars.length });
  } catch (error) {
    console.error('[CacheStore] Merge error:', error);
  }
}
