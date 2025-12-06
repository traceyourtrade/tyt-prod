import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateTemplate } from '@/lib/api-handlers/journalTemplateHandlers';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    return updateTemplate(req, userId, body);
  } catch (error) {
    console.error("PUT journal templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
