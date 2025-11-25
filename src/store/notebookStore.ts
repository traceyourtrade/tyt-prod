"use client"
import { create } from "zustand";

interface NotebookFile {
    filename: string;
    created: number;
    lastUpdate: number;
    content: {
        title: string;
        content: string;
    };
    tradeId?: string;
}

interface NotebookFolder {
    folderName: string;
    folderType: string;
    createdDate: number;
    files: NotebookFile[];
}

interface NotebookStore {
    notes: NotebookFolder[];
    selectedFolder: string;
    selectedFile: string;
    loading: boolean;
    error: string | null;
    
    // Actions
    setNotes: () => Promise<void>;
    setFolder: (folderName: string) => void;
    setFile: (fileName: string) => void;
    
    // Folder Operations
    createFolder: (folderName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    renameFolder: (oldFolderName: string, newFolderName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    deleteFolder: (folderName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    
    // File Operations
    createFile: (fileName: string, folderName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    renameFile: (folderName: string, oldFileName: string, newFileName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    deleteFile: (folderName: string, fileName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    editFile: (folderName: string, fileName: string, content: { title: string; content: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
    
    // Daily Journal Integration
    addNotesFromDailyJournal: (data: {
        tradeId: string;
        symbol: string;
        time: string;
        date: string;
        accountType: string;
    }) => Promise<{ success: boolean; message?: string; error?: string; finalFileName?: string }>;
    
    // Utility
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    clearSelection: () => void;
}

const useNotebookStore = create<NotebookStore>((set, get) => ({
    notes: [],
    selectedFolder: "Daily Journal",
    selectedFile: "",
    loading: false,
    error: null,

    setLoading: (loading: boolean) => set({ loading }),
    setError: (error: string | null) => set({ error }),
    clearError: () => set({ error: null }),
    clearSelection: () => set({ selectedFolder: "Daily Journal", selectedFile: "" }),

    setNotes: async () => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/get?apiName=getNotes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch notes');
            }

            if (data.error) {
                set({ error: data.error, loading: false });
            } else {
                set({ 
                    notes: data.data || [],
                    loading: false 
                });
            }

        } catch (error) {
            console.error("Set notes error:", error);
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch notes',
                loading: false 
            });
        }
    },

    setFolder: (folderName: string) => {
        set({ selectedFolder: folderName, selectedFile: "" }); // Clear file when folder changes
    },

    setFile: (fileName: string) => set({ selectedFile: fileName }),

    // Folder Operations
    createFolder: async (folderName: string) => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apiName: 'createFolder',
                    newFolder: folderName
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create folder');
            }

            set({ loading: false });
            
            // Refresh notes after successful creation
            if (response.ok) {
                await get().setNotes();
            }

            return { success: true, message: result.message };
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to create folder',
                loading: false 
            });
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to create folder' 
            };
        }
    },

    renameFolder: async (oldFolderName: string, newFolderName: string) => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apiName: 'renameFolder',
                    folderName: oldFolderName,
                    renameFolder: newFolderName
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to rename folder');
            }

            set({ loading: false });
            
            // Refresh notes and update selection if needed
            if (response.ok) {
                await get().setNotes();
                if (get().selectedFolder === oldFolderName) {
                    set({ selectedFolder: newFolderName });
                }
            }

            return { success: true, message: result.message };
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to rename folder',
                loading: false 
            });
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to rename folder' 
            };
        }
    },

    deleteFolder: async (folderName: string) => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apiName: 'deleteFolder',
                    folderName 
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete folder');
            }

            set({ loading: false });
            
            // Refresh notes and clear selection if deleted folder was selected
            if (response.ok) {
                await get().setNotes();
                if (get().selectedFolder === folderName) {
                    set({ selectedFolder: "Daily Journal", selectedFile: "" });
                }
            }

            return { success: true, message: result.message };
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to delete folder',
                loading: false 
            });
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to delete folder' 
            };
        }
    },

    // File Operations
    createFile: async (fileName: string, folderName: string) => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apiName: 'createFile',
                    newFile: fileName,
                    folderName
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create file');
            }

            set({ loading: false });
            
            // Refresh notes after successful creation
            if (response.ok) {
                await get().setNotes();
            }

            return { success: true, message: result.message };
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to create file',
                loading: false 
            });
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to create file' 
            };
        }
    },

    renameFile: async (folderName: string, oldFileName: string, newFileName: string) => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apiName: 'renameFile',
                    folderName,
                    fileName: oldFileName,
                    renameFile: newFileName
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to rename file');
            }

            set({ loading: false });
            
            // Refresh notes and update selection if needed
            if (response.ok) {
                await get().setNotes();
                if (get().selectedFile === oldFileName && get().selectedFolder === folderName) {
                    set({ selectedFile: newFileName });
                }
            }

            return { success: true, message: result.message };
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to rename file',
                loading: false 
            });
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to rename file' 
            };
        }
    },

    deleteFile: async (folderName: string, fileName: string) => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apiName: 'deleteFile',
                    folderName,
                    fileName
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete file');
            }

            set({ loading: false });
            
            // Refresh notes and clear selection if deleted file was selected
            if (response.ok) {
                await get().setNotes();
                if (get().selectedFile === fileName && get().selectedFolder === folderName) {
                    set({ selectedFile: "" });
                }
            }

            return { success: true, message: result.message };
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to delete file',
                loading: false 
            });
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to delete file' 
            };
        }
    },

    editFile: async (folderName: string, fileName: string, content: { title: string; content: string }) => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apiName: 'editNotebookFile',
                    selectedFolder: folderName,
                    selectedFile: fileName,
                    data: content
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update file');
            }

            set({ loading: false });
            return { success: true, message: result.message };
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to update file',
                loading: false 
            });
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to update file' 
            };
        }
    },

    // Daily Journal Integration
    addNotesFromDailyJournal: async (data) => {
        try {
            set({ loading: true, error: null });
            
            const response = await fetch('/api/notebook/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    apiName: 'addNotesFromDailyJournal',
                    ...data
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to add notes from daily journal');
            }

            set({ loading: false });
            
            // Refresh notes after successful addition
            if (response.ok) {
                await get().setNotes();
            }

            return { 
                success: true, 
                message: result.message,
                finalFileName: result.data?.finalFileName 
            };
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to add notes from daily journal',
                loading: false 
            });
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to add notes from daily journal' 
            };
        }
    },
}));

export default useNotebookStore;