import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
import { getCachedBarsModel } from '@/models/backtest/cachedBars.model';

const VPS_API_URL = 'http://72.61.242.6:5001';

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ s: "error", errmsg: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ s: "error", errmsg: "Invalid token" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const market = searchParams.get('market');
    const symbol = searchParams.get('symbol');
    const resolution = searchParams.get('resolution');
    const to = searchParams.get('to');
    const from = searchParams.get('from');

    if (!market || !symbol || !resolution || !to) {
      return NextResponse.json({ 
        s: "error", 
        errmsg: "Missing required parameters: market, symbol, resolution, to" 
      }, { status: 400 });
    }

    const toTs = parseInt(to, 10);
    const fromTs = from ? parseInt(from, 10) : 0;

    // Check cache first for instant response
    try {
      const CachedBars = await getCachedBarsModel();
      const cached = await CachedBars.findOne({
        market,
        symbol,
        resolution,
        fromTs: { $lte: fromTs },
        toTs: { $gte: toTs }
      }).lean();

      if (cached && cached.t && cached.t.length > 0) {
        console.log('Cache HIT:', { market, symbol, resolution, barCount: cached.t.length });
        
        // Filter to requested range
        const filteredIndices: number[] = [];
        for (let i = 0; i < cached.t.length; i++) {
          if (cached.t[i] >= fromTs && cached.t[i] <= toTs) {
            filteredIndices.push(i);
          }
        }
        
        return NextResponse.json({
          s: 'ok',
          t: filteredIndices.map(i => cached.t[i]),
          o: filteredIndices.map(i => cached.o[i]),
          h: filteredIndices.map(i => cached.h[i]),
          l: filteredIndices.map(i => cached.l[i]),
          c: filteredIndices.map(i => cached.c[i]),
          v: filteredIndices.map(i => cached.v[i])
        });
      }
    } catch (cacheError) {
      console.warn('Cache lookup failed:', cacheError);
    }

    // Map TradingView resolution formats to VPS API expected formats
    const resolutionMap: Record<string, string> = {
      '1D': 'D',
      '1W': 'W', 
      '1M': 'M',
    };
    const mappedResolution = resolutionMap[resolution] || resolution;

    const apiUrl = new URL(`${VPS_API_URL}/api/bars`);
    apiUrl.searchParams.set('market', market);
    apiUrl.searchParams.set('symbol', symbol);
    apiUrl.searchParams.set('resolution', mappedResolution);
    apiUrl.searchParams.set('to', to);
    apiUrl.searchParams.set('userId', userId);
    if (from) {
      apiUrl.searchParams.set('from', from);
    }

    console.log('Cache MISS - fetching from VPS:', { market, symbol, resolution, from, to });

    // Add timeout to VPS fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('VPS API error:', response.status, response.statusText);
      return NextResponse.json({ s: "no_data" });
    }

    const data = await response.json();
    
    // Cache the response for future use (async, don't wait)
    if (data.s === 'ok' && data.t && data.t.length > 0) {
      try {
        const CachedBars = await getCachedBarsModel();
        await CachedBars.findOneAndUpdate(
          { market, symbol, resolution, fromTs, toTs },
          {
            market,
            symbol,
            resolution,
            fromTs,
            toTs,
            t: data.t,
            o: data.o,
            h: data.h,
            l: data.l,
            c: data.c,
            v: data.v || [],
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          { upsert: true }
        );
        console.log('Cached bars:', { market, symbol, resolution, barCount: data.t.length });
      } catch (cacheError) {
        console.warn('Failed to cache bars:', cacheError);
      }
    }
    
    // Only filter out bars AFTER the 'to' date - keep all historical data before 'to'
    // This allows users to see historical context while starting playback at their 'from' date
    if (data.s === 'ok' && data.t && Array.isArray(data.t)) {
      const toTs = parseInt(to, 10);
      
      // Find indices of bars up to (and including) the 'to' date
      const filteredIndices: number[] = [];
      for (let i = 0; i < data.t.length; i++) {
        const barTime = data.t[i];
        if (barTime <= toTs) {
          filteredIndices.push(i);
        }
      }
      
      // Only filter if there are bars after the 'to' date
      if (filteredIndices.length < data.t.length) {
        console.log('Filtering future bars:', {
          originalCount: data.t.length,
          filteredCount: filteredIndices.length,
          toTs,
          firstBarTime: data.t[0],
          lastBarTime: data.t[data.t.length - 1]
        });
        
        // Rebuild arrays with only filtered data
        data.t = filteredIndices.map(i => data.t[i]);
        data.o = filteredIndices.map(i => data.o[i]);
        data.h = filteredIndices.map(i => data.h[i]);
        data.l = filteredIndices.map(i => data.l[i]);
        data.c = filteredIndices.map(i => data.c[i]);
        if (data.v) {
          data.v = filteredIndices.map(i => data.v[i]);
        }
      }
    }
    
    // Debug log for daily/weekly/monthly resolutions
    if (['1D', 'D', '1W', 'W', '1M', 'M'].includes(resolution)) {
      console.log('Higher TF response:', {
        resolution,
        mappedResolution,
        status: data.s,
        barCount: data.t?.length || 0,
        firstBar: data.t?.[0],
        lastBar: data.t?.[data.t?.length - 1]
      });
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('Backtest bars API error:', error);
    return NextResponse.json({ s: "error", errmsg: "Failed to fetch data" }, { status: 500 });
  }
}
