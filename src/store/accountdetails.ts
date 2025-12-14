// changed 12-13-25

"use client";
import { create } from "zustand";

interface Account {
  checked: boolean;
  accountName: string;
  accountId?: string;
  accountBalance?: number;
  accountType?: string;
  broker?: string;
  description?: string;
  isPropFirm?: boolean;
  tradeData?: any[];
  [key: string]: any;
}

const generateDemoTradeData = () => {
  const trades = [];
  const symbols = [
    "AAPL",
    "TSLA",
    "NVDA",
    "MSFT",
    "GOOGL",
    "AMZN",
    "META",
    "SPY",
    "QQQ",
  ];
  const strategies = ["Momentum", "Breakout", "Reversal", "Scalping", "Swing"];
  const tradingHours = ["09", "10", "11", "12", "13", "14", "15"];

  // Recent trading days (last 30 days from Dec 7, 2025)
  // 20 trading days spread across Nov-Dec 2025
  const tradingDays = [
    "2025-11-11",
    "2025-11-12",
    "2025-11-13",
    "2025-11-14",
    "2025-11-15",
    "2025-11-18",
    "2025-11-19",
    "2025-11-20",
    "2025-11-21",
    "2025-11-22",
    "2025-11-25",
    "2025-11-26",
    "2025-11-27",
    "2025-11-29",
    "2025-12-02",
    "2025-12-03",
    "2025-12-04",
    "2025-12-05",
    "2025-12-06",
    "2025-12-07",
  ];

  // Target: $6,567 profit, 67% win rate over 20 trading days
  // ~30 trades total: 20 wins, 10 losses = 67% win rate
  const totalTrades = 30;
  const winCount = 20;
  const lossCount = 10;

  // Calculate average win/loss to hit $6,567 profit
  // If avg win = $450 and avg loss = $350: 20*450 - 10*350 = 9000 - 3500 = $5,500
  // Adjust: avg win = $480, avg loss = $330: 20*480 - 10*330 = 9600 - 3300 = $6,300 (close)
  const avgWin = 490;
  const avgLoss = 310;

  const winProfits = Array(winCount)
    .fill(0)
    .map(() => Math.floor(avgWin + (Math.random() - 0.5) * 300));
  const lossProfits = Array(lossCount)
    .fill(0)
    .map(() => -Math.floor(avgLoss + (Math.random() - 0.5) * 200));

  // Adjust last win to hit target of $6,567
  const currentTotal =
    winProfits.reduce((a, b) => a + b, 0) +
    lossProfits.reduce((a, b) => a + b, 0);
  const adjustment = 6567 - currentTotal;
  winProfits[winProfits.length - 1] += adjustment;

  const allProfits = [...winProfits, ...lossProfits];

  // Shuffle and distribute across trading days
  for (let i = allProfits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allProfits[i], allProfits[j]] = [allProfits[j], allProfits[i]];
  }

  for (let i = 0; i < totalTrades; i++) {
    const dateStr = tradingDays[i % tradingDays.length];
    const profit = allProfits[i];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const hour = tradingHours[Math.floor(Math.random() * tradingHours.length)];
    const minute = Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, "0");

    trades.push({
      date: dateStr,
      symbol: symbol,
      Item: symbol,
      Profit: profit,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      entryPrice: (Math.random() * 500 + 50).toFixed(2),
      exitPrice: (Math.random() * 500 + 50).toFixed(2),
      quantity: Math.floor(Math.random() * 100) + 10,
      side: Math.random() > 0.5 ? "Long" : "Short",
      duration: `${Math.floor(Math.random() * 120) + 5}m`,
      EntryTime: `${hour}:${minute}:00`,
    });
  }
  return trades;
};

