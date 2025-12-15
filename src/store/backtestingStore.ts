// lib/store/testingStore.ts
import { create } from "zustand";

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
    set({ filters: updated });
  },

  setAppliedFilters: async (filters) => {
    set({ appliedFilters: filters });
  },
  loadUserSessions: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const res = await fetch('/api/backtest-sessions', {
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        set({ isLoading: false });
        return;
      }

      const response = await res.json();

      if (response.success && response.data) {
        const sessions = response.data.map((dbSession: any) => ({
          id: dbSession.sessionId,
          name: dbSession.sessionInfo?.name || 'Unnamed',
          symbol: dbSession.sessionInfo?.symbol || 'N/A',
          currentBalance: dbSession.sessionInfo?.currentBalance || '$0',
          startDate: dbSession.sessionInfo?.startDate || '',
          endDate: dbSession.sessionInfo?.endDate || '',
          daysRemaining: dbSession.sessionInfo?.daysRemaining || 0,
          totalPnl: dbSession.sessionInfo?.totalPnl || 0,
          winRate: dbSession.sessionInfo?.winRate || 0,
          riskReward: dbSession.sessionInfo?.riskReward || 0,
          monthGainLoss: dbSession.sessionInfo?.monthGainLoss || 0,
          weekGainLoss: dbSession.sessionInfo?.weekGainLoss || 0,
          dailyGainLoss: dbSession.sessionInfo?.dailyGainLoss || 0
        }));

        set({ 
          sessions,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({ 
        error: error.message,
        isLoading: false 
      });
    }
  },

  loadSessionData: async (sessionId: number) => {
    try {
      set({ isLoading: true, error: null });
      
      const res = await fetch(`/api/backtest-sessions?sessionId=${sessionId}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        set({ isLoading: false });
        return;
      }

      const response = await res.json();

      if (response.success && response.data) {
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
      } else {
        set({ isLoading: false });
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
    set({ appliedFilters: updated });
  },

  removeAppliedFilter: async (index) => {
    const updated = [...get().appliedFilters];
    updated.splice(index, 1);
    set({ appliedFilters: updated });
  },

  clearAllFilters: async () => {
    set({ appliedFilters: [] });
  },

  /*
  ───────────────────────────────────────────────
  SESSION ACTIONS (API FIRST → FALLBACK)
  ───────────────────────────────────────────────
  */

  addSession: async (session) => {
    set({ sessions: [...get().sessions, session] });
  },

  updateSession: async (id, updates) => {
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
    set({ trades: [...get().trades, trade] });
  },

  /*
  ───────────────────────────────────────────────
  UI ACTIONS (ALSO SYNCED TO API)
  ───────────────────────────────────────────────
  */

  setActiveTab: async (tab) => {
    set({ activeTab: tab });
  },

  setRowsPerPage: async (rows) => {
    set({ rowsPerPage: rows });
  },

  setCurrentPage: async (page) => {
    set({ currentPage: page });
  },
}));
