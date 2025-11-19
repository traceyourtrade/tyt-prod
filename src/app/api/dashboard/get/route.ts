import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import all GET handler functions
import { 
  getAccountDetailsHandler,
  getUserProfileHandler,
  getTradeHistoryHandler,
  getDashboardStatsHandler
} from '../../../../lib/api-handlers/dashboardHandlers';

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

        // Switch based on apiName from query parameters
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