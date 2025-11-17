import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import all POST handler functions
import { 
  createAccountHandler,
  createAutoSyncAccountHandler,
  pollAutoSyncAccountHandler,
  getAccountDetailsHandler,
  editAccCheckHandler,
  checkAllHandler,
  postFileUploadHandler,
  postManualUploadHandler
} from '../../../../lib/api-handlers/dashboardHandlers';

export async function POST(req: NextRequest) {
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
            case "createAccount":
                return await createAccountHandler(req, userId, token);
            
            case "createAutoSyncAccount":
                return await createAutoSyncAccountHandler(req, userId, token);
            
            case "pollAutoSyncAccount":
                return await pollAutoSyncAccountHandler(req, userId, token);
            
            case "getAccountDetails":
                return await getAccountDetailsHandler(req, userId, token);
            
            case "editAccCheck":
                return await editAccCheckHandler(req, userId, token);
            
            case "checkAll":
                return await checkAllHandler(req, userId, token);
            
            case "postFileUpload":
                return await postFileUploadHandler(req, userId, token);
            
            case "postManualUpload":
                return await postManualUploadHandler(req, userId, token);
            
            default:
                return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("POST route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}