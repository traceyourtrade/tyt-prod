'use client';

import { useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";

import SubmitButton from "./components/SubmitButton";

import symbols from "./components/symbols/Forex";
import notifications from "@/store/notifications";
import { useDataStore } from "@/store/store";
import useAccountDetails from "@/store/accountdetails";
import AccountSelector from "./components/AccountSelector";
import EntryFormList from "./components/EntryFormList";

interface Entry {
  id: string;
  value: string;
  date: string;
  status: string;
  symbol?: string;
  market?: string;
  curr?: string;
  contractSize?: string;
  quantity?: string;
  closePrice?: string;
  stopLoss?: string;
  targetPrice?: string;
  closeDate?: string;
  commission?: string;
}

const AddTradePopUp = () => {
  const tokenn = Cookies.get("Trace Your Trades");
  const params = useParams();
  const userId = params.userId as string;

  const [selectedSide, setSelectedSide] = useState("buy");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showDateTimePickerFor, setShowDateTimePickerFor] = useState<string | null>(null);
  const { setAlertBoxG } = notifications();

  const { accounts, setAccounts } = useAccountDetails();
  const { bkurl } = useDataStore();

  const updateEntryValue = (id: string, value: string) => {
    setEntries(
      entries.map((entry) =>
        entry.id === id
          ? { ...entry, value, status: value ? entry.status : "waiting" }
          : entry
      )
    );
  };

  const toggleEntryStatus = (id: string, status: string) => {
    setEntries(
      entries.map((entry) => (entry.id === id ? { ...entry, status } : entry))
    );
  };

  const areAllFieldsFilled =
    Array.isArray(entries) &&
    entries.every((entry) => {
      const commonFields = entry.value && entry.date;
      if (entry.status === "completed") {
        return commonFields && entry.closePrice;
      } else if (entry.status === "pending") {
        return commonFields;
      } else {
        return commonFields;
      }
    });

  // Forex markets
  const calculateForexProfit = (symbol: string, entryPrice: number, exitPrice: number, lotSize: number, isBuy: boolean) => {
    const isMetal = symbol.startsWith('XAU') || symbol.startsWith('XAG');
    const isJPY = symbol.endsWith('JPY');

    const contractMultiplier = isMetal ? 100 : 100000;
    const contractSize = lotSize * contractMultiplier;
    const pipMultiplier = isJPY ? 100 : 10000;

    const rawPips = exitPrice - entryPrice;
    const pips = rawPips * pipMultiplier;
    const directionalPips = isBuy ? pips : -pips;

    if (symbol.endsWith('USD')) {
      return (directionalPips * contractSize) / pipMultiplier;
    } else if (symbol.startsWith('USD')) {
      return (directionalPips * contractSize) / pipMultiplier / exitPrice;
    } else {
      const symbolData = symbols.find(s => s.symbol === symbol);
      if (symbolData?.conversionRate) {
        return (directionalPips * contractSize) / pipMultiplier * symbolData.conversionRate;
      }
      return 0;
    }
  };

  // Stock market
  const calculatePnLStock = (entryPrice: number, exitPrice: number, tradeSide: string, quantity: number, currency: string) => {
    let conversionRate = 1;
    if (currency === 'INR') {
      conversionRate = 86.5;
    }

    if (tradeSide === "buy") {
      const profitOrLoss = (exitPrice - entryPrice) * quantity;
      return profitOrLoss / conversionRate;
    } else if (tradeSide === "sell") {
      const profitOrLoss = (entryPrice - exitPrice) * quantity;
      return profitOrLoss / conversionRate;
    } else {
      throw new Error("Invalid trade side. Use 'buy' or 'sell'.");
    }
  };

  // Crypto Calculations
  const calculateCryptoProfit = (entryPrice: number, exitPrice: number, quantity: number, isBuy: boolean = true, lotSize: number | null = null) => {
    const calculatedLotSize = lotSize !== null ? lotSize : quantity / entryPrice;
    const priceDifference = exitPrice - entryPrice;
    const directionalPriceDifference = isBuy ? priceDifference : -priceDifference;
    const profit = directionalPriceDifference * calculatedLotSize;
    return parseFloat(profit.toFixed(2));
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount || entries.every((e) => !e.value)) {
      setAlertBoxG("Please select an account and fill at least one entry.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const tradeEntries = entries
        .filter((entry) => entry.value)
        .map((entry) => {
          const openDate = new Date(entry.date);
          const dateStr = openDate.toISOString().slice(0, 10);
          const timeStr = openDate.toTimeString().slice(0, 8);

          const profit = () => {
            if (entry.market === "FOREX") {
              return calculateForexProfit(
                entry.symbol || "",
                parseFloat(entry.value),
                parseFloat(entry.closePrice || "0"),
                parseFloat(entry.contractSize || "0"),
                selectedSide === "buy"
              );
            } else if (entry.market === "US STOCKS" || entry.market === "INDIAN STOCKS") {
              return calculatePnLStock(
                parseFloat(entry.value), 
                parseFloat(entry.closePrice || "0"), 
                selectedSide, 
                parseFloat(entry.contractSize || "0"), 
                entry.curr || "USD"
              );
            } else if (entry.market === 'CRYPTO') {
              return calculateCryptoProfit(
                parseFloat(entry.value), 
                parseFloat(entry.closePrice || "0"),
                parseFloat(entry.quantity || "0"),
                selectedSide === 'buy', 
                null
              );
            } else {
              return entry.closePrice
                ? parseFloat(entry.closePrice) - parseFloat(entry.value)
                : 0;
            }
          };

          return {
            date: dateStr,
            time: timeStr,
            OpenTime: entry.date,
            Ticket: 0,
            Item: entry.symbol || "",
            Type: selectedSide,
            marketType: entry.market || "",
            Size: entry.contractSize || entry.quantity || "0",
            status: entry.status,
            Currency: entry.curr || "USD",
            OpenPrice: parseFloat(entry.value) || 0,
            StopLoss: entry.stopLoss ? parseFloat(entry.stopLoss) : null,
            TakeProfit: entry.targetPrice ? parseFloat(entry.targetPrice) : null,
            CloseTime: entry.closeDate || null,
            ClosePrice: entry.closePrice ? parseFloat(entry.closePrice) : null,
            Commission: entry.commission ? parseFloat(entry.commission) : 0,
            Swap: 0,
            Profit: profit(),
            Strategy: "",
            RiskR: "",
            Quality: "",
            beforeURL: "",
            afterURL: ""
          };
        });

      const requestData = {
        accountName: selectedAccount.accountName,
        accountId: selectedAccount.accountId,
        accountType: selectedAccount.accountType,
        tokenn,
        tradeData: tradeEntries,
        apiName:'postManualUpload'
      };

      const response = await fetch(
        `/api/dashboard/post/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) throw new Error("Failed to submit trade.");

      const data = await response.json();
      setAccounts(userId, tokenn);
      setSelectedAccount(null);
      setSelectedSide("buy");
      setEntries([]);
      setAlertBoxG("Trade(s) added successfully!", "success");

    } catch (error) {
      console.error("Error submitting trade:", error);
      setAlertBoxG("An error occurred while submitting the trade.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountSelect = (account: any) => {
    setSelectedAccount(account);
    setShowAccountDropdown(false);
  };

  const separator = () => <div className="w-full h-[1px] bg-gray-500 my-[12px]"></div>;

  return (
    <div className="w-[90%] h-[65vh] mx-auto my-[10px] pr-[8px] overflow-y-auto">
      <div className="atp-form-section">
        <AccountSelector
          selectedAccount={selectedAccount}
          showAccountDropdown={showAccountDropdown}
          toggleAccountDropdown={() => setShowAccountDropdown(!showAccountDropdown)}
          handleAccountSelect={handleAccountSelect}
          accounts={accounts}
        />

        <EntryFormList
          entries={entries}
          selectedSide={selectedSide}
          setSelectedSide={setSelectedSide}
          updateEntryValue={updateEntryValue}
          toggleEntryStatus={toggleEntryStatus}
          showDateTimePickerFor={showDateTimePickerFor}
          setShowDateTimePickerFor={setShowDateTimePickerFor}
          setEntries={setEntries}
        />

        {separator()}

        <SubmitButton
          handleSubmit={handleEntrySubmit}
          disabled={!selectedAccount || !areAllFieldsFilled}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AddTradePopUp;