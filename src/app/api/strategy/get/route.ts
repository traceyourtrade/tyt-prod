import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyProAccess } from '@/lib/subscription';

import { 
    getStrategiesHandler,
    getStrategyRulesHandler,
    getDefaultStrategyHandler
} from '../../../../lib/api-handlers/strategiesHandlers';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;
        const userId = cookieStore.get('userId')?.value;

        if (!token || !userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { hasAccess, error } = await verifyProAccess(userId);
        if (!hasAccess) {
            return NextResponse.json({ error: error || "Pro subscription required" }, { status: 403 });
        }

        const url = new URL(req.url);
        const apiName = url.searchParams.get('apiName');

        if (!apiName) {
            return NextResponse.json({ error: "API name is required" }, { status: 400 });
        }

        switch (apiName) {
            case "getStrategies":
                return await getStrategiesHandler(req, userId, token);
            
            case "getStrategyRules":
                return await getStrategyRulesHandler(req, userId, token);
            
            case "getDefaultStrategy":
                return await getDefaultStrategyHandler(req, userId, token);
            
            default:
                return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("GET route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}