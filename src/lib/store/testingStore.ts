// lib/store/testingStore.ts
import { create } from "zustand";

const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const res = await fetch(`/api/testing/${options.method?.toLowerCase()}/${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) throw new Error("API failed");

    return await res.json();
  } catch (err) {
    console.warn("API Error (non-api version fallback active):", err);
    return { success: false };
  }
};

interface FilterState {
  type: string[];
  assets: string[];
  side: string[];
  tags: string[];
  session: string[];
  strategy: string[];
  day: string[];
  time: string[];
  timezone: string[];
  backtestingDate: string[];
}

interface AppliedFilter {
  type: string;
  value: string;
}

interface Session {
  id: number;
  name: string;
  symbol: string;
  currentBalance: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  totalPnl: number;
  winRate: number;
  riskReward: number;
  monthGainLoss: number;
  weekGainLoss: number;
  dailyGainLoss: number;
}

interface Trade {
  id: number;
  name: string;
  date: string;
  symbol: string;
  position: string;
  roi: number;
  entryPrice: number;
  stopPrice: number;
  maxRR: number;
  status: string;
}

interface TestingState {
  filters: FilterState;
  appliedFilters: AppliedFilter[];
  sessions: Session[];
  trades: Trade[];
  activeSession: string;
  currentSessionId: number | null;
  isLoading: boolean;
  error: string | null;

  activeTab: string;
  rowsPerPage: number;
  currentPage: number;

  // Filter actions
  setFilters: (filters: Partial<FilterState>) => Promise<void>;
  setAppliedFilters: (filters: AppliedFilter[]) => Promise<void>;
  addAppliedFilter: (filter: AppliedFilter) => Promise<void>;
  removeAppliedFilter: (index: number) => Promise<void>;
  clearAllFilters: () => Promise<void>;

  // Session actions
  loadUserSessions: () => Promise<void>;
  loadSessionData: (sessionId: number) => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  updateSession: (id: number, updates: Partial<Session>) => Promise<void>;

  // Trades
  addTrade: (trade: Trade) => Promise<void>;

  // UI
  setActiveTab: (tab: string) => Promise<void>;
  setRowsPerPage: (rows: number) => Promise<void>;
  setCurrentPage: (page: number) => Promise<void>;
}

export const useTestingStore = create<TestingState>((set, get) => ({
  filters: {
    type: [],
    assets: [],
    side: [],
    tags: [],
    session: [],
    strategy: [],
    day: [],
    time: [],
    timezone: [],
    backtestingDate: [],
  },

  appliedFilters: [],

  sessions: [],
  trades: [],

  activeSession: "",
  currentSessionId: null,
  isLoading: false,
  error: null,
  activeTab: "Dashboard",
  rowsPerPage: 10,
  currentPage: 1,

  /*
  ───────────────────────────────────────────────
  FILTER ACTIONS (API FIRST → FALLBACK)
  ───────────────────────────────────────────────
  */

  setFilters: async (newFilters) => {
    const updated = { ...get().filters, ...newFilters };

    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateFilters",
        filters: updated,
      }),
    });

    set({ filters: updated });
  },

  setAppliedFilters: async (filters) => {
    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateAppliedFilters",
        appliedFilters: filters,
      }),
    });

    set({ appliedFilters: filters });
  },
  loadUserSessions: async () => {
  try {
    set({ isLoading: true, error: null });
    
    const response = await apiCall('?apiName=getBacktestSessions', {
      method: 'GET'
    });

    if (response.success) {
      // Transform the data to match your frontend interface
      const sessions = response.data.map((dbSession: any) => ({
        id: dbSession.sessionId,
        name: dbSession.sessionInfo.name,
        symbol: dbSession.sessionInfo.symbol,
        currentBalance: dbSession.sessionInfo.currentBalance,
        startDate: dbSession.sessionInfo.startDate,
        endDate: dbSession.sessionInfo.endDate,
        daysRemaining: dbSession.sessionInfo.daysRemaining,
        totalPnl: dbSession.sessionInfo.totalPnl,
        winRate: dbSession.sessionInfo.winRate,
        riskReward: dbSession.sessionInfo.riskReward,
        monthGainLoss: dbSession.sessionInfo.monthGainLoss,
        weekGainLoss: dbSession.sessionInfo.weekGainLoss,
        dailyGainLoss: dbSession.sessionInfo.dailyGainLoss
      }));

      set({ 
        sessions,
        isLoading: false 
      });
    }
  } catch (error: any) {
    set({ 
      error: error.message,
      isLoading: false 
    });
  }
},

// Also add this to load a specific session
loadSessionData: async (sessionId: number) => {
  try {
    set({ isLoading: true, error: null });
    
    const response = await apiCall(`/testing/get/?apiName=getBacktestSessions&sessionId=${sessionId}`, {
      method: 'GET'
    });

    if (response.success) {
      const session = response.data;
      set({
        currentSessionId: sessionId,
        filters: session.filters || get().filters,
        appliedFilters: session.appliedFilters || [],
        trades: session.trades || [],
        activeTab: session.activeTab || 'Dashboard',
        rowsPerPage: session.rowsPerPage || 10,
        currentPage: session.currentPage || 1,
        activeSession: session.sessionInfo?.name || '',
        isLoading: false
      });
    }
  } catch (error: any) {
    set({ 
      error: error.message,
      isLoading: false 
    });
  }
},
  addAppliedFilter: async (filter) => {
    const updated = [...get().appliedFilters, filter];

    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateAppliedFilters",
        appliedFilters: updated,
      }),
    });

    set({ appliedFilters: updated });
  },

  removeAppliedFilter: async (index) => {
    const updated = [...get().appliedFilters];
    updated.splice(index, 1);

    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateAppliedFilters",
        appliedFilters: updated,
      }),
    });

    set({ appliedFilters: updated });
  },

  clearAllFilters: async () => {
    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateAppliedFilters",
        appliedFilters: [],
      }),
    });

    set({ appliedFilters: [] });
  },

  /*
  ───────────────────────────────────────────────
  SESSION ACTIONS (API FIRST → FALLBACK)
  ───────────────────────────────────────────────
  */

  addSession: async (session) => {
    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "createBacktestSession",
        sessionInfo: session,
      }),
    });

    set({ sessions: [...get().sessions, session] });
  },

  updateSession: async (id, updates) => {
    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateBacktestSession",
        sessionId: id,
        sessionInfo: updates,
      }),
    });

    set({
      sessions: get().sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    });
  },

  /*
  ───────────────────────────────────────────────
  TRADES
  ───────────────────────────────────────────────
  */

  addTrade: async (trade) => {
    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "addTrade",
        trade,
      }),
    });

    set({ trades: [...get().trades, trade] });
  },

  /*
  ───────────────────────────────────────────────
  UI ACTIONS (ALSO SYNCED TO API)
  ───────────────────────────────────────────────
  */

  setActiveTab: async (tab) => {
    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateUISettings",
        activeTab: tab,
      }),
    });

    set({ activeTab: tab });
  },

  setRowsPerPage: async (rows) => {
    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateUISettings",
        rowsPerPage: rows,
      }),
    });

    set({ rowsPerPage: rows });
  },

  setCurrentPage: async (page) => {
    await apiCall("", {
      method: "POST",
      body: JSON.stringify({
        apiName: "updateUISettings",
        currentPage: page,
      }),
    });

    set({ currentPage: page });
  },
}));
