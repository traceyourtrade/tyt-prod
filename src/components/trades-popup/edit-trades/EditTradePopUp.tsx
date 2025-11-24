'use client';

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faCheckCircle, faClock, faClose } from "@fortawesome/free-solid-svg-icons";
// Import symbol data for profit calculation and symbol dropdown
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
  conversionRate?: number;
}

// --- Helper Functions ---
const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return new Date().toLocaleString();
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", options)
    .format(date)
    .replace(/(\d+:\d+)/, " - $1");
};

const isValidDecimal = (value: string) => {
  return value === "" || /^\d*\.?\d*$/.test(value);
};

// --- Profit Calculation Functions ---
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

// --- Main Component ---
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

  // --- Symbol Dropdown State and Refs ---
  const [openSymbolDropdown, setOpenSymbolDropdown] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState("");
  const symbolInputRef = useRef<HTMLDivElement>(null);
  const symbolDropdownRef = useRef<HTMLDivElement>(null);

  // --- Effect for Closing Symbol Dropdown on Outside Click ---
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

  // --- Effect for Closing Main Popup on Outside Click ---
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

  // --- Initialization Effect ---
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

  // --- Symbol Filtering Helper ---
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

  // --- Input Change Handler ---
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

  // --- Date Change Handlers ---
  const handleDateChange = (dateType: 'OpenTime' | 'CloseTime', newDateISOString: string) => {
    setTradeEntry(prev => {
      if (!prev) return prev;
      if (dateType === 'OpenTime') {
        const updatedEntry = { ...prev, OpenTime: newDateISOString };
        const openDate = new Date(newDateISOString);
        updatedEntry.date = openDate.toISOString().slice(0, 10);
        updatedEntry.time = openDate.toTimeString().slice(0, 8);
        return updatedEntry;
      } else if (dateType === 'CloseTime') {
        return { ...prev, CloseTime: newDateISOString };
      }
      return prev;
    });
    setShowDateTimePickerFor(null);
  };

  // --- Status Toggle Handlers ---
  const toggleEntryStatus = (status: string) => {
    setTradeEntry(prev => {
      if (!prev) return prev;
      return { ...prev, status };
    });
  };

  // --- Validation ---
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

  // --- Submission Handler ---
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

    } catch (error) {
      console.error("Error submitting edited trade:", error);
      setAlertBoxG(`An error occurred while updating the trade: ${error.message}`, "error");
    } finally {
      setIsSubmitting(false);
      setShowEditTradePopUp(false);
    }
  };

  // --- Render Logic ---
  if (!showEditTradePopUp || !tradeEntry) {
    return null;
  }

  const marketType = tradeEntry.marketType || tradeEntry.market || "N/A";
  const symbol = tradeEntry.Item || tradeEntry.symbol || "N/A";

  return (
    <div className={`fixed w-screen h-screen top-0 left-0 bg-[#00000064] z-[1000] flex flex-col items-center justify-center ${showEditTradePopUp ? "flex" : "hidden"}`}>
      <div 
        className="w-[35%] h-[90%] p-5 overflow-y-auto flex flex-col justify-around bg-[rgba(34,33,33,0.379)] backdrop-blur-[30px] rounded-[25px]"
        ref={popupRef}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Edit Trade</h2>
          <button 
            className="bg-transparent border-none cursor-pointer p-2 text-[#aaaaaa]"
            onClick={() => setShowEditTradePopUp(false)}
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="etp-form-section">
          {/* Market Display */}
          <div className="flex items-center gap-6 mb-3">
            <label className="w-[90px] text-[12px] font-[500] text-white">Market</label>
            <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center">
              <input
                type="text"
                className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                value={marketType}
                readOnly
                disabled
              />
            </div>
          </div>

          {/* Symbol Selection with Search */}
          <div className="flex items-center gap-6 mb-3">
            <label className="w-[90px] text-[12px] font-[500] text-white">Symbol</label>
            <div
              className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center relative"
              ref={symbolInputRef}
              onFocus={() => {
                const marketType = tradeEntry?.marketType || "";
                if (marketType && marketType !== "OTHER") {
                  setOpenSymbolDropdown(true);
                }
              }}
            >
              <input
                type="text"
                className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                placeholder="Search symbol..."
                value={tradeEntry.symbol || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSymbolSearch(value);
                  handleInputChange("symbol", value);
                  setOpenSymbolDropdown(true);
                }}
              />

              {/* Dropdown */}
              {openSymbolDropdown && (
                <div
                  className="absolute top-full left-0 w-full max-h-[200px] bg-[#2a2a2a] rounded-[8px] mt-1 shadow-lg z-10 overflow-auto"
                  ref={symbolDropdownRef}
                  style={{ display: filteredSymbols().length ? "block" : "none" }}
                >
                  {filteredSymbols().map((symbolData, index) => (
                    <div
                      key={`${symbolData.symbol}-${index}`}
                      className="px-4 py-2 cursor-pointer text-[#cccccc] border-b border-[#333333] hover:bg-[#333333] hover:text-white"
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
                      {symbolData.symbol}
                    </div>
                  ))}
                  {filteredSymbols().length === 0 && symbolSearch && (
                    <div className="px-4 py-2 text-[#cccccc] border-b border-[#333333]">
                      No symbols found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="w-full h-[1px] bg-gray-500 my-3"></div>

          {/* Side Selection */}
          <div className="flex items-center gap-6 mb-3">
            <label className="w-[90px] text-[12px] font-[500] text-white">TYPE</label>
            <div className="flex gap-2 flex-1">
              <button
                type="button"
                className={`flex-1 px-3 py-3 rounded-[8px] text-center font-bold text-[0.75rem] border-none cursor-pointer ${
                  selectedSide === "buy" 
                    ? "bg-[#2f4f26] text-[#66ff66]" 
                    : "bg-[#2a2a2a] text-white"
                }`}
                onClick={() => {
                  setSelectedSide("buy");
                  handleInputChange('Type', "buy");
                }}
              >
                Buy (long)
              </button>
              <button
                type="button"
                className={`flex-1 px-3 py-3 rounded-[8px] text-center font-bold text-[0.75rem] border-none cursor-pointer ${
                  selectedSide === "sell" 
                    ? "bg-[#4f2626] text-[#ff6666]" 
                    : "bg-[#2a2a2a] text-white"
                }`}
                onClick={() => {
                  setSelectedSide("sell");
                  handleInputChange('Type', "sell");
                }}
              >
                Sell (Short)
              </button>
            </div>
          </div>

          {/* Entry Price */}
          <div className="flex items-center gap-6 mb-3">
            <label className="w-[90px] text-[12px] font-[500] text-white">Entry Price</label>
            <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center">
              <input
                type="text"
                className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                placeholder="Enter Entry Price"
                value={tradeEntry.OpenPrice || ""}
                onChange={(e) => handleInputChange("OpenPrice", e.target.value)}
              />
            </div>
          </div>

          {/* Entry Date Picker */}
          <div className="flex justify-between items-center mt-4 mb-4">
            <div>
              <div className="text-[0.75rem] text-white">Entry Date and Time</div>
              <div className="text-[0.9rem] font-bold text-[#4d6aff]">
                {formatDateForDisplay(tradeEntry.OpenTime || "")}
              </div>
            </div>
            <div onClick={() => setShowDateTimePickerFor(`open-${tradeEntry.id || 'edit'}`)}>
              <label className="bg-[#2a2a2a] border-none rounded-[50%] p-2 cursor-pointer w-[35px] h-[35px] text-[#d4d4d4] flex items-center justify-center">
                <FontAwesomeIcon icon={faCalendarAlt} />
              </label>
            </div>
          </div>

          {/* Lot Size / Contract Size */}
          <div className="flex items-center gap-6 mb-3">
            <label className="w-[90px] text-[12px] font-[500] text-white">
              {marketType === "FOREX" ? "Lot Size" :
                marketType === "CRYPTO" || marketType.includes("STOCK") ? "Quantity" :
                  "Contract Size"}
            </label>
            <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center">
              <input
                type="text"
                className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                placeholder="Enter size"
                value={tradeEntry.Size || tradeEntry.quantity || ''}
                onChange={(e) => handleInputChange("Size", e.target.value)}
              />
            </div>
          </div>

          {/* Status Display/Selection */}
          <div className="flex justify-between items-center mt-4 mb-4">
            <div>
              <div className="text-[0.75rem] text-white">Status</div>
              <div className="text-[0.9rem] font-bold text-[#aaaaaa]">
                {tradeEntry.status === "completed"
                  ? "Completed"
                  : tradeEntry.status === "pending"
                    ? "Pending"
                    : "Waiting for entry"}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`bg-[#2a2a2a] border-none rounded-[50%] p-2 cursor-pointer w-[35px] h-[35px] flex items-center justify-center ${
                  !tradeEntry.OpenPrice ? "cursor-not-allowed text-[#555555]" : ""
                }`}
                onClick={() => toggleEntryStatus("completed")}
                disabled={!tradeEntry.OpenPrice}
                style={{
                  color: tradeEntry.status === "completed" ? "#66ff66" : "#474747",
                }}
              >
                <FontAwesomeIcon icon={faCheckCircle} />
              </button>
              <button
                type="button"
                className={`bg-[#2a2a2a] border-none rounded-[50%] p-2 cursor-pointer w-[35px] h-[35px] flex items-center justify-center ${
                  !tradeEntry.OpenPrice ? "cursor-not-allowed text-[#555555]" : ""
                }`}
                onClick={() => toggleEntryStatus("pending")}
                disabled={!tradeEntry.OpenPrice}
                style={{
                  color: tradeEntry.status === "pending" ? "#4d6aff" : "#474747",
                }}
              >
                <FontAwesomeIcon icon={faClock} />
              </button>
            </div>
          </div>

          {/* Conditional Fields based on Status */}
          {(tradeEntry.status === "completed" || tradeEntry.status === "pending") && (
            <>
              {/* Stop Loss */}
              <div className="flex items-center gap-6 mb-3">
                <label className="w-[90px] text-[12px] font-[500] text-white">Stop Loss</label>
                <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center">
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                    placeholder="(Optional)"
                    value={tradeEntry.StopLoss || ""}
                    onChange={(e) => handleInputChange("StopLoss", e.target.value)}
                  />
                </div>
              </div>

              {/* Take Profit / Target Price */}
              <div className="flex items-center gap-6 mb-3">
                <label className="w-[90px] text-[12px] font-[500] text-white">Take Profit / Target Price</label>
                <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center">
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                    placeholder="(Optional)"
                    value={tradeEntry.TakeProfit || ""}
                    onChange={(e) => handleInputChange("TakeProfit", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {tradeEntry.status === "completed" && (
            <>
              {/* Close Date Picker */}
              <div className="flex justify-between items-center mt-4 mb-4">
                <div>
                  <div className="text-[0.75rem] text-white">Close Date and Time</div>
                  <div className="text-[0.9rem] font-bold text-[#4d6aff]">
                    {tradeEntry.CloseTime ? formatDateForDisplay(tradeEntry.CloseTime) : "N/A"}
                  </div>
                </div>
                <div onClick={() => setShowDateTimePickerFor(`close-${tradeEntry.id || 'edit'}`)}>
                  <label className="bg-[#2a2a2a] border-none rounded-[50%] p-2 cursor-pointer w-[35px] h-[35px] text-[#d4d4d4] flex items-center justify-center">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                  </label>
                </div>
              </div>

              {/* Close Price */}
              <div className="flex items-center gap-6 mb-3">
                <label className="w-[90px] text-[12px] font-[500] text-white">Close Price</label>
                <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center">
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                    placeholder="Enter close price"
                    value={tradeEntry.ClosePrice || ""}
                    onChange={(e) => handleInputChange("ClosePrice", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Commission */}
          <div className="flex items-center gap-6 mb-3">
            <label className="w-[90px] text-[12px] font-[500] text-white">Commission</label>
            <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center">
              <input
                type="text"
                className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                placeholder="(Optional)"
                value={tradeEntry.Commission || ""}
                onChange={(e) => handleInputChange("Commission", e.target.value)}
              />
            </div>
          </div>

          {/* Swap */}
          <div className="flex items-center gap-6 mb-3">
            <label className="w-[90px] text-[12px] font-[500] text-white">Swap / Other Fees</label>
            <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-4 py-2 flex items-center">
              <input
                type="text"
                className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                placeholder="(Optional)"
                value={tradeEntry.Swap || ""}
                onChange={(e) => handleInputChange("Swap", e.target.value)}
              />
            </div>
          </div>

          {/* Date Pickers */}
          <CustomDateTimePicker
            isOpen={showDateTimePickerFor === `open-${tradeEntry.id || 'edit'}`}
            onClose={() => setShowDateTimePickerFor(null)}
            onApply={(value) => handleDateChange('OpenTime', value)}
            initialDateTime={tradeEntry.OpenTime ? new Date(tradeEntry.OpenTime) : new Date()}
          />
          <CustomDateTimePicker
            isOpen={showDateTimePickerFor === `close-${tradeEntry.id || 'edit'}`}
            onClose={() => setShowDateTimePickerFor(null)}
            onApply={(value) => handleDateChange('CloseTime', value)}
            initialDateTime={tradeEntry.CloseTime ? new Date(tradeEntry.CloseTime) : new Date()}
          />
        </div>

        {/* Submit Button */}
        <SubmitButton
          handleSubmit={handleEntrySubmit}
          disabled={!isFormValid()}
          isSubmitting={isSubmitting}
          label="Update Trade"
        />
      </div>
    </div>
  );
};

export default EditTradePopUp;