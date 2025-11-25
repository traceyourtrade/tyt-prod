import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import DELETE handler functions
import { 
    deleteImageHandler,
    deleteOtherDataHandler
} from '../../../../lib/api-handlers/dailyJournalHandlers';

export async function DELETE(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;
        const userId = cookieStore.get('userId')?.value;

        if (!token || !userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();
        const { apiName } = body;

        if (!apiName) {
            return NextResponse.json({ error: "API name is required" }, { status: 400 });
        }

        switch (apiName) {
            case "deleteImage":
                return await deleteImageHandler(body, userId, token);
            
            case "deleteOtherData":
                return await deleteOtherDataHandler(body, userId, token);
            
            default:
                return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("DELETE route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}