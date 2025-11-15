import { create } from "zustand";

interface CalendarPopUpStore {
  showAddTrades: boolean;
  setAddTrades: () => void;
  showAddAcc: boolean;
  setAddAcc: () => void;
  showEditAcc: boolean;
  setEditAcc: () => void;
  editAccData: any;
  setEditAccData: (data: any) => void;
  deleteAccData: any;
  setDeleteAccData: (data: any) => void;
  showDeleteAcc: boolean;
  setDeleteAcc: () => void;
  showDjImg: boolean;
  djImgUrl: string;
  setDjImg: () => void;
  setDjUrl: (url: string) => void;
  showProImg: boolean;
  proImgUrl: string;
  setProImg: () => void;
  setProUrl: (url: string) => void;
  showTr: boolean;
  dataDate: string;
  setShowTr: () => void;
  setDataDate: (selectedYear: number, selectedMonth: number, day: number) => void;
  setDateHard: (date: string) => void;
  showEditTradePopUp: boolean;
  setShowEditTradePopUp: (bolValue: boolean) => void;
  editTradeData: any;
  setEditTradeData: (data: any) => void;
}

const calendarPopUp = create<CalendarPopUpStore>((set) => ({
  // Add trades (manual, file, broker)
  showAddTrades: false,

  setAddTrades: () => {
    set((state) => ({ showAddTrades: !state.showAddTrades }));
  },

  // Show add accounts 
  showAddAcc: false,

  setAddAcc: () => {
    set((state) => ({ showAddAcc: !state.showAddAcc }));
  },

  // Edit Account
  showEditAcc: false,

  setEditAcc: () => {
    set((state) => ({ showEditAcc: !state.showEditAcc }));
  },

  editAccData: {},

  setEditAccData: (data: any) => {
    set(() => ({ editAccData: data }));
  },

  // Delete Account
  deleteAccData: {},

  setDeleteAccData: (data: any) => {
    set(() => ({ deleteAccData: data }));
  },

  showDeleteAcc: false,

  setDeleteAcc: () => {
    set((state) => ({ showDeleteAcc: !state.showDeleteAcc }));
  },

  // Show images in dj -------------------------------
  showDjImg: false,

  djImgUrl: "null",

  setDjImg: () => {
    set((state) => ({ showDjImg: !state.showDjImg }));
  },

  setDjUrl: (url: string) => {
    set(() => ({ djImgUrl: url }));
  },

  // Show images in profile -------------------------------
  showProImg: false,

  proImgUrl: "null",

  setProImg: () => {
    set((state) => ({ showProImg: !state.showProImg }));
  },

  setProUrl: (url: string) => {
    set(() => ({ proImgUrl: url }));
  },

  // Calendar popup
  showTr: false,

  dataDate: "",

  setShowTr: () => {
    set((state) => ({ showTr: !state.showTr }));
  },

  setDataDate: (selectedYear: number, selectedMonth: number, day: number) => {
    const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');

    const date = `${selectedYear}-${formattedMonth}-${formattedDay}`;

    set((state) => ({ dataDate: date }));
  },

  setDateHard: (date: string) => {
    set(() => ({ dataDate: date }));
  },

  showEditTradePopUp: false,

  setShowEditTradePopUp: (bolValue: boolean) => {
    set(() => ({ showEditTradePopUp: bolValue }));
  },

  editTradeData: {},

  setEditTradeData: (data: any) => {
    set(() => ({ editTradeData: data }));
  },

}));

export default calendarPopUp;