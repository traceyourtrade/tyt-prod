import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getLeaderboardHandler,
  getUserRankHandler,
  getLeaderboardSettingsHandler 
} from '@/lib/api-handlers/leaderboardHandlers';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const apiName = url.searchParams.get('apiName');

    if (apiName === 'getLeaderboard') {
      return await getLeaderboardHandler(req);
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    switch (apiName) {
      case "getUserRank":
        return await getUserRankHandler(req, userId, token);
      
      case "getLeaderboardSettings":
        return await getLeaderboardSettingsHandler(req, userId, token);
      
      default:
        return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("GET route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
