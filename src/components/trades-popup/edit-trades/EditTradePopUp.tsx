'use client';

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCalendarAlt, 
  faCheckCircle, 
  faClock, 
  faXmark,
  faChevronDown,
  faArrowTrendUp,
  faArrowTrendDown
} from "@fortawesome/free-solid-svg-icons";
import symbols from "./components/symbols/Forex";
import indianStocks from "./components/symbols/IndianStocks";
import usStocks from "./components/symbols/USAStock";
import crypto from "./components/symbols/Crypto";
import SubmitButton from "./components/SubmitButton";
import notifications from "@/store/notifications";
import { useDataStore } from "@/store/store";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import CustomDateTimePicker from "./components/custom date picker/CustomDateTimePicker";

interface TradeEntry {
  id?: string;
  OpenPrice?: string;
  ClosePrice?: string;
  StopLoss?: string;
  TakeProfit?: string;
  Commission?: string;
  Swap?: string;
  Size?: string;
  Profit?: number;
  symbol?: string;
  Item?: string;
  Type?: string;
  OpenTime?: string;
  CloseTime?: string;
  status?: string;
  marketType?: string;
  market?: string;
  curr?: string;
  quantity?: string;
  accountName?: string;
  date?: string;
  time?: string;
}

interface SymbolData {
  symbol: string;
  name?: string;
  market?: string;
  curr?: string;
  conversionRate?: number | null;
}

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return new Date().toLocaleString();
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", options).format(date);
};

const isValidDecimal = (value: string) => {
  return value === "" || /^\d*\.?\d*$/.test(value);
};

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
  }
  return 0;
};

const calculateCryptoProfit = (entryPrice: number, exitPrice: number, quantity: number, isBuy: boolean = true) => {
  try {
    const entry = parseFloat(entryPrice.toString());
    const exit = parseFloat(exitPrice.toString());
    const qty = parseFloat(quantity.toString());
    if (isNaN(entry) || isNaN(exit) || isNaN(qty)) return 0;

    const priceDifference = exit - entry;
    const directionalPriceDifference = isBuy ? priceDifference : -priceDifference;
    const profit = directionalPriceDifference * qty;
    return parseFloat(profit.toString());
  } catch (e) {
    console.error("Error calculating Crypto profit:", e);
    return 0;
  }
};

