import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import PUT handler functions
import { 
    changeSelectQualityHandler,
    uploadJournalDataHandler,
    addOtherDataHandler,
    editDropdownsHandler
} from '../../../../lib/api-handlers/dailyJournalHandlers';

export async function PUT(req: NextRequest) {
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

        // Switch based on apiName from request body
        switch (apiName) {
            case "changeSelectQuality":
                return await changeSelectQualityHandler(req, userId, token);
            
            case "uploadJournalData":
                return await uploadJournalDataHandler(req, userId, token);
            
            case "addOtherData":
                return await addOtherDataHandler(req, userId, token);
            
            case "editDropdowns":
                return await editDropdownsHandler(req, userId, token);
            
            default:
                return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("PUT route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}