const demoAccounts: Account[] = [
  {
    checked: true,
    accountName: "Demo Trading Account",
    accountId: "demo-001",
    accountBalance: 17672,
    accountType: "Paper Trading",
    broker: "Demo Broker",
    description: "Demo account for UI preview",
    isPropFirm: false,
    tradeData: generateDemoTradeData(),
  },
  {
    checked: true,
    accountName: "FTMO Challenge",
    accountId: "demo-002",
    accountBalance: 50000,
    accountType: "Manual",
    broker: "FTMO",
    description: "Prop firm challenge account",
    isPropFirm: true,
    tradeData: generateDemoTradeData(),
  },
];

const demoProfileData = {
  uniqueId: "demo-user",
  fullName: "Demo Trader",
  email: "demo@example.com",
  accountValue: 17672,
};

const demoStrategies = [
  { name: "Momentum", winRate: 71, trades: 14, profit: 3200 },
  { name: "Breakout", winRate: 62, trades: 10, profit: 1850 },
  { name: "Reversal", winRate: 67, trades: 6, profit: 1517 },
];

interface ProfileData {
  uniqueId?: string;
  fullName?: string;
  email?: string;
  phone?: number;
  countryCode?: string;
  country?: string;
  bio?: string;
  profilePicture?: string;
  accountValue?: number;
  [key: string]: any;
}

interface Strategy {
  [key: string]: any;
}

interface AccountDetailsState {
  accounts: Account[];
  profileData: ProfileData;
  selectedAccounts: Account[];
  strategies: Strategy[];
  loading: boolean;
  error: string | null;

  // Actions
  setAccounts: () => Promise<void>;
  updateAccView: (accountName: string) => Promise<void>;
  checkAll: (newAllSelected: boolean) => Promise<void>;
  createAccount: (accountData: {
    accountName: string;
    accountBalance: number;
    accountType: string;
    broker: string;
    description: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  createAutoSyncAccount: (accountData: {
    accountName: string;
    accountType: string;
    broker: string;
    investorId: string;
    password: string;
    serverName: string;
    description: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteAccount: (
    accountName: string,
    accountType: "filemanual" | "async",
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// 🔹 API URLs - Updated for Next.js endpoints
const API_BASE_URL = "/api/dashboard";

const useAccountDetails = create<AccountDetailsState>((set, get) => ({
  accounts: [],
  profileData: {},
  selectedAccounts: [],
  strategies: [],
  loading: false,
  error: null,

  setLoading: (loading: boolean) => set({ loading }),

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),

  setAccounts: async () => {
    try {
      set({ loading: true, error: null });
      console.log("setAccounts: Fetching accounts with cookies");

      const res = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: "getAccountDetails",
        }),
      });

      const data = await res.json();
      console.log("setAccounts: response", data, "status", res.status);

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch accounts");
      }

      if (data.error === "Fishy!") {
        set({ accounts: ["/logout"] as any, loading: false });
      } else if (res.status === 200) {
        const accounts = data.accounts || [];
        const selectedAccounts = accounts.filter(
          (account: Account) => account.checked === true,
        );

        console.log(
          "setAccounts: selectedAccounts (filtered):",
          selectedAccounts,
        );

        set({
          accounts: accounts,
          profileData: data.data || {},
          selectedAccounts: selectedAccounts,
          strategies: data.strategies || [],
          loading: false,
        });

        return accounts;
      } else {
        console.warn("setAccounts: unexpected response", res.status, data);
        set({ loading: false });
      }
    } catch (error) {
      console.error("setAccounts: Error fetching accounts:", error);

      // In development, load demo data for UI preview
      if (process.env.NODE_ENV === "development") {
        console.log("setAccounts: Loading demo data for development preview");
        set({
          accounts: demoAccounts,
          profileData: demoProfileData,
          selectedAccounts: demoAccounts,
          strategies: demoStrategies,
          error: null,
          loading: false,
        });
      } else {
        // In production, redirect to login on authentication failure
        console.error(
          "setAccounts: Authentication failed, redirecting to login",
        );
        set({
          accounts: [],
          profileData: {},
          selectedAccounts: [],
          strategies: [],
          error: "Session expired. Please login again.",
          loading: false,
        });

        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
  },

  updateAccView: async (accountName: string) => {
    try {
      set({ loading: true, error: null });
      console.log("updateAccView: sending accountName", accountName);

      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: "editAccCheck",
          accountName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update account view");
      }

      const data = await response.json();
      console.log("updateAccView: response", data);

      if (data.data && data.data.accounts) {
        const selectedAccounts = data.data.accounts.filter(
          (account: Account) => account.checked === true,
        );

        set({
          accounts: data.data.accounts,
          selectedAccounts: selectedAccounts,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error(
        "updateAccView: Error updating account view, toggling locally:",
        error,
      );
      // In demo mode or on API error, toggle locally
      const { accounts } = get();
      const updatedAccounts = accounts.map((acc) =>
        acc.accountName === accountName
          ? { ...acc, checked: !acc.checked }
          : acc,
      );
      const selectedAccounts = updatedAccounts.filter(
        (account: Account) => account.checked === true,
      );
      set({
        accounts: updatedAccounts,
        selectedAccounts: selectedAccounts,
        error: null,
        loading: false,
      });
    }
  },

  checkAll: async (newAllSelected: boolean) => {
    try {
      set({ loading: true, error: null });
      console.log("checkAll: value=", newAllSelected);

      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: "checkAll",
          value: newAllSelected,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update all accounts");
      }

      const data = await response.json();
      console.log("checkAll: response", data);

      if (data.data && data.data.accounts) {
        const selectedAccounts = data.data.accounts.filter(
          (account: Account) => account.checked === true,
        );

        set({
          accounts: data.data.accounts,
          selectedAccounts: selectedAccounts,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error("checkAll: Error checking all accounts:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update all accounts",
        loading: false,
      });
    }
  },

  createAccount: async (accountData) => {
    try {
      set({ loading: true, error: null });
      console.log("createAccount: creating account", accountData);

      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: "createAccount",
          ...accountData,
        }),
      });

      const data = await response.json();
      console.log("createAccount: response", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      set({ loading: false });

      // Refresh accounts after successful creation
      if (response.ok && data.message) {
        await get().setAccounts(); // Refresh the accounts list
        return { success: true, message: data.message };
      }

      return { success: false, error: "Unexpected response" };
    } catch (error) {
      console.error("createAccount: Error creating account:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to create account",
        loading: false,
      });
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create account",
      };
    }
  },

  createAutoSyncAccount: async (accountData) => {
    try {
      set({ loading: true, error: null });
      console.log(
        "createAutoSyncAccount: creating auto sync account",
        accountData,
      );

      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: "createAutoSyncAccount",
          ...accountData,
        }),
      });

