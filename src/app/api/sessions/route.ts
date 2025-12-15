import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { sessions, trades } from "../../../../shared/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const allSessions = await db
      .select({
        id: sessions.id,
        name: sessions.name,
        symbol: sessions.symbol,
        timeframe: sessions.timeframe,
        fromDate: sessions.fromDate,
        toDate: sessions.toDate,
        initialBalance: sessions.initialBalance,
        finalBalance: sessions.finalBalance,
        status: sessions.status,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        tradeCount: sql<number>`(SELECT COUNT(*) FROM trades WHERE trades.session_id = sessions.id)`,
        totalPnl: sql<number>`COALESCE((SELECT SUM(pnl) FROM trades WHERE trades.session_id = sessions.id), 0)`,
      })
      .from(sessions)
      .orderBy(desc(sessions.createdAt));

    return NextResponse.json(allSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, symbol, timeframe, fromDate, toDate, initialBalance } = body;

    const [newSession] = await db
      .insert(sessions)
      .values({
        name: name || `Session ${Date.now()}`,
        symbol: symbol || "FXCM:EUR/USD",
        timeframe: timeframe || "60",
        fromDate: fromDate || "2021-04-20",
        toDate: toDate || "2021-05-20",
        initialBalance: initialBalance || 5000,
      })
      .returning();

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
