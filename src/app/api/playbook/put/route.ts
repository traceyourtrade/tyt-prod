import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updatePlaybookHandler } from '@/lib/api-handlers/playbookHandlers';
import { verifyProAccess } from '@/lib/subscription';

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { apiName, ...data } = body;

    if (!apiName) {
      return NextResponse.json({ error: "API name is required" }, { status: 400 });
    }

    switch (apiName) {
      case "updatePlaybook":
        return await updatePlaybookHandler(data, userId, token);
      default:
        return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
    }

  } catch (error) {
    console.error("PUT playbook route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
