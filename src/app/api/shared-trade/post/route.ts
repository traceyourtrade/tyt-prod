import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  createShareLinkHandler,
  addCommentHandler 
} from '@/lib/api-handlers/sharedTradeHandlers';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const apiName = url.searchParams.get('apiName');

    if (apiName === 'addComment') {
      return await addCommentHandler(req);
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    switch (apiName) {
      case "createShareLink":
        return await createShareLinkHandler(req, userId, token);
      
      default:
        return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("POST route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
