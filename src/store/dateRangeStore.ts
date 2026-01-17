import { create } from "zustand";

export type DateRangeOption = 
  | "this_week"
  | "this_month"
  | "last_30_days"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "all_time"
  | "custom";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeStore {
  selectedRange: DateRangeOption;
  customRange: DateRange;
  viewingMonth: Date;
  setSelectedRange: (range: DateRangeOption) => void;
  setCustomRange: (range: DateRange) => void;
  setViewingMonth: (date: Date) => void;
  getDateRange: () => DateRange;
}

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

const getStartOfQuarter = (date: Date): Date => {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
};

const getEndOfQuarter = (date: Date): Date => {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
};

const useDateRangeStore = create<DateRangeStore>((set, get) => ({
  selectedRange: "this_month",
  customRange: { startDate: null, endDate: null },
  viewingMonth: new Date(),
  
  setSelectedRange: (range) => set({ selectedRange: range }),
  
  setCustomRange: (range) => set({ customRange: range, selectedRange: "custom" }),
  
  setViewingMonth: (date) => set({ viewingMonth: date }),
  
  getDateRange: () => {
    const { selectedRange, customRange, viewingMonth } = get();
    const now = new Date();
    
    switch (selectedRange) {
      case "this_week":
        return {
          startDate: getStartOfWeek(now),
          endDate: getEndOfWeek(now),
        };
      case "this_month":
        return {
          startDate: getStartOfMonth(viewingMonth),
          endDate: getEndOfMonth(viewingMonth),
        };
      case "last_30_days":
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        return {
          startDate: thirtyDaysAgo,
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
        };
      case "last_month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          startDate: getStartOfMonth(lastMonth),
          endDate: getEndOfMonth(lastMonth),
        };
      case "this_quarter":
        return {
          startDate: getStartOfQuarter(now),
          endDate: getEndOfQuarter(now),
        };
      case "this_year":
        return {
          startDate: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
          endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
        };
      case "all_time":
        return {
          startDate: null,
          endDate: null,
        };
      case "custom":
        return customRange;
      default:
        return {
          startDate: getStartOfMonth(viewingMonth),
          endDate: getEndOfMonth(viewingMonth),
        };
    }
  },
}));

export const dateRangeLabels: Record<DateRangeOption, string> = {
  this_week: "This Week",
  this_month: "This Month",
  last_30_days: "Last 30 Days",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  all_time: "All Time",
  custom: "Custom Range",
};

export default useDateRangeStore;
