import { NextRequest, NextResponse } from 'next/server';

// Import models

import { getUserModel } from '@/models/main/user.model';
import { getAutoSyncModel } from '@/models/accounts/autoSync.model';
import { getFileUploadModel } from '@/models/accounts/fileUploadSchema.model';
import { getManualModel } from '@/models/accounts/manual.model';

import { getNoteModel } from "@/models/main/notes.model";

// Helper function to get user from token
async function getUserFromToken(token: string) {
    const User = await getUserModel();
    return await User.findOne({ "tokens.token": token });
}

// Helper function to get trade model
function getTradeModel(accountType: string) {
    switch (accountType) {
        case 'File Upload':
            return getFileUploadModel();
        case 'Manual':
            return getManualModel();
        case 'Auto Sync':
        case 'Broker Sync':
            return getAutoSyncModel();
        default:
            throw new Error("Invalid account type");
    }
}

// GET NOTES
export async function getNotesHandler(req: any, userId: string, token: string) {
    try {
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: "Enter all the details" }, { status: 400 });
        }

        const Notes = await getNoteModel();
        const isNote = await Notes.findOne({ uniqueId: userId });
        
        if (!isNote) {
            return NextResponse.json({ error: "User doesnt have notes" }, { status: 404 });
        }

        return NextResponse.json({ data: isNote.notes });

    } catch (error) {
        console.error("Get notes error:", error);
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 });
    }
}

// CREATE FOLDER
export async function createFolderHandler(req: any, userId: string, token: string) {
    try {
        const { newFolder } = req;
        console.log("Creating folder:", newFolder);

        if (!newFolder || newFolder.trim() === "") {
            return NextResponse.json({
                error: "Folder name cannot be empty",
                success: false
            }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const Notes = await getNoteModel();
        
        // Check if folder already exists
        const existingNotes = await Notes.findOne({
            uniqueId: rootUser.uniqueId,
            "notes.folderName": newFolder
        });

        if (existingNotes) {
            return NextResponse.json({
                error: "Folder already exists",
                success: false
            }, { status: 400 });
        }

        // Check maximum folder limit (50)
        const userNotes = await Notes.findOne({ uniqueId: rootUser.uniqueId });
        if (userNotes && userNotes.notes.length >= 50) {
            return NextResponse.json({
                error: "Maximum folder limit reached (50 folders)",
                success: false
            }, { status: 400 });
        }

        // Add new folder using $push
        const result = await Notes.findOneAndUpdate(
            { uniqueId: rootUser.uniqueId },
            {
                $push: {
                    notes: {
                        folderName: newFolder,
                        folderType: "created",
                        createdDate: Date.now(),
                        files: []
                    }
                }
            },
            { new: true }
        );

        if (!result) {
            // If user has no notes document yet, create one
            const newNotes = new Notes({
                uniqueId: rootUser.uniqueId,
                email: rootUser.email,
                notes: [{
                    folderName: newFolder,
                    folderType: "created",
                    createdDate: Date.now(),
                    files: []
                }]
            });

            await newNotes.save();
            return NextResponse.json({
                success: true,
                message: "New notes document created with folder"
            });
        }

        return NextResponse.json({
            success: true,
            message: "Folder added successfully",
            updatedNotes: result
        });

    } catch (error) {
        console.error("Create folder error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// CREATE FILE
export async function createFileHandler(req: any, userId: string, token: string) {
    try {
        const { newFile, folderName } = req;

        if (!newFile || newFile.trim() === "") {
            return NextResponse.json({
                error: "File name cannot be empty",
                success: false
            }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const Notes = await getNoteModel();
        
        // Finding notes
        const userNotes = await Notes.findOne({ uniqueId: rootUser.uniqueId });
        if (!userNotes) {
            return NextResponse.json({
                error: "No notes found for this user",
                success: false
            }, { status: 404 });
        }

        // Find the specific folder
        const folder = userNotes.notes.find((note: any) => note.folderName === folderName);
        if (!folder) {
            return NextResponse.json({
                error: "Folder not found",
                success: false
            }, { status: 404 });
        }

        // Check for duplicate file name
        const fileExists = folder.files.some((file: any) => file.filename === newFile);

        if (fileExists) {
            return NextResponse.json({
                error: "File with this name already exists in the folder",
                success: false
            }, { status: 400 });
        }

        if (folder.files.length >= 50) {
            return NextResponse.json({
                error: "Maximum file limit reached (50 files per folder)",
                success: false
            }, { status: 400 });
        }

        // Create new file structure
        const newFileObj = {
            filename: newFile.trim(),
            created: Date.now(),
            lastUpdate: Date.now(),
            content: {
                title: newFile.trim(),
                content: ""
            }
        };

        // Update the folder with new file
        const result = await Notes.findOneAndUpdate(
            {
                uniqueId: rootUser.uniqueId,
                "notes.folderName": folderName
            },
            {
                $push: {
                    "notes.$.files": newFileObj
                }
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: "File added successfully",
            updatedNotes: result
        });

    } catch (error) {
        console.error("Create file error:", error);
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 });
    }
}

// EDIT NOTEBOOK FILE
export async function editNotebookFileHandler(req: any, userId: string, token: string) {
    try {
        const { selectedFolder, selectedFile, data } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const Notes = await getNoteModel();
        const result = await Notes.findOneAndUpdate(
            {
                uniqueId: rootUser.uniqueId,
                "notes.folderName": selectedFolder
            },
            {
                $set: {
                    "notes.$[folder].files.$[file].content.title": data.title,
                    "notes.$[folder].files.$[file].content.content": data.content,
                    "notes.$[folder].files.$[file].lastUpdate": Date.now()
                }
            },
            {
                arrayFilters: [
                    { "folder.folderName": selectedFolder },
                    { "file.filename": selectedFile }
                ],
                new: true
            }
        );

        if (!result) {
            return NextResponse.json({ error: "Folder or file not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Notebook updated successfully",
        });

    } catch (error) {
        console.error("Edit notebook file error:", error);
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 });
    }
}

// DELETE FOLDER
export async function deleteFolderHandler(req: any, userId: string, token: string) {
    try {
        const { folderName } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser || !folderName) {
            return NextResponse.json({ error: "Enter All details" }, { status: 400 });
        }

        const trimmedFolderName = folderName.trim();

        if (trimmedFolderName === "Daily Journal") {
            return NextResponse.json({
                success: false,
                message: "Can't delete daily journal"
            }, { status: 400 });
        }

        const Notes = await getNoteModel();
        const result = await Notes.findOneAndUpdate(
            {
                uniqueId: rootUser.uniqueId,
                "notes.folderName": { $regex: new RegExp(`^${trimmedFolderName}$`, 'i') }
            },
            {
                $pull: {
                    notes: {
                        folderName: { $regex: new RegExp(`^${trimmedFolderName}$`, 'i') }
                    }
                }
            },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Folder Deleted successfully",
        });

    } catch (error) {
        console.error("Delete folder error:", error);
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 });
    }
}

