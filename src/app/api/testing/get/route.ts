// app/api/testing/GET/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBacktestSessions, getUserFromToken } from '@/lib/api-handlers/testingHandler';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const apiName = searchParams.get('apiName');

    if (!apiName) {
      return NextResponse.json({ error: "API name is required" }, { status: 400 });
    }

    switch (apiName) {
      case "getBacktestSessions":
        return await getBacktestSessions(userId);
      
      case "getBacktestSession":
        if (!sessionId) {
          return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }
        return await getBacktestSessions(userId, parseInt(sessionId));
      
      default:
        return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
    }

  } catch (error) {
    console.error("GET route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}