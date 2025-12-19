import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';

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

    // Map TradingView resolution formats to VPS API expected formats
    // TradingView uses: 1, 5, 15, 60, 1D, 1W, 1M
    // Minute resolutions pass through as-is (1, 5, 15, 60 etc.)
    // Only daily/weekly/monthly need mapping: 1D -> D, 1W -> W, 1M -> M
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

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('VPS API error:', response.status, response.statusText);
      return NextResponse.json({ s: "no_data" });
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (error) {
    console.error('Backtest bars API error:', error);
    return NextResponse.json({ s: "error", errmsg: "Failed to fetch data" }, { status: 500 });
  }
}
