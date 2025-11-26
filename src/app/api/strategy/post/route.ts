import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import POST handler functions
import { 
    addStrategyHandler,
    uploadStrategyImageHandler
} from '../../../../lib/api-handlers/strategiesHandlers';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;
        const userId = cookieStore.get('userId')?.value;

        if (!token || !userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // For form data (file upload), handle differently
        const contentType = req.headers.get('content-type') || '';
        
        let body;
        let apiName;

        if (contentType.includes('multipart/form-data')) {
            // For file uploads, apiName is in form data
            const formData = await req.formData();
            apiName = formData.get('apiName') as string;
            
            if (apiName === 'uploadStrategyImage') {
                return await uploadStrategyImageHandler(formData, userId, token);
            }
        } else {
            // For JSON requests
            body = await req.json();
            apiName = body.apiName;
        }

        if (!apiName) {
            return NextResponse.json({ error: "API name is required" }, { status: 400 });
        }

        switch (apiName) {
            case "addStrategy":
                return await addStrategyHandler(body, userId, token);
            
            case "uploadStrategyImage":
                // Handled above for form data
                return NextResponse.json({ error: "Upload strategy image must use form-data" }, { status: 400 });
            
            default:
                return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("POST route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}