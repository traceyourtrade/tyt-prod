"use client"
import { create } from "zustand";

interface Account {
  checked: boolean;
  accountName: string;
  accountId?: string;
  accountBalance?: number;
  accountType?: string;
  broker?: string;
  description?: string;
  tradeData?: any[];
  [key: string]: any;
}

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
  deleteAccount: (accountName: string, accountType: 'filemanual' | 'async') => Promise<{ success: boolean; message?: string; error?: string }>;
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
      console.log('setAccounts: Fetching accounts with cookies');
      
      const res = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          apiName: "getAccountDetails"
        })
      });

      const data = await res.json();
      console.log('setAccounts: response', data, 'status', res.status);
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch accounts');
      }
      
      if (data.error === "Fishy!") {
        set({ accounts: ["/logout"] as any, loading: false });
      } else if (res.status === 200) {
        const accounts = data.accounts || [];
        const selectedAccounts = accounts.filter((account: Account) => account.checked === true);
        
        console.log('setAccounts: selectedAccounts (filtered):', selectedAccounts);
        
        set({ 
          accounts: accounts,
          profileData: data.data || {},
          selectedAccounts: selectedAccounts,
          strategies: data.strategies || [],
          loading: false 
        });
        
        return accounts;
      } else {
        console.warn('setAccounts: unexpected response', res.status, data);
        set({ loading: false });
      }
    } catch (error) {
      console.error("setAccounts: Error fetching accounts:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch accounts',
        loading: false 
      });
    }
  },

  updateAccView: async (accountName: string) => {
    try {
      set({ loading: true, error: null });
      console.log('updateAccView: sending accountName', accountName);
      
      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          apiName: "editAccCheck",
          accountName 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account view');
      }

      const data = await response.json();
      console.log('updateAccView: response', data);
      
      if (data.data && data.data.accounts) {
        const selectedAccounts = data.data.accounts.filter((account: Account) => account.checked === true);
        
        set({ 
          accounts: data.data.accounts,
          selectedAccounts: selectedAccounts,
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error("updateAccView: Error updating account view:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update account view',
        loading: false 
      });
    }
  },

  checkAll: async (newAllSelected: boolean) => {
    try {
      set({ loading: true, error: null });
      console.log('checkAll: value=', newAllSelected);
      
      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          apiName: "checkAll",
          value: newAllSelected 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update all accounts');
      }

      const data = await response.json();
      console.log('checkAll: response', data);
      
      if (data.data && data.data.accounts) {
        const selectedAccounts = data.data.accounts.filter((account: Account) => account.checked === true);
        
        set({ 
          accounts: data.data.accounts,
          selectedAccounts: selectedAccounts,
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error("checkAll: Error checking all accounts:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update all accounts',
        loading: false 
      });
    }
  },

  createAccount: async (accountData) => {
    try {
      set({ loading: true, error: null });
      console.log('createAccount: creating account', accountData);
      
      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: "createAccount",
          ...accountData
        }),
      });

      const data = await response.json();
      console.log('createAccount: response', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      set({ loading: false });
      
      // Refresh accounts after successful creation
      if (response.ok && data.message) {
        await get().setAccounts(); // Refresh the accounts list
        return { success: true, message: data.message };
      }
      
      return { success: false, error: 'Unexpected response' };
    } catch (error) {
      console.error("createAccount: Error creating account:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create account',
        loading: false 
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create account' 
      };
    }
  },

  createAutoSyncAccount: async (accountData) => {
    try {
      set({ loading: true, error: null });
      console.log('createAutoSyncAccount: creating auto sync account', accountData);
      
      const response = await fetch(`${API_BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: "createAutoSyncAccount",
          ...accountData
        }),
      });

      const data = await response.json();
      console.log('createAutoSyncAccount: response', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create auto sync account');
      }

      set({ loading: false });
      
      // Refresh accounts after successful creation
      if (response.ok && data.message) {
        await get().setAccounts(); // Refresh the accounts list
        return { success: true, message: data.message };
      }
      
      return { success: false, error: 'Unexpected response' };
    } catch (error) {
      console.error("createAutoSyncAccount: Error creating auto sync account:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create auto sync account',
        loading: false 
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create auto sync account' 
      };
    }
  },

  deleteAccount: async (accountName: string, accountType: 'filemanual' | 'async') => {
    try {
      set({ loading: true, error: null });
      console.log('deleteAccount: deleting account', accountName, accountType);
      
      const apiName = accountType === 'async' ? 'deleteAsyncAcc' : 'deleteFileManual';
      
      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiName: apiName,
          accountName: accountName
        }),
      });

      const data = await response.json();
      console.log('deleteAccount: response', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      set({ loading: false });
      
      // Refresh accounts after successful deletion
      if (response.ok && data.message) {
        await get().setAccounts(); // Refresh the accounts list
        return { success: true, message: data.message };
      }
      
      return { success: false, error: 'Unexpected response' };
    } catch (error) {
      console.error("deleteAccount: Error deleting account:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete account',
        loading: false 
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete account' 
      };
    }
  }
}));

export default useAccountDetails;