// DELETE FILE
export async function deleteFileHandler(req: any, userId: string, token: string) {
    try {
        const { folderName, fileName } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser || !folderName || !fileName) {
            return NextResponse.json({ error: "Enter All details" }, { status: 400 });
        }

        const trimmedFolderName = folderName.trim();
        const trimmedFileName = fileName.trim();

        const Notes = await getNoteModel();
        const result = await Notes.findOneAndUpdate(
            {
                uniqueId: rootUser.uniqueId,
                "notes.folderName": { $regex: new RegExp(`^${trimmedFolderName}$`, 'i') },
                "notes.files.filename": { $regex: new RegExp(`^${trimmedFileName}$`, 'i') }
            },
            {
                $pull: {
                    "notes.$.files": {
                        filename: { $regex: new RegExp(`^${trimmedFileName}$`, 'i') }
                    }
                }
            },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({
                error: "File or folder not found",
                success: false
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "File deleted successfully",
        });

    } catch (error) {
        console.error("Delete file error:", error);
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 });
    }
}

// RENAME FOLDER
export async function renameFolderHandler(req: any, userId: string, token: string) {
    try {
        const { folderName, renameFolder } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser || !folderName || !renameFolder) {
            return NextResponse.json({ error: "Enter All details" }, { status: 400 });
        }

        const trimmedFolderName = folderName.trim();
        const trimmedNewName = renameFolder.trim();

        const Notes = await getNoteModel();
        const nameExists = await Notes.findOne({
            uniqueId: rootUser.uniqueId,
            "notes.folderName": { $regex: new RegExp(`^${trimmedNewName}$`, 'i') }
        });

        if (nameExists) {
            return NextResponse.json({
                error: "Folder with this name already exists",
                success: false
            }, { status: 400 });
        }

        const result = await Notes.findOneAndUpdate(
            {
                uniqueId: rootUser.uniqueId,
                "notes.folderName": { $regex: new RegExp(`^${trimmedFolderName}$`, 'i') }
            },
            {
                $set: {
                    "notes.$.folderName": trimmedNewName,
                    "notes.$.lastUpdate": Date.now()
                }
            },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({
                error: "Folder not found",
                success: false
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Folder renamed successfully",
        });

    } catch (error) {
        console.error("Rename folder error:", error);
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 });
    }
}

