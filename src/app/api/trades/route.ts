import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { trades, sessions } from "../../../../shared/schema";
import { desc, sql, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = db.select().from(trades).orderBy(desc(trades.timestamp)).limit(limit);
    
    if (sessionId) {
      query = db
        .select()
        .from(trades)
        .where(eq(trades.sessionId, parseInt(sessionId)))
        .orderBy(desc(trades.timestamp))
        .limit(limit);
    }

    const allTrades = await query;
    return NextResponse.json(allTrades);
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, type, entry, exit, lotSize, pnl, reason, timestamp } = body;

    const [newTrade] = await db
      .insert(trades)
      .values({
        sessionId,
        type,
        entry,
        exit,
        lotSize,
        pnl,
        reason,
        timestamp: new Date(timestamp),
      })
      .returning();

    const sessionTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.sessionId, sessionId));
    
    const totalPnl = sessionTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));
    
    if (session) {
      await db
        .update(sessions)
        .set({ 
          finalBalance: session.initialBalance + totalPnl,
          updatedAt: new Date() 
        })
        .where(eq(sessions.id, sessionId));
    }

    return NextResponse.json(newTrade);
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 });
  }
}
