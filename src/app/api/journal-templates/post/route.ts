import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createTemplate, incrementUsage } from '@/lib/api-handlers/journalTemplateHandlers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();

    if (body.apiName === 'createTemplate') {
      return createTemplate(req, userId, body);
    }

    if (body.apiName === 'incrementUsage') {
      return incrementUsage(req, userId, body);
    }

    return NextResponse.json({ error: 'Invalid API name' }, { status: 400 });
  } catch (error) {
    console.error("POST journal templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