// RENAME FILE
export async function renameFileHandler(req: any, userId: string, token: string) {
    try {
        const { folderName, fileName, renameFile } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
        }

        const trimmedFolderName = folderName?.trim();
        const trimmedFileName = fileName?.trim();
        const trimmedNewName = renameFile?.trim();

        if (!trimmedFolderName || !trimmedFileName || !trimmedNewName) {
            return NextResponse.json({
                error: "Folder name, current filename and new filename are all required",
                success: false
            }, { status: 400 });
        }

        const Notes = await getNoteModel();
        const nameExists = await Notes.findOne({
            uniqueId: rootUser.uniqueId,
            "notes.folderName": { $regex: new RegExp(`^${trimmedFolderName}$`, 'i') },
            "notes.files.filename": { $regex: new RegExp(`^${trimmedNewName}$`, 'i') }
        });

        if (nameExists) {
            return NextResponse.json({
                error: "File with this name already exists in the folder",
                success: false
            }, { status: 400 });
        }

        const result = await Notes.findOneAndUpdate(
            {
                uniqueId: rootUser.uniqueId,
                "notes.folderName": { $regex: new RegExp(`^${trimmedFolderName}$`, 'i') },
                "notes.files.filename": { $regex: new RegExp(`^${trimmedFileName}$`, 'i') }
            },
            {
                $set: {
                    "notes.$[folder].files.$[file].filename": trimmedNewName,
                    "notes.$[folder].files.$[file].lastUpdate": Date.now()
                }
            },
            {
                arrayFilters: [
                    { "folder.folderName": { $regex: new RegExp(`^${trimmedFolderName}$`, 'i') } },
                    { "file.filename": { $regex: new RegExp(`^${trimmedFileName}$`, 'i') } }
                ],
                new: true
            }
        );

        if (!result) {
            return NextResponse.json({
                error: "File or folder not found",
                success: false
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "File renamed successfully",
        });

    } catch (error) {
        console.error("Rename file error:", error);
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 });
    }
}

// ADD NOTES FROM DAILY JOURNAL
export async function addNotesFromDailyJournalHandler(req: any, userId: string, token: string) {
    try {
        const { tradeId, symbol, time, date, accountType } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
        }

        const Notes = await getNoteModel();
        const isNote = await Notes.findOne({ uniqueId: userId });

        if (!isNote) {
            return NextResponse.json({ error: "User notes not found" }, { status: 404 });
        }

        // Find the Daily Journal folder
        const dailyJournalFolder = isNote.notes.find(
            (note: any) => note.folderName === "Daily Journal"
        );

        if (!dailyJournalFolder) {
            return NextResponse.json({ error: "Daily Journal folder not found" }, { status: 404 });
        }

        // Check if a file with this tradeId already exists
        const existingFileByTradeId = dailyJournalFolder.files.find(
            (file: any) => file.tradeId === tradeId
        );

        if (existingFileByTradeId) {
            return NextResponse.json({
                error: "A file with this tradeId already exists in Daily Journal",
                success: false
            }, { status: 409 });
        }

        // Generate base filename
        const baseFileName = `${symbol} ${date} ${time.slice(0, -3)}`;

        // Check for existing files with similar names and generate unique filename
        const existingFiles = dailyJournalFolder.files.filter((file: any) =>
            file.filename.startsWith(baseFileName)
        );

        let finalFileName = baseFileName;

        if (existingFiles.length > 0) {
            // Find the highest number in parentheses
            const numbers = existingFiles.map((file: any) => {
                const match = file.filename.match(/\((\d+)\)$/);
                return match ? parseInt(match[1]) : 0;
            });
            const maxNumber = Math.max(...numbers, 0);
            finalFileName = `${baseFileName} (${maxNumber + 1})`;
        }

        // Parse the date and time to create timestamp
        const dateObj = new Date(date);
        const [hours, minutes, seconds] = time.split(':').map(Number);
        dateObj.setHours(hours, minutes, seconds);
        const timestamp = dateObj.getTime();

        // Create new file object
        const newFile = {
            filename: finalFileName,
            created: timestamp,
            lastUpdate: timestamp,
            tradeId,
            content: {
                title: finalFileName,
                content: ''
            }
        };

        // Update notes with new file
        const updatedNote = await Notes.findOneAndUpdate(
            {
                uniqueId: userId,
                "notes._id": dailyJournalFolder._id
            },
            {
                $push: {
                    "notes.$.files": {
                        $each: [newFile],
                        $sort: { created: -1 }
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        // Get the correct trade model and update noteName
        const TradeModel = await getTradeModel(accountType);
        const updatedTradeDoc = await TradeModel.findOneAndUpdate(
            {
                uniqueId: rootUser.uniqueId,
                "tradeData.id": tradeId
            },
            {
                $set: {
                    "tradeData.$.noteName": finalFileName
                }
            },
            {
                new: true
            }
        );

        return NextResponse.json({
            success: true,
            message: "File added successfully and trade updated with noteName",
            data: {
                note: updatedNote,
                user: updatedTradeDoc,
                finalFileName
            }
        });

    } catch (error) {
        console.error("Add notes from daily journal error:", error);
        return NextResponse.json({
            error: "Internal server error",
            success: false
        }, { status: 500 });
    }
}