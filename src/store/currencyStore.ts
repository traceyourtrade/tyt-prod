"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurrencyType = "USD" | "INR" | "PERCENT" | "R";

interface CurrencyState {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
}

export const currencySymbols: Record<CurrencyType, string> = {
  USD: "$",
  INR: "₹",
  PERCENT: "%",
  R: "R",
};

export const currencyLabels: Record<CurrencyType, string> = {
  USD: "Dollar",
  INR: "Rupees",
  PERCENT: "Percentage",
  R: "R Factor",
};

export const formatCurrency = (value: number, currency: CurrencyType): string => {
  if (currency === "PERCENT") {
    return `${value.toFixed(2)}%`;
  }
  if (currency === "R") {
    return `${value.toFixed(2)}R`;
  }
  
  const symbol = currencySymbols[currency];
  const absValue = Math.abs(value);
  
  let formatted: string;
  if (absValue >= 1000000) {
    formatted = `${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    formatted = `${(absValue / 1000).toFixed(1)}K`;
  } else {
    formatted = absValue.toFixed(2);
  }
  
  return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "USD",
      setCurrency: (currency: CurrencyType) => set({ currency }),
    }),
    {
      name: "currency-preference",
    }
  )
);

export default useCurrencyStore;
