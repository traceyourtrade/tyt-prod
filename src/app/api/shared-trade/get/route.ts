import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getSharedTradeHandler,
  getUserSharedTradesHandler 
} from '@/lib/api-handlers/sharedTradeHandlers';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const apiName = url.searchParams.get('apiName');

    if (apiName === 'getSharedTrade') {
      return await getSharedTradeHandler(req);
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    switch (apiName) {
      case "getUserSharedTrades":
        return await getUserSharedTradesHandler(req, userId, token);
      
      default:
        return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("GET route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
