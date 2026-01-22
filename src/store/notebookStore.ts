"use client"
import { create } from "zustand";

interface NotebookFile {
    filename: string;
    created: number;
    lastUpdate: number;
    content: {
        title: string;
        content: string;
        templateId?: string;
        fields?: Record<string, string>;
    };
    tradeId?: string;
    pnl?: number | null;
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
        pnl?: number;
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
                    content: "Strong bullish momentum on H4. Price broke above key resistance at 1.0850. Looking for pullback to 1.0820 support zone for long entry. Target: 1.0920. Stop loss below 1.0780.",
                    templateId: "trade-idea",
                    fields: {
                        symbol: "EUR/USD",
                        sentiment: "bullish",
                        timeframe: "H4",
                        setupType: "breakout",
                        entry: "1.0820",
                        stopLoss: "1.0780",
                        takeProfit: "1.0920",
                        riskReward: "1:2.5",
                        confidence: "4",
                        reasoning: "Strong bullish momentum on H4. Price broke above key resistance at 1.0850. Looking for pullback to 1.0820 support zone for long entry.",
                        keyLevels: "Support: 1.0800, 1.0820\nResistance: 1.0850, 1.0920",
                        notes: "Wait for London session for best entry."
                    }
                },
                tradeId: "trade_001",
                pnl: 485
            },
            {
                filename: "GBP/JPY Analysis",
                created: Date.now() - 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 12 * 60 * 60 * 1000,
                content: {
                    title: "GBP/JPY Analysis",
                    content: "Consolidation pattern forming on daily chart. Waiting for breakout confirmation before taking position. Key levels: Support 186.50, Resistance 188.20.",
                    templateId: "market-analysis",
                    fields: {
                        market: "GBP/JPY",
                        date: "Dec 5, 2024",
                        overallBias: "neutral",
                        technicalAnalysis: "Consolidation pattern forming on daily chart. Price trading between 186.50 and 188.20. RSI at 50 level, no clear direction.",
                        fundamentalAnalysis: "BOJ rate decision coming up. GBP supported by strong services PMI.",
                        keyEvents: "BOJ Meeting - Dec 7\nUK GDP - Dec 8",
                        watchlist: "GBP/JPY, EUR/JPY, USD/JPY",
                        levels: "Support: 186.50\nResistance: 188.20",
                        tradePlan: "Wait for breakout above 188.20 or breakdown below 186.50 before taking position."
                    }
                },
                tradeId: "trade_002",
                pnl: -215
            },
            {
                filename: "Weekly Review - Dec Week 1",
                created: Date.now() - 3 * 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 2 * 24 * 60 * 60 * 1000,
                content: {
                    title: "Weekly Review - Dec Week 1",
                    content: "Total trades: 8\nWin rate: 62.5%\nBest trade: EUR/USD +2.5R\nWorst trade: USD/CAD -1R",
                    templateId: "weekly-review",
                    fields: {
                        weekOf: "Dec 2-6, 2024",
                        totalTrades: "8",
                        winRate: "62.5%",
                        netPnL: "+$1,250",
                        bestTrade: "EUR/USD Long - Caught breakout above 1.0850, rode it to 1.0920 for +2.5R. Patience on entry paid off.",
                        worstTrade: "USD/CAD Short - Entered too early before confirmation, got stopped out -1R. Should have waited for break of support.",
                        rulesFollowed: "mostly",
                        lessonsLearned: "Patience on entries improved results significantly. The best trades came when I waited for confirmation rather than jumping in early.",
                        improvements: "Need to work on early exits. Left money on the table on 2 trades by closing too early.",
                        goals: "Focus on letting winners run to full target. No early exits unless technical reason."
                    }
                },
                pnl: null
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
                    content: "XAU/USD forming inverse head and shoulders on weekly.",
                    templateId: "trade-idea",
                    fields: {
                        symbol: "XAU/USD",
                        sentiment: "bullish",
                        timeframe: "W1",
                        setupType: "reversal",
                        entry: "2050",
                        stopLoss: "1990",
                        takeProfit: "2150",
                        riskReward: "1:1.67",
                        confidence: "3",
                        reasoning: "Inverse head and shoulders pattern forming on weekly. Neckline at 2050. Historical support at 2000 provides good risk:reward.",
                        keyLevels: "Neckline: 2050\nSupport: 2000, 1990\nTarget: 2150",
                        notes: "Risk 1.5% of account on this trade. May take 2-4 weeks to play out."
                    }
                }
            },
            {
                filename: "S&P 500 Short Thesis",
                created: Date.now() - 6 * 24 * 60 * 60 * 1000,
                lastUpdate: Date.now() - 5 * 24 * 60 * 60 * 1000,
                content: {
                    title: "S&P 500 Short Thesis",
                    content: "Bearish divergence on RSI at all-time highs.",
                    templateId: "trade-idea",
                    fields: {
                        symbol: "SPX500",
                        sentiment: "bearish",
                        timeframe: "D1",
                        setupType: "reversal",
                        entry: "4550",
                        stopLoss: "4620",
                        takeProfit: "4400",
                        riskReward: "1:2.1",
                        confidence: "2",
                        reasoning: "Bearish divergence on RSI at all-time highs. Distribution pattern forming. VIX showing signs of bottoming.",
                        keyLevels: "ATH: 4600\nSupport: 4550, 4500, 4400",
                        notes: "Wait for break below 4550 before entry. High risk trade - reduce position size."
                    }
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