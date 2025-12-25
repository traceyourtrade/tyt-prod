import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
import { fetchBars, getDefaultWindow } from '@/lib/api-handlers/backtesting/barFetcher';
import { barsToTradingView } from '@/lib/backtesting/types';

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
    const fromTs = from ? parseInt(from, 10) : toTs - getDefaultWindow(resolution);

    console.log('[/api/backtest/bars] Request:', { market, symbol, resolution, from: fromTs, to: toTs });

    const response = await fetchBars(
      { market, symbol, resolution, from: fromTs, to: toTs },
      { userId }
    );

    if (response.bars.length === 0) {
      return NextResponse.json({ s: "no_data" });
    }

    const toTimestamp = toTs;
    const filteredBars = response.bars.filter(bar => Math.floor(bar.time / 1000) <= toTimestamp);

    const tradingViewData = barsToTradingView(filteredBars);

    console.log('[/api/backtest/bars] Response:', { 
      source: response.source, 
      barCount: filteredBars.length,
      coverage: response.coverage
    });

    return NextResponse.json(tradingViewData, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('[/api/backtest/bars] Error:', error);
    return NextResponse.json({ s: "error", errmsg: "Failed to fetch data" }, { status: 500 });
  }
}
