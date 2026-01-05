import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import { 
  getAccountDetailsHandler,
  getUserProfileHandler,
  getTradeHistoryHandler,
  getDashboardStatsHandler
} from '../../../../lib/api-handlers/dashboardHandlers';
import { demoAccounts, demoTrades, demoDashboardStats } from '@/lib/demo-data';

async function isDemoMode(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as any;
    return decoded.demoMode === true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;
        const userId = cookieStore.get('userId')?.value;

        if (!token || !userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const url = new URL(req.url);
        const apiName = url.searchParams.get('apiName');

        if (!apiName) {
            return NextResponse.json({ error: "API name is required" }, { status: 400 });
        }

        if (await isDemoMode()) {
            switch (apiName) {
                case "getAccountDetails":
                    return NextResponse.json(demoAccounts);
                case "getTradeHistory":
                    return NextResponse.json(demoTrades);
                case "getDashboardStats":
                    return NextResponse.json(demoDashboardStats);
            }
        }

        switch (apiName) {
            case "getAccountDetails":
                return await getAccountDetailsHandler(req, userId, token);
            
            case "getUserProfile":
                return await getUserProfileHandler(req, userId, token);
            
            case "getTradeHistory":
                return await getTradeHistoryHandler(req, userId, token);
            
            case "getDashboardStats":
                return await getDashboardStatsHandler(req, userId, token);
            
            default:
                return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("GET route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}