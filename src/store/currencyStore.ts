"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurrencyType = "USD" | "INR" | "PERCENT" | "R";

interface CurrencyState {
  currency: CurrencyType;
  exchangeRate: number;
  setCurrency: (currency: CurrencyType) => void;
  setExchangeRate: (rate: number) => void;
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

export const formatCurrencyValue = (
  value: number, 
  currency: CurrencyType, 
  exchangeRate: number = 83.5,
  accountBalance?: number,
  riskAmount?: number
): string => {
  if (currency === "PERCENT") {
    if (accountBalance && accountBalance > 0) {
      const percent = (value / accountBalance) * 100;
      return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
  
  if (currency === "R") {
    if (riskAmount && riskAmount > 0) {
      const rValue = value / riskAmount;
      return `${rValue >= 0 ? '+' : ''}${rValue.toFixed(2)}R`;
    }
    return `${value.toFixed(2)}R`;
  }
  
  let displayValue = value;
  if (currency === "INR") {
    displayValue = value * exchangeRate;
  }
  
  const symbol = currencySymbols[currency];
  const absValue = Math.abs(displayValue);
  
  let formatted: string;
  if (absValue >= 10000000) {
    formatted = `${(absValue / 10000000).toFixed(2)}Cr`;
  } else if (absValue >= 100000 && currency === "INR") {
    formatted = `${(absValue / 100000).toFixed(2)}L`;
  } else if (absValue >= 1000000) {
    formatted = `${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    formatted = `${(absValue / 1000).toFixed(1)}K`;
  } else {
    formatted = absValue.toFixed(2);
  }
  
  return displayValue < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

export const formatCompactCurrency = (
  value: number, 
  currency: CurrencyType, 
  exchangeRate: number = 83.5
): string => {
  let displayValue = value;
  if (currency === "INR") {
    displayValue = value * exchangeRate;
  }
  
  const symbol = currencySymbols[currency];
  const absValue = Math.abs(displayValue);
  
  let formatted: string;
  if (currency === "INR") {
    if (absValue >= 10000000) {
      formatted = `${(absValue / 10000000).toFixed(1)}Cr`;
    } else if (absValue >= 100000) {
      formatted = `${(absValue / 100000).toFixed(1)}L`;
    } else if (absValue >= 1000) {
      formatted = `${(absValue / 1000).toFixed(0)}K`;
    } else {
      formatted = absValue.toFixed(0);
    }
  } else {
    if (absValue >= 1000000) {
      formatted = `${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      formatted = `${(absValue / 1000).toFixed(1)}K`;
    } else {
      formatted = absValue.toFixed(0);
    }
  }
  
  return displayValue < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "USD",
      exchangeRate: 83.5,
      setCurrency: (currency: CurrencyType) => set({ currency }),
      setExchangeRate: (exchangeRate: number) => set({ exchangeRate }),
    }),
    {
      name: "currency-preference",
    }
  )
);

export default useCurrencyStore;
