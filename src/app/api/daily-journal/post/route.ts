import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import all POST handler functions
import { 
    uploadImageHandler,
    deleteImageHandler,
    changeSelectQualityHandler,
    uploadJournalDataHandler,
    addOtherDataHandler,
    deleteOtherDataHandler,
    editDropdownsHandler
} from '../../../../lib/api-handlers/dailyJournalHandlers';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;
        const userId = cookieStore.get('userId')?.value;

        if (!token || !userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // For form data (file upload), we need to handle differently
        const contentType = req.headers.get('content-type') || '';
        
        let body;
        let apiName;

        if (contentType.includes('multipart/form-data')) {
            // For file uploads, apiName is in form data
            const formData = await req.formData();
            apiName = formData.get('apiName') as string;
            
            if (apiName === 'uploadImage') {
                return await uploadImageHandler(formData, userId, token);
            }
        } else {
            // For JSON requests
            body = await req.json();
            apiName = body.apiName;
        }

        if (!apiName) {
            return NextResponse.json({ error: "API name is required" }, { status: 400 });
        }

        // Switch based on apiName from request body
        switch (apiName) {
            case "uploadImage":
                // Handled above for form data
                return NextResponse.json({ error: "Upload image must use form-data" }, { status: 400 });
            
            case "deleteImage":
                return await deleteImageHandler(body, userId, token);
            
            case "changeSelectQuality":
                return await changeSelectQualityHandler(body, userId, token);
            
            case "uploadJournalData":
                return await uploadJournalDataHandler(body, userId, token);
            
            case "addOtherData":
                return await addOtherDataHandler(body, userId, token);
            
            case "deleteOtherData":
                return await deleteOtherDataHandler(body, userId, token);
            
            case "editDropdowns":
                return await editDropdownsHandler(body, userId, token);
            
            default:
                return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("POST route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}