const EditTradePopUp = () => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { showEditTradePopUp, setShowEditTradePopUp, editTradeData } = calendarPopUp();
  const [selectedSide, setSelectedSide] = useState("buy");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [tradeEntry, setTradeEntry] = useState<TradeEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDateTimePickerFor, setShowDateTimePickerFor] = useState<string | null>(null);
  const { accounts } = useAccountDetails();
  const { bkurl } = useDataStore();
  const { setAlertBoxG } = notifications();

  const [openSymbolDropdown, setOpenSymbolDropdown] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState("");
  const symbolInputRef = useRef<HTMLDivElement>(null);
  const symbolDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        symbolInputRef.current &&
        !symbolInputRef.current.contains(event.target as Node) &&
        symbolDropdownRef.current &&
        !symbolDropdownRef.current.contains(event.target as Node)
      ) {
        setOpenSymbolDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowEditTradePopUp(false);
        document.body.classList.remove("no-scroll");
      }
    };
    if (showEditTradePopUp) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEditTradePopUp, setShowEditTradePopUp]);

  useEffect(() => {
    if (showEditTradePopUp && editTradeData) {
      setTradeEntry({ ...editTradeData, symbol: editTradeData.Item });
      setSelectedSide(editTradeData.Type || "buy");
      const accountNameOfTrade = editTradeData.accountName;
      if (accountNameOfTrade) {
        const associatedAccount = accounts.find((acc: any) => acc.accountName === accountNameOfTrade);
        if (associatedAccount) {
          setSelectedAccount(associatedAccount);
        } else {
          console.warn(`Account with name '${accountNameOfTrade}' not found.`);
        }
      } else {
        console.warn("editTradeData missing accountName.");
      }
    } else {
      setTradeEntry(null);
      setSelectedSide("buy");
      setSelectedAccount(null);
    }
  }, [showEditTradePopUp, editTradeData, accounts]);

  const filteredSymbols = (): SymbolData[] => {
    const marketType = tradeEntry?.marketType || "OTHER";
    let symbolList: SymbolData[] = [];
    
    if (marketType === "FOREX") {
      symbolList = symbols;
    } else if (marketType === "US STOCK") {
      symbolList = usStocks;
    } else if (marketType === "CRYPTO") {
      symbolList = crypto;
    } else if (marketType === "INDIAN STOCK") {
      symbolList = indianStocks;
    } else {
      return [];
    }

    return symbolList.filter((symbol) =>
      symbol.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      (symbol.name && symbol.name.toLowerCase().includes(symbolSearch.toLowerCase()))
    );
  };

  const handleInputChange = (field: string, value: string) => {
    if (['OpenPrice', 'ClosePrice', 'StopLoss', 'TakeProfit', 'Commission', 'Swap', 'Size', 'Profit', 'symbol'].includes(field) && !isValidDecimal(value)) {
      if (field !== 'symbol') {
        console.warn(`Invalid decimal input for ${field}:`, value);
        return;
      }
    }

    setTradeEntry(prev => {
      if (!prev) return prev;
      const updatedEntry = { ...prev, [field]: value };
      return updatedEntry;
    });
  };

  const handleDateChange = (dateType: 'OpenTime' | 'CloseTime', newDate: Date) => {
    const newDateISOString = newDate.toISOString();
    setTradeEntry(prev => {
      if (!prev) return prev;
      if (dateType === 'OpenTime') {
        const updatedEntry = { ...prev, OpenTime: newDateISOString };
        updatedEntry.date = newDate.toISOString().slice(0, 10);
        updatedEntry.time = newDate.toTimeString().slice(0, 8);
        return updatedEntry;
      } else if (dateType === 'CloseTime') {
        return { ...prev, CloseTime: newDateISOString };
      }
      return prev;
    });
    setShowDateTimePickerFor(null);
  };

  const toggleEntryStatus = (status: string) => {
    setTradeEntry(prev => {
      if (!prev) return prev;
      return { ...prev, status };
    });
  };

  const isFormValid = () => {
    if (!tradeEntry || !selectedAccount) return false;
    const hasOpenPrice = tradeEntry.OpenPrice !== undefined && tradeEntry.OpenPrice !== null && tradeEntry.OpenPrice !== "";
    const hasOpenTime = tradeEntry.OpenTime !== undefined && tradeEntry.OpenTime !== null && tradeEntry.OpenTime !== "";

    if (tradeEntry.status === "completed") {
      const hasClosePrice = tradeEntry.ClosePrice !== undefined && tradeEntry.ClosePrice !== null && tradeEntry.ClosePrice !== "";
      const hasCloseTime = tradeEntry.CloseTime !== undefined && tradeEntry.CloseTime !== null && tradeEntry.CloseTime !== "";
      return hasOpenPrice && hasOpenTime && hasClosePrice && hasCloseTime;
    } else {
      return hasOpenPrice && hasOpenTime;
    }
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !tradeEntry || !isFormValid()) {
      setAlertBoxG("Please ensure the form is correctly filled.", "normal");
      return;
    }

    setIsSubmitting(true);
    try {
      let calculatedProfit = 0;
      const entry = tradeEntry;

      const openPrice = parseFloat(entry.OpenPrice || "0");
      const closePrice = parseFloat(entry.ClosePrice || "0");
      const sizeOrQuantity = parseFloat(entry.Size || "0");

      const marketType = entry.marketType || "OTHER";
      const symbol = entry.Item || entry.symbol || "";
      const side = entry.Type || selectedSide;

      if (!isNaN(openPrice) && entry.status === "completed" && !isNaN(closePrice)) {
        if (marketType === "FOREX") {
          calculatedProfit = calculateForexProfit(symbol, openPrice, closePrice, sizeOrQuantity, side === "buy");
        } else if (marketType === "STOCK" || marketType === "US STOCKS" || marketType === "INDIAN STOCKS") {
          const currency = entry.curr || 'USD';
          calculatedProfit = calculatePnLStock(openPrice, closePrice, side, sizeOrQuantity, currency);
        } else if (marketType === "CRYPTO") {
          calculatedProfit = calculateCryptoProfit(openPrice, closePrice, sizeOrQuantity, side === "buy");
        } else {
          calculatedProfit = (closePrice - openPrice) * sizeOrQuantity;
          if (side === "sell") {
            calculatedProfit = -calculatedProfit;
          }
        }
      }

      const finalTradeData = {
        ...tradeEntry,
        Type: side,
        Item: tradeEntry.symbol || tradeEntry.Item,
        Profit: parseFloat(calculatedProfit.toFixed(2))
      };

      const requestData = {
        accountId: selectedAccount.accountId,
        tradeId: editTradeData.id,
        updatedTradeData: finalTradeData,
        apiName:'editManualUpload'
      };

      const response = await fetch(
        `/api/dashboard/put`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to submit trade. Status: ${response.status}`);
      }

      const data = await response.json();
      setAlertBoxG("Trade updated successfully!", "success");

    } catch (error: any) {
      console.error("Error submitting edited trade:", error);
      setAlertBoxG(`An error occurred while updating the trade: ${error.message}`, "error");
    } finally {
      setIsSubmitting(false);
      setShowEditTradePopUp(false);
    }
  };

  if (!showEditTradePopUp || !tradeEntry) {
    return null;
  }

  const marketType = tradeEntry.marketType || tradeEntry.market || "N/A";

  const InputField = ({ label, value, onChange, placeholder, readOnly = false }: {
    label: string;
    value: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
  }) => (
    <div className="space-y-2">
      <label className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white font-medium placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-[#252525] transition-all duration-200 ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 transition-opacity duration-300 ${showEditTradePopUp ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <div 
        className="w-full max-w-md max-h-[90vh] bg-[#141414] rounded-3xl flex flex-col border border-[#2a2a2a] shadow-2xl overflow-hidden"
        ref={popupRef}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div>
            <h2 className="text-lg font-bold text-white">Edit Trade</h2>
            <p className="text-xs text-gray-500 mt-0.5">{marketType} Market</p>
          </div>
          <button 
            className="w-9 h-9 rounded-xl bg-[#1e1e1e] hover:bg-red-500/20 flex items-center justify-center transition-colors duration-200 group"
            onClick={() => setShowEditTradePopUp(false)}
          >
            <FontAwesomeIcon icon={faXmark} className="text-gray-400 group-hover:text-red-400 text-sm" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#141414]">
          <div className="relative" ref={symbolInputRef}>
            <label className="text-[11px] uppercase tracking-wider text-gray-500 font-medium block mb-2">Symbol</label>
            <div 
              className="relative cursor-pointer"
              onClick={() => {
                const mt = tradeEntry?.marketType || "";
                if (mt && mt !== "OTHER") {
                  setOpenSymbolDropdown(!openSymbolDropdown);
                }
              }}
            >
              <input
                type="text"
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white font-medium placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-[#252525] transition-all duration-200 pr-10 uppercase"
                placeholder="Search symbol..."
                value={tradeEntry.symbol || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSymbolSearch(value);
                  handleInputChange("symbol", value);
                  setOpenSymbolDropdown(true);
                }}
              />
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs transition-transform duration-200 ${openSymbolDropdown ? 'rotate-180' : ''}`}
              />
            </div>

            {openSymbolDropdown && filteredSymbols().length > 0 && (
              <div
                className="absolute top-full left-0 w-full max-h-48 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl mt-2 shadow-2xl z-10 overflow-auto"
                ref={symbolDropdownRef}
              >
                {filteredSymbols().map((symbolData, index) => (
                  <div
                    key={`${symbolData.symbol}-${index}`}
                    className="px-4 py-3 cursor-pointer text-gray-300 hover:bg-[#252525] hover:text-white transition-colors duration-150 text-sm border-b border-[#2a2a2a] last:border-0"
                    onClick={() => {
                      handleInputChange("symbol", symbolData.symbol);
                      if (symbolData.market !== undefined) {
                        handleInputChange("market", symbolData.market);
                      }
                      if (symbolData.curr !== undefined) {
                        handleInputChange("curr", symbolData.curr);
                      }
                      setSymbolSearch("");
                      setOpenSymbolDropdown(false);
                    }}
                  >
                    <span className="font-medium">{symbolData.symbol}</span>
                    {symbolData.name && (
                      <span className="text-gray-500 ml-2 text-xs">{symbolData.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Position Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  selectedSide === "buy" 
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                    : "bg-[#1e1e1e] text-gray-400 border-[#2a2a2a] hover:bg-[#252525]"
                }`}
                onClick={() => {
                  setSelectedSide("buy");
                  handleInputChange('Type', "buy");
                }}
              >
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-xs" />
                Long
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  selectedSide === "sell" 
                    ? "bg-red-500/15 text-red-400 border-red-500/30" 
                    : "bg-[#1e1e1e] text-gray-400 border-[#2a2a2a] hover:bg-[#252525]"
                }`}
                onClick={() => {
                  setSelectedSide("sell");
                  handleInputChange('Type', "sell");
                }}
              >
                <FontAwesomeIcon icon={faArrowTrendDown} className="text-xs" />
                Short
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Entry Price"
              value={tradeEntry.OpenPrice || ""}
              onChange={(value) => handleInputChange("OpenPrice", value)}
              placeholder="0.00"
            />
            <InputField
              label={marketType === "FOREX" ? "Lot Size" : "Quantity"}
              value={tradeEntry.Size || tradeEntry.quantity || ""}
              onChange={(value) => handleInputChange("Size", value)}
              placeholder="0.00"
            />
          </div>

          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Entry Date & Time</p>
                <p className="text-sm font-semibold text-emerald-400 mt-1">
                  {formatDateForDisplay(tradeEntry.OpenTime || "")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDateTimePickerFor(`open-${tradeEntry.id || 'edit'}`)}
                className="w-10 h-10 rounded-xl bg-[#252525] hover:bg-emerald-500/20 flex items-center justify-center transition-colors duration-200 group"
              >
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 group-hover:text-emerald-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Trade Status</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  tradeEntry.status === "completed"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-[#1e1e1e] text-gray-400 border-[#2a2a2a] hover:bg-[#252525]"
                } ${!tradeEntry.OpenPrice ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => toggleEntryStatus("completed")}
                disabled={!tradeEntry.OpenPrice}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                Completed
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  tradeEntry.status === "pending"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-[#1e1e1e] text-gray-400 border-[#2a2a2a] hover:bg-[#252525]"
                } ${!tradeEntry.OpenPrice ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => toggleEntryStatus("pending")}
                disabled={!tradeEntry.OpenPrice}
              >
                <FontAwesomeIcon icon={faClock} className="text-xs" />
                Pending
              </button>
            </div>
          </div>

          {(tradeEntry.status === "completed" || tradeEntry.status === "pending") && (
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Stop Loss"
                value={tradeEntry.StopLoss || ""}
                onChange={(value) => handleInputChange("StopLoss", value)}
                placeholder="Optional"
              />
              <InputField
                label="Take Profit"
                value={tradeEntry.TakeProfit || ""}
                onChange={(value) => handleInputChange("TakeProfit", value)}
                placeholder="Optional"
              />
            </div>
          )}

          {tradeEntry.status === "completed" && (
            <>
              <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Close Date & Time</p>
                    <p className="text-sm font-semibold text-emerald-400 mt-1">
                      {tradeEntry.CloseTime ? formatDateForDisplay(tradeEntry.CloseTime) : "Not set"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDateTimePickerFor(`close-${tradeEntry.id || 'edit'}`)}
                    className="w-10 h-10 rounded-xl bg-[#252525] hover:bg-emerald-500/20 flex items-center justify-center transition-colors duration-200 group"
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 group-hover:text-emerald-400" />
                  </button>
                </div>
              </div>

              <InputField
                label="Close Price"
                value={tradeEntry.ClosePrice || ""}
                onChange={(value) => handleInputChange("ClosePrice", value)}
                placeholder="0.00"
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Commission"
              value={tradeEntry.Commission || ""}
              onChange={(value) => handleInputChange("Commission", value)}
              placeholder="Optional"
            />
            <InputField
              label="Swap / Fees"
              value={tradeEntry.Swap || ""}
              onChange={(value) => handleInputChange("Swap", value)}
              placeholder="Optional"
            />
          </div>

          <CustomDateTimePicker
            isOpen={showDateTimePickerFor === `open-${tradeEntry.id || 'edit'}`}
            onClose={() => setShowDateTimePickerFor(null)}
            onApply={(value) => handleDateChange('OpenTime', value)}
          />
          <CustomDateTimePicker
            isOpen={showDateTimePickerFor === `close-${tradeEntry.id || 'edit'}`}
            onClose={() => setShowDateTimePickerFor(null)}
            onApply={(value) => handleDateChange('CloseTime', value)}
          />
        </div>

        <div className="px-6 py-4 border-t border-[#2a2a2a]">
          <button
            type="button"
            onClick={handleEntrySubmit}
            disabled={!isFormValid() || isSubmitting}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              isFormValid() && !isSubmitting
                ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                : "bg-[#1e1e1e] text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : (
              "Update Trade"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTradePopUp;
