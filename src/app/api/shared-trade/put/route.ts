import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateShareSettingsHandler } from '@/lib/api-handlers/sharedTradeHandlers';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const url = new URL(req.url);
    const apiName = url.searchParams.get('apiName');

    switch (apiName) {
      case "updateShareSettings":
        return await updateShareSettingsHandler(req, userId, token);
      
      default:
        return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("PUT route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
