"use client"
import { create } from "zustand";

interface Account {
  checked: boolean;
  accountName: string;
  [key:string]: any;
  // Add other account properties as needed
}

interface ProfileData {
  fullName?: string;
  email?: string;
  [key:string]: any;
  // Add other profile properties as needed
}

interface Strategy {
  // Define strategy properties as needed
  [key:string]: any;
}

interface AccountDetailsState {
  accounts: Account[] | string[];
  profileData: ProfileData;
  selectedAccounts: any[];
  strategies: Strategy[];
  setAccounts: (userId: string, tokenn: string) => Promise<void>;
  updateAccView: (accountName: string, tokenn: string) => Promise<void>;
  checkAll: (tokenn: string, newAllSelected: boolean) => Promise<void>;
}

// 🔹 API URLs
const API_FETCH_URL = "https://tyt-backend2-473812.el.r.appspot.com/usersasqwzxerdfcv/get/accDetails";
const API_SEND_URL = "https://tyt-backend2-473812.el.r.appspot.com/usersasqwzxerdfcv/edit/accCheck";
const API_CHECK_ALL = "https://tyt-backend2-473812.el.r.appspot.com/usersasqwzxerdfcv/edit/checkAll";

const useAccountDetails = create<AccountDetailsState>((set) => ({
  accounts: [],
  profileData: {},
  selectedAccounts: [],
  strategies: [],

  setAccounts: async (userId: string, tokenn: string) => {
    try {
      console.log('setAccounts: Fetching accounts with userId:', userId , 'and tokenn:', tokenn);
      const res = await fetch(API_FETCH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId, tokenn
        })
      });

      const data = await res.json();
      console.log('setAccounts: response', data, 'status', res.status);
      if (data.error === "Fishy!") {
        set({ accounts: ["/logout"] });
      } else if (res.status === 200) {
        const selectedAccounts = (data.accounts || []).filter((account: any) => account.checked === true);
        console.log('setAccounts: selectedAccounts (filtered):', selectedAccounts);
        set({ accounts: data.accounts });
        set({ profileData: data.data });
        set({ selectedAccounts: selectedAccounts });
        set({ strategies: data.strategies });
        return data.accounts;
      } else {
        // Log unexpected responses for debugging
        console.warn('setAccounts: unexpected response', res.status, data);
      }
    } catch (error) {
      console.error("setAccounts: Error fetching accounts:", error);
    }
  },

  updateAccView: async (accountName: string, tokenn: string) => {
    try {
      console.log('updateAccView: sending accountName', accountName);
      const response = await fetch(API_SEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountName, tokenn }),
      });

      if (!response.ok) throw new Error("Failed to send data");

      const data = await response.json();
      console.log('updateAccView: response', data);
      set({ accounts: data.data.accounts });
      set({ selectedAccounts: data.data.accounts.filter((account: Account) => account.checked === true) });
    } catch (error) {
      console.error("updateAccView: Error updating account view:", error);
    }
  },

  checkAll: async (tokenn: string, newAllSelected: boolean) => {
    try {
      console.log('checkAll: token present, value=', newAllSelected);
      const response = await fetch(API_CHECK_ALL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenn, value: newAllSelected }),
      });

      if (!response.ok) throw new Error("Failed to send data");

      const data = await response.json();
      console.log('checkAll: response', data);
      set({ accounts: data.data.accounts });
      set({ selectedAccounts: data.data.accounts.filter((account: Account) => account.checked === true) });
    } catch (error) {
      console.error("checkAll: Error checking all accounts:", error);
    }
  },
}));

export default useAccountDetails;