import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../server/db";
import { sessions, trades } from "../../../../../shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId);
    
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const sessionTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.sessionId, sessionId))
      .orderBy(desc(trades.timestamp));

    return NextResponse.json({ session, trades: sessionTrades });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId);
    const body = await request.json();

    const [updatedSession] = await db
      .update(sessions)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId))
      .returning();

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId);

    await db.delete(trades).where(eq(trades.sessionId, sessionId));
    await db.delete(sessions).where(eq(sessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
