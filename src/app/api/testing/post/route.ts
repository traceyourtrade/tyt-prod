// app/api/testing/POST/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createBacktestSession ,
  getUserFromToken, 
  updateBacktestSession,
  updateFilters,
  updateAppliedFilters,
  addTrade,
  updateTrade,
  deleteTrade,
  updateUISettings} from '@/lib/api-handlers/testingHandler';
import { connectMainDB } from '@/lib/db/connect';

export async function POST(req: NextRequest) {
  try {
    await connectMainDB()
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value|| 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTFkZDZjYmFlMDg1YjcwOGY1MjRjZDYiLCJpYXQiOjE3NjUwMTA0NzUsImV4cCI6MTc2NTQ0MjQ3NX0.cWWBJ4OKEEZ7xU6KlrfcJnZHHFNq3ObPQ5NFu2Ap_a4';
    const userId = cookieStore.get('userId')?.value || 'eY3RUQXztcrf';

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { apiName } = body;

    if (!apiName) {
      return NextResponse.json({ error: "API name is required" }, { status: 400 });
    }

    switch (apiName) {
      case "createBacktestSession":
        return await createBacktestSession(userId, body);
      
      case "updateBacktestSession":
        return await updateBacktestSession(userId, body);
      
      case "updateFilters":
        return await updateFilters(userId, body);
      
      case "updateAppliedFilters":
        return await updateAppliedFilters(userId, body);
      
      case "addTrade":
        return await addTrade(userId, body);
      
      case "updateTrade":
        return await updateTrade(userId, body);
      
      case "deleteTrade":
        return await deleteTrade(userId, body);
      
      case "updateUISettings":
        return await updateUISettings(userId, body);
      
      default:
        return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
    }

  } catch (error) {
    console.error("POST route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}