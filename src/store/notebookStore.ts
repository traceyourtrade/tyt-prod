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

const demoNotebookData: NotebookFolder[] = [
    {
        folderName: "Daily Journal",
        folderType: "system",
        createdDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        files: [
            {
                filename: "EUR/USD Long Setup",
                created: Date.now() - 2 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 1 * 60 * 60 * 1000,
                content: {
                    title: "EUR/USD Long Setup",
                    content: "Strong bullish momentum on H4. Price broke above key resistance at 1.0850. Looking for pullback to 1.0820 support zone for long entry. Target: 1.0920. Stop loss below 1.0780."
                },
                tradeId: "trade_001"
            },
            {
                filename: "GBP/JPY Analysis",
                created: Date.now() - 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 12 * 60 * 60 * 1000,
                content: {
                    title: "GBP/JPY Analysis",
                    content: "Consolidation pattern forming on daily chart. Waiting for breakout confirmation before taking position. Key levels: Support 186.50, Resistance 188.20."
                },
                tradeId: "trade_002"
            },
            {
                filename: "Weekly Review - Dec Week 1",
                created: Date.now() - 3 * 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 2 * 24 * 60 * 60 * 1000,
                content: {
                    title: "Weekly Review - Dec Week 1",
                    content: "Total trades: 8\nWin rate: 62.5%\nBest trade: EUR/USD +2.5R\nWorst trade: USD/CAD -1R\n\nKey learnings:\n- Patience on entries improved results\n- Need to work on early exits"
                }
            }
        ]
    },
    {
        folderName: "Trade Ideas",
        folderType: "custom",
        createdDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
        files: [
            {
                filename: "Gold Swing Trade",
                created: Date.now() - 4 * 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 3 * 24 * 60 * 60 * 1000,
                content: {
                    title: "Gold Swing Trade",
                    content: "XAU/USD forming inverse head and shoulders on weekly. Neckline at 2050. Target 2150 if breakout confirms. Risk: 1.5% of account."
                }
            },
            {
                filename: "S&P 500 Short Thesis",
                created: Date.now() - 6 * 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 5 * 24 * 60 * 60 * 1000,
                content: {
                    title: "S&P 500 Short Thesis",
                    content: "Bearish divergence on RSI at all-time highs. Watching for distribution pattern. Will short on break below 4550 with tight stop."
                }
            }
        ]
    },
    {
        folderName: "Strategies",
        folderType: "custom",
        createdDate: Date.now() - 14 * 24 * 60 * 60 * 1000,
        files: [
            {
                filename: "London Breakout Strategy",
                created: Date.now() - 10 * 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 7 * 24 * 60 * 60 * 1000,
                content: {
                    title: "London Breakout Strategy",
                    content: "Entry Rules:\n1. Mark Asian session high/low\n2. Wait for London open (3 AM EST)\n3. Enter on break of Asian range with momentum\n4. Stop: Opposite side of range\n5. Target: 1.5x Asian range\n\nBest pairs: EUR/USD, GBP/USD, EUR/GBP"
                }
            },
            {
                filename: "Supply & Demand Zones",
                created: Date.now() - 12 * 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 8 * 24 * 60 * 60 * 1000,
                content: {
                    title: "Supply & Demand Zones",
                    content: "Zone Identification:\n- Look for strong moves away from price level\n- Fresh zones have higher probability\n- Mark the base candle before the move\n\nEntry: Limit order at zone edge\nStop: Beyond zone\nTarget: Next zone or 2R minimum"
                }
            }
        ]
    },
    {
        folderName: "Market Notes",
        folderType: "custom",
        createdDate: Date.now() - 21 * 24 * 60 * 60 * 1000,
        files: [
            {
                filename: "Fed Meeting Notes",
                created: Date.now() - 5 * 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 4 * 24 * 60 * 60 * 1000,
                content: {
                    title: "Fed Meeting Notes",
                    content: "December FOMC:\n- Rates held steady as expected\n- Dot plot suggests 3 cuts in 2024\n- Powell dovish tone\n\nImplication: USD weakness expected, bullish for risk assets"
                }
            }
        ]
    }
];

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
                console.log("Notebook: Loading demo data for UI preview");
                set({ 
                    notes: demoNotebookData,
                    loading: false,
                    error: null
                });
            } else {
                set({ 
                    notes: data.data || [],
                    loading: false 
                });
            }

        } catch (error) {
            console.log("Notebook: Loading demo data for UI preview");
            set({ 
                notes: demoNotebookData,
                loading: false,
                error: null
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