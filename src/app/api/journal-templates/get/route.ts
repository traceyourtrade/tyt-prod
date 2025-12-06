import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTemplates } from '@/lib/api-handlers/journalTemplateHandlers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    return getTemplates(req, userId);
  } catch (error) {
    console.error("GET journal templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