      const data = await response.json();
      console.log("createAutoSyncAccount: response", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create auto sync account");
      }

      set({ loading: false });

      // Refresh accounts after successful creation
      if (response.ok && data.message) {
        await get().setAccounts(); // Refresh the accounts list
        return { success: true, message: data.message };
      }

      return { success: false, error: "Unexpected response" };
    } catch (error) {
      console.error(
        "createAutoSyncAccount: Error creating auto sync account:",
        error,
      );
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create auto sync account",
        loading: false,
      });
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create auto sync account",
      };
    }
  },

  deleteAccount: async (
    accountName: string,
    accountType: "filemanual" | "async",
  ) => {
    try {
      set({ loading: true, error: null });
      console.log("deleteAccount: deleting account", accountName, accountType);

      const apiName =
        accountType === "async" ? "deleteAsyncAcc" : "deleteFileManual";

      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: apiName,
          accountName: accountName,
        }),
      });

      const data = await response.json();
      console.log("deleteAccount: response", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      set({ loading: false });

      // Refresh accounts after successful deletion
      if (response.ok && data.message) {
        await get().setAccounts(); // Refresh the accounts list
        return { success: true, message: data.message };
      }

      return { success: false, error: "Unexpected response" };
    } catch (error) {
      console.error("deleteAccount: Error deleting account:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete account",
        loading: false,
      });
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete account",
      };
    }
  },
}));

export default useAccountDetails;
