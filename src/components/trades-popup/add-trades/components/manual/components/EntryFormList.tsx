'use client';

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import StatusControls from "./StatusControls";
import symbols from "./symbols/Forex";
import usStocks from "./symbols/USAStock";
import indianStocks from "./symbols/IndianStocks";
import crypto from "./symbols/Crypto";
import CustomDateTimePicker from "../../../custom date picker/CustomDateTimePicker";
interface Entry {
  id: number;
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
  otherCharges?: string;
}

interface EntryFormListProps {
  entries: Entry[];
  selectedSide: string;
  setSelectedSide: (side: string) => void;
  updateEntryValue: (id: number, field: string, value: string) => void;
  toggleEntryStatus: (id: number, status: string) => void;
  showDateTimePickerFor: string | null;
  setShowDateTimePickerFor: (id: string | null) => void;
  setEntries: (entries: Entry[] | ((prev: Entry[]) => Entry[])) => void;
}

interface Symbol {
  symbol: string;
  name: string;
  market?: string;
  curr?: string;
  conversionRate?: number;
}

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

const removeEntryAndReindex = (entries: Entry[], idToRemove: number) => {
  const filtered = entries.filter((item) => item.id !== idToRemove);
  return filtered.map((item, index) => ({ ...item, id: index + 1 }));
};

const isValidDecimal = (value: string) => {
  return value === "" || /^\d*\.?\d*$/.test(value);
};

