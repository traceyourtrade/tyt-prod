import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import POST handler functions
import { 
    createFolderHandler,
    createFileHandler,
    editNotebookFileHandler,
    deleteFolderHandler,
    deleteFileHandler,
    renameFolderHandler,
    renameFileHandler,
    addNotesFromDailyJournalHandler
} from '../../../../lib/api-handlers/notebookHandlers';

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

        switch (apiName) {
            case "createFolder":
                return await createFolderHandler(body, userId, token);
            
            case "createFile":
                return await createFileHandler(body, userId, token);
            
            case "editNotebookFile":
                return await editNotebookFileHandler(body, userId, token);
            
            case "deleteFolder":
                return await deleteFolderHandler(body, userId, token);
            
            case "deleteFile":
                return await deleteFileHandler(body, userId, token);
            
            case "renameFolder":
                return await renameFolderHandler(body, userId, token);
            
            case "renameFile":
                return await renameFileHandler(body, userId, token);
            
            case "addNotesFromDailyJournal":
                return await addNotesFromDailyJournalHandler(body, userId, token);
            
            default:
                return NextResponse.json({ error: "API endpoint not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("POST route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}