const EntryFormList: React.FC<EntryFormListProps> = ({
  entries,
  selectedSide,
  setSelectedSide,
  updateEntryValue,
  toggleEntryStatus,
  showDateTimePickerFor,
  setShowDateTimePickerFor,
  setEntries,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [symbolSearch, setSymbolSearch] = useState("");
  const symbolInputRef = useRef<HTMLDivElement>(null);
  const symbolDropdownRef = useRef<HTMLDivElement>(null);

  const [market, setMarket] = useState("SELECT MARKET");
  const [marketOpen, setMarketOpen] = useState(false);

  const markets = [
    "CRYPTO",
    "FOREX",
    "INDIAN STOCKS",
    "US STOCKS"
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        symbolInputRef.current &&
        !symbolInputRef.current.contains(event.target as Node) &&
        symbolDropdownRef.current &&
        !symbolDropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const separator = () => <div className="w-full h-[1px] bg-gray-500 my-[12px]"></div>;

  const handleInputChange = (id: number, field: string, value: string, val2?: string, val3?: string) => {
    if (field !== "symbol" && !isValidDecimal(value)) {
      return;
    }

    setEntries(prevEntries => {
      return prevEntries.map(eObj =>
        eObj.id === id
          ? {
            ...eObj,
            ...(val2 !== undefined && { "market": val2 }),
            ...(val3 !== undefined && { "curr": val3 }),
            [field]: value
          }
          : eObj
      );
    });
  };

  const filteredSymbols = (marketType: string): Symbol[] => {
    if (marketType === "FOREX") {
      return symbols.filter((symbol) =>
        symbol.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
        symbol.name.toLowerCase().includes(symbolSearch.toLowerCase())
      );
    } else if (marketType === "US STOCKS") {
      return usStocks.filter((symbol) =>
        symbol.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
        symbol.name.toLowerCase().includes(symbolSearch.toLowerCase())
      );
    } else if (marketType === "CRYPTO") {
      return crypto.filter((symbol) =>
        symbol.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
        symbol.name.toLowerCase().includes(symbolSearch.toLowerCase())
      );
    } else if (marketType === "INDIAN STOCKS") {
      return indianStocks.filter((symbol) =>
        symbol.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
        symbol.name.toLowerCase().includes(symbolSearch.toLowerCase())
      );
    } else {
      return [];
    }
  };

  return (
    <>
      {/* Market Selection */}
      <div className="flex items-center gap-[24px] mb-[12px]">
        <label className="w-[90px] text-[12px] font-[500] text-white">Market</label>
        <div className="relative w-full">
          <button 
            className="w-full px-[16px] py-[12px] bg-[#2a2a2a] text-white border-none rounded-[8px] text-[14px] flex justify-between items-center cursor-pointer font-[500]"
            onClick={() => setMarketOpen(!marketOpen)}
          >
            <span className="flex items-center">
              <span>{market}</span>
            </span>
            <FontAwesomeIcon icon={faChevronDown} />
          </button>

          {marketOpen && (
            <div className="absolute top-full left-0 w-full max-h-[200px] bg-[#2a2a2a] rounded-[8px] mt-[4px] shadow-lg z-10 overflow-auto">
              {markets.map((marketItem, index) => (
                <div
                  key={index}
                  className="px-[16px] py-[8px] cursor-pointer text-[#cccccc] border-b border-[#333333] hover:bg-[#333333] hover:text-white"
                  onClick={() => {
                    setMarket(marketItem);
                    setMarketOpen(false);
                  }}
                >
                  {marketItem}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {Array.isArray(entries) &&
        entries.map((entry) => {
          const isOpen = openDropdownId === entry.id;

          return (
            <React.Fragment key={entry.id}>
              {separator()}

              <div className="atp-entry-group">
                <h3 className="text-white mb-[10px] ml-[10px]">Trade {entry.id}</h3>

                {/* Entry Value Input */}
                <div className="flex items-center gap-[24px] mb-[12px]">
                  <label className="w-[90px] text-[12px] font-[500] text-white">Entry Price</label>
                  <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                      placeholder="Enter Value"
                      value={entry.value}
                      onChange={(e) =>
                        handleInputChange(entry.id, "value", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Entry Date Picker */}
                <div className="flex justify-between items-center mt-[16px] mb-[16px]">
                  <div>
                    <div className="text-[0.75rem] text-white">Date and Time</div>
                    <div className="text-[0.9rem] font-bold text-[#4d6aff]">
                      {formatDateForDisplay(entry.date)}
                    </div>
                  </div>
                  <div onClick={() => setShowDateTimePickerFor(`date-${entry.id}`)}>
                    <label className="bg-[#2a2a2a] border-none rounded-[50%] p-[8px_12px] cursor-pointer w-[35px] h-[35px] text-[#d4d4d4] flex items-center justify-center" style={{ cursor: "pointer" }}>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                    </label>
                  </div>
                </div>

                {/* Side Selection */}
                <div className="flex items-center gap-[24px] mb-[12px]">
                  <label className="w-[90px] text-[12px] font-[500] text-white">TYPE</label>
                  <div className="flex gap-[8px] flex-1">
                    <button
                      className={`flex-1 px-[12px] py-[12px] rounded-[8px] text-center font-bold text-[0.75rem] border-none cursor-pointer ${
                        selectedSide === "buy" 
                          ? "bg-[#2f4f26] text-[#66ff66]" 
                          : "bg-[#2a2a2a] text-white"
                      }`}
                      onClick={() => setSelectedSide("buy")}
                    >
                      Buy (long)
                    </button>
                    <button
                      className={`flex-1 px-[12px] py-[12px] rounded-[8px] text-center font-bold text-[0.75rem] border-none cursor-pointer ${
                        selectedSide === "sell" 
                          ? "bg-[#4f2626] text-[#ff6666]" 
                          : "bg-[#2a2a2a] text-white"
                      }`}
                      onClick={() => setSelectedSide("sell")}
                    >
                      Sell (Short)
                    </button>
                  </div>
                </div>

                {/* Symbol Field */}
                <div className="flex items-center gap-[24px] mb-[12px]">
                  <label className="w-[90px] text-[12px] font-[500] text-white">Symbol</label>
                  <div
                    className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center relative"
                    ref={symbolInputRef}
                    onFocus={() => setOpenDropdownId(entry.id)}
                  >
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                      placeholder="Search symbol..."
                      value={entry.symbol || ""}
                      onChange={(e) => {
                        setSymbolSearch(e.target.value);
                        handleInputChange(entry.id, "symbol", e.target.value);
                        setOpenDropdownId(entry.id);
                      }}
                      style={market === "SELECT MARKET" ? { cursor: "not-allowed", opacity: "0.8" } : {}}
                      disabled={market === "SELECT MARKET"}
                    />
                    {isOpen && (
                      <div
                        className="absolute top-full left-0 w-full max-h-[200px] bg-[#2a2a2a] rounded-[8px] mt-[4px] shadow-lg z-10 overflow-auto"
                        ref={symbolDropdownRef}
                        style={{ display: filteredSymbols(market).length ? "block" : "none" }}
                      >
                        {filteredSymbols(market).map((symbol, index) => (
                          <div
                            key={index}
                            className="px-[16px] py-[8px] cursor-pointer text-[#cccccc] border-b border-[#333333] hover:bg-[#333333] hover:text-white"
                            onClick={() => {
                              handleInputChange(entry.id, "symbol", symbol.symbol, symbol.market, symbol.curr);
                              setSymbolSearch("");
                              setOpenDropdownId(null);
                            }}
                          >
                            {symbol.symbol}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contract Size */}
                <div className="flex items-center gap-[24px] mb-[12px]">
                  <label className="w-[90px] text-[12px] font-[500] text-white">
                    {market === "FOREX" ? "LOT SIZE" :
                     market === "US STOCKS" ? "Quantity" :
                     market === "CRYPTO" ? "Quantity" :
                     market === "INDIAN STOCKS" ? "Quantity" :
                     "Contract Size"}
                  </label>
                  <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                      placeholder={`Enter ${
                        market === "FOREX" ? "LOT SIZE" :
                        market === "US STOCKS" ? "QUANTITY" :
                        market === "CRYPTO" ? "QUANTITY" :
                        market === "INDIAN STOCKS" ? "QUANTITY" :
                        "Contract Size"
                      }`}
                      value={market === "CRYPTO" ? entry.quantity : entry.contractSize}
                      onChange={(e) => handleInputChange(
                        entry.id,
                        market === "CRYPTO" ? "quantity" : "contractSize",
                        e.target.value
                      )}
                    />
                  </div>
                </div>

                {/* Status Controls */}
                <StatusControls
                  status={entry.status}
                  value={entry.value}
                  onSetStatusStarted={() => toggleEntryStatus(entry.id, "completed")}
                  onSetStatusPending={() => toggleEntryStatus(entry.id, "pending")}
                  onDelete={() => setEntries(removeEntryAndReindex(entries, entry.id))}
                />

                {/* Conditional Fields */}
                {entry.status === "completed" && (
                  <>
                    {/* Close Date Picker */}
                    <div className="flex justify-between items-center mt-[16px] mb-[16px]">
                      <div>
                        <div className="text-[0.75rem] text-white">Close Date and Time</div>
                        <div className="text-[0.9rem] font-bold text-[#4d6aff]">
                          {formatDateForDisplay(entry.closeDate || "")}
                        </div>
                      </div>
                      <div onClick={() => setShowDateTimePickerFor(`close-${entry.id}`)}>
                        <label className="bg-[#2a2a2a] border-none rounded-[50%] p-[8px_12px] cursor-pointer w-[35px] h-[35px] text-[#d4d4d4] flex items-center justify-center" style={{ cursor: "pointer" }}>
                          <FontAwesomeIcon icon={faCalendarAlt} />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-[24px] mb-[12px]">
                      <label className="w-[90px] text-[12px] font-[500] text-white">Close Price</label>
                      <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                        <input
                          type="text"
                          className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                          placeholder="Enter close price"
                          value={entry.closePrice}
                          onChange={(e) => handleInputChange(entry.id, "closePrice", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-[24px] mb-[12px]">
                      <label className="w-[90px] text-[12px] font-[500] text-white">Target Price</label>
                      <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                        <input
                          type="text"
                          className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                          placeholder="(Optional)"
                          value={entry.targetPrice}
                          onChange={(e) => handleInputChange(entry.id, "targetPrice", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-[24px] mb-[12px]">
                      <label className="w-[90px] text-[12px] font-[500] text-white">Stop Loss</label>
                      <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                        <input
                          type="text"
                          className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                          placeholder="(Optional)"
                          value={entry.stopLoss}
                          onChange={(e) => handleInputChange(entry.id, "stopLoss", e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {entry.status === "pending" && (
                  <>
                    <div className="flex items-center gap-[24px] mb-[12px]">
                      <label className="w-[90px] text-[12px] font-[500] text-white">Target Price</label>
                      <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                        <input
                          type="text"
                          className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                          placeholder="(Optional)"
                          value={entry.targetPrice}
                          onChange={(e) => handleInputChange(entry.id, "targetPrice", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-[24px] mb-[12px]">
                      <label className="w-[90px] text-[12px] font-[500] text-white">Stop Loss</label>
                      <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                        <input
                          type="text"
                          className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                          placeholder="(Optional)"
                          value={entry.stopLoss}
                          onChange={(e) => handleInputChange(entry.id, "stopLoss", e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Commission */}
                <div className="flex items-center gap-[24px] mb-[12px]">
                  <label className="w-[90px] text-[12px] font-[500] text-white">Commission</label>
                  <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                      placeholder="(Optional)"
                      value={entry.commission}
                      onChange={(e) => handleInputChange(entry.id, "commission", e.target.value)}
                    />
                  </div>
                </div>

                {/* Other Charges */}
                <div className="flex items-center gap-[24px] mb-[12px]">
                  <label className="w-[90px] text-[12px] font-[500] text-white">Other Charges</label>
                  <div className="flex-1 bg-[#2a2a2a] rounded-[8px] px-[16px] py-[8px] flex items-center">
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none w-full text-[12px] text-white font-[500] uppercase"
                      placeholder="(Optional)"
                      value={entry.otherCharges}
                      onChange={(e) => handleInputChange(entry.id, "otherCharges", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Date Pickers */}
              <CustomDateTimePicker
                isOpen={showDateTimePickerFor === `date-${entry.id}`}
                onClose={() => setShowDateTimePickerFor(null)}
                onApply={(value) =>
                  setEntries(
                    entries.map((e) =>
                      e.id === entry.id ? { ...e, date: value } : e
                    )
                  )
                }
              />
              <CustomDateTimePicker
                isOpen={showDateTimePickerFor === `close-${entry.id}`}
                onClose={() => setShowDateTimePickerFor(null)}
                onApply={(value) =>
                  setEntries(
                    entries.map((e) =>
                      e.id === entry.id ? { ...e, closeDate: value } : e
                    )
                  )
                }
              />
            </React.Fragment>
          );
        })}

      {/* Add New Entry Button */}
      <div className="flex items-center justify-between gap-[24px] mb-[12px]">
        <div className="text-[1rem] font-bold text-white">Entries</div>
        <button
          className="bg-white text-[#1e1e1e] text-[0.75rem] font-bold px-[12px] py-[8px] rounded-[999px] border-none cursor-pointer float-right"
          onClick={() => {
            const getNextId = (arr: Entry[]) =>
              arr.length ? Math.max(...arr.map((item) => item.id)) + 1 : 1;
            const newEntry: Entry = {
              id: getNextId(entries),
              value: "",
              status: "waiting",
              date: new Date().toISOString().slice(0, 16),
              closeDate: new Date().toISOString().slice(0, 16),
              closePrice: "",
              targetPrice: "",
              stopLoss: "",
              symbol: "",
              contractSize: "",
              commission: "",
              otherCharges: "",
              quantity: "",
            };
            setEntries([...entries, newEntry]);
          }}
        >
          +Add
        </button>
      </div>
    </>
  );
};

export default EntryFormList;