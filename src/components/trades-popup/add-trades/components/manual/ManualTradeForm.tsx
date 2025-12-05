'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Target,
  Shield,
  Plus,
  Trash2,
  ChevronDown,
  Clock,
  Check,
  Loader2,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import symbols from "./components/symbols/Forex";
import usStocks from "./components/symbols/USAStock";
import indianStocks from "./components/symbols/IndianStocks";
import crypto from "./components/symbols/Crypto";
import CustomDateTimePicker from "../../custom date picker/CustomDateTimePicker";

interface TradeEntry {
  id: string;
  symbol: string;
  market: string;
  currency: string;
  entryPrice: string;
  exitPrice: string;
  size: string;
  side: "buy" | "sell";
  status: "waiting" | "pending" | "completed";
  entryDate: string;
  exitDate: string;
  stopLoss: string;
  takeProfit: string;
  commission: string;
  otherCharges: string;
}

interface ManualTradeFormProps {
  selectedAccount: string;
  onClose: () => void;
}

const markets = [
  { id: "FOREX", label: "Forex", icon: "💱" },
  { id: "US STOCKS", label: "US Stocks", icon: "🇺🇸" },
  { id: "INDIAN STOCKS", label: "Indian Stocks", icon: "🇮🇳" },
  { id: "CRYPTO", label: "Crypto", icon: "₿" },
];

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "Select date";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ManualTradeForm({ selectedAccount, onClose }: ManualTradeFormProps) {
  const { selectedAccounts, setAccounts } = useAccountDetails();
  const { setAddTrades } = calendarPopUp();
  
  const [marketOpen, setMarketOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [trades, setTrades] = useState<TradeEntry[]>([{
    id: generateId(),
    symbol: "",
    market: "",
    currency: "USD",
    entryPrice: "",
    exitPrice: "",
    size: "",
    side: "buy",
    status: "completed",
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: new Date().toISOString().slice(0, 16),
    stopLoss: "",
    takeProfit: "",
    commission: "",
    otherCharges: "",
  }]);

  const [activeTradeId, setActiveTradeId] = useState(trades[0].id);
  const [symbolSearch, setSymbolSearch] = useState("");
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (marketRef.current && !marketRef.current.contains(e.target as Node)) {
        setMarketOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeTrade = trades.find(t => t.id === activeTradeId) || trades[0];
  const market = activeTrade.market;

  const setMarket = (newMarket: string) => {
    updateTrade(activeTrade.id, "market", newMarket);
  };

  const updateTrade = (id: string, field: keyof TradeEntry, value: string) => {
    setTrades(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const getSymbols = () => {
    const searchLower = symbolSearch.toLowerCase();
    let source: Array<{ symbol: string; name: string; market?: string; curr?: string }> = [];
    
    switch (market) {
      case "FOREX": source = symbols; break;
      case "US STOCKS": source = usStocks; break;
      case "INDIAN STOCKS": source = indianStocks; break;
      case "CRYPTO": source = crypto; break;
    }
    
    return source.filter(s => 
      s.symbol.toLowerCase().includes(searchLower) ||
      s.name.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  };

  const selectSymbol = (sym: { symbol: string; market?: string; curr?: string }) => {
    updateTrade(activeTrade.id, "symbol", sym.symbol);
    updateTrade(activeTrade.id, "market", sym.market || market);
    updateTrade(activeTrade.id, "currency", sym.curr || "USD");
    setSymbolSearch("");
    setShowSymbolDropdown(false);
  };

  const addNewTrade = () => {
    const newTrade: TradeEntry = {
      id: generateId(),
      symbol: "",
      market: "",
      currency: "USD",
      entryPrice: "",
      exitPrice: "",
      size: "",
      side: "buy",
      status: "completed",
      entryDate: new Date().toISOString().slice(0, 16),
      exitDate: new Date().toISOString().slice(0, 16),
      stopLoss: "",
      takeProfit: "",
      commission: "",
      otherCharges: "",
    };
    setTrades([...trades, newTrade]);
    setActiveTradeId(newTrade.id);
  };

  const removeTrade = (id: string) => {
    if (trades.length === 1) return;
    const newTrades = trades.filter(t => t.id !== id);
    setTrades(newTrades);
    if (activeTradeId === id) {
      setActiveTradeId(newTrades[0].id);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const account = selectedAccounts.find(a => a.accountName === selectedAccount);
      if (!account) throw new Error("Account not found");

      const newTradeData = trades.map(trade => {
        const entryPrice = parseFloat(trade.entryPrice) || 0;
        const exitPrice = parseFloat(trade.exitPrice) || 0;
        const size = parseFloat(trade.size) || 0;
        const commission = parseFloat(trade.commission) || 0;
        const otherCharges = parseFloat(trade.otherCharges) || 0;
        
        let profit = 0;
        if (trade.status === "completed" && exitPrice > 0) {
          if (trade.side === "buy") {
            profit = (exitPrice - entryPrice) * size - commission - otherCharges;
          } else {
            profit = (entryPrice - exitPrice) * size - commission - otherCharges;
          }
        }

        return {
          date: trade.entryDate.split('T')[0],
          time: trade.entryDate.split('T')[1] || "00:00",
          OpenTime: trade.entryDate,
          Ticket: Math.floor(Math.random() * 1000000),
          Item: trade.symbol,
          Type: trade.side,
          marketType: trade.market || market,
          Size: trade.size,
          status: trade.status,
          Currency: trade.currency,
          OpenPrice: entryPrice,
          StopLoss: parseFloat(trade.stopLoss) || null,
          TakeProfit: parseFloat(trade.takeProfit) || null,
          CloseTime: trade.exitDate,
          ClosePrice: exitPrice,
          Commission: commission,
          Swap: 0,
          Profit: profit,
          Strategy: "",
          RiskR: "",
          Quality: { select: false, high: false, medium: false, low: false },
        };
      });

      const existingTradeData = account.tradeData || [];
      const updatedTradeData = [...existingTradeData, ...newTradeData];

      const response = await fetch("/api/trades/edit-trade", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          accountName: selectedAccount,
          tradeData: updatedTradeData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save trade");

      setShowSuccess(true);
      await setAccounts();
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Error saving trade:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-card/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-16 h-16 rounded-full bg-profit/20 flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-profit" />
              </motion.div>
              <p className="text-lg font-semibold text-foreground">Trade Added!</p>
              <p className="text-sm text-muted-foreground">Your trade has been recorded</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Selector */}
      <div ref={marketRef} className="relative">
        <label className="block text-xs font-medium text-muted-foreground mb-2">Market</label>
        <button
          onClick={() => setMarketOpen(!marketOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground hover:bg-muted/50 transition-colors"
        >
          <span className={cn("text-sm", !market && "text-muted-foreground")}>
            {market ? markets.find(m => m.id === market)?.label : "Select market"}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", marketOpen && "rotate-180")} />
        </button>
        
        <AnimatePresence>
          {marketOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
            >
              {markets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMarket(m.id);
                    setMarketOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-muted/50 transition-colors",
                    market === m.id && "bg-primary/10 text-primary"
                  )}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trade Tabs (for multiple trades) */}
      {trades.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {trades.map((trade, index) => (
            <div
              key={trade.id}
              onClick={() => setActiveTradeId(trade.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0 cursor-pointer",
                activeTradeId === trade.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              Trade {index + 1}
              {trades.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrade(trade.id);
                  }}
                  className="w-4 h-4 rounded-full hover:bg-loss/20 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </span>
              )}
            </div>
          ))}
          <button
            onClick={addNewTrade}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      )}

      {/* Trade Form Card */}
      <div className="bg-muted/20 border border-border/30 rounded-xl p-4 space-y-4">
        {/* Symbol Search */}
        <div className="relative">
          <label className="block text-xs font-medium text-muted-foreground mb-2">Symbol</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={symbolInputRef}
              type="text"
              placeholder={market ? "Search symbol..." : "Select market first"}
              value={activeTrade.symbol || symbolSearch}
              onChange={(e) => {
                setSymbolSearch(e.target.value);
                updateTrade(activeTrade.id, "symbol", e.target.value);
                setShowSymbolDropdown(true);
              }}
              onFocus={() => market && setShowSymbolDropdown(true)}
              disabled={!market}
              className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>
          
          <AnimatePresence>
            {showSymbolDropdown && getSymbols().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto"
              >
                {getSymbols().map((sym) => (
                  <button
                    key={sym.symbol}
                    onClick={() => selectSymbol(sym)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-foreground">{sym.symbol}</span>
                    <span className="text-xs text-muted-foreground">{sym.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buy/Sell Toggle */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Direction</label>
          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
            <button
              onClick={() => updateTrade(activeTrade.id, "side", "buy")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTrade.side === "buy"
                  ? "bg-profit text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Buy (Long)
            </button>
            <button
              onClick={() => updateTrade(activeTrade.id, "side", "sell")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTrade.side === "sell"
                  ? "bg-loss text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingDown className="w-4 h-4" />
              Sell (Short)
            </button>
          </div>
        </div>

        {/* Price Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Entry Price</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="0.00"
                value={activeTrade.entryPrice}
                onChange={(e) => updateTrade(activeTrade.id, "entryPrice", e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              {market === "FOREX" ? "Lot Size" : "Quantity"}
            </label>
            <input
              type="text"
              placeholder="0.00"
              value={activeTrade.size}
              onChange={(e) => updateTrade(activeTrade.id, "size", e.target.value)}
              className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Entry Date & Time</label>
          <button
            onClick={() => setShowDatePicker(`entry-${activeTrade.id}`)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{formatDateForDisplay(activeTrade.entryDate)}</span>
            </div>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Trade Status</label>
          <div className="flex gap-2">
            {["waiting", "pending", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => updateTrade(activeTrade.id, "status", status)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-xs font-medium capitalize transition-all",
                  activeTrade.status === status
                    ? status === "completed" 
                      ? "bg-profit/20 text-profit border border-profit/30"
                      : status === "pending"
                      ? "bg-warning/20 text-warning border border-warning/30"
                      : "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/30 text-muted-foreground border border-transparent hover:border-border/50"
                )}
              >
                {status === "waiting" ? "Open" : status}
              </button>
            ))}
          </div>
        </div>

        {/* Closed Trade Fields */}
        {activeTrade.status === "completed" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-border/30"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Exit Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="0.00"
                    value={activeTrade.exitPrice}
                    onChange={(e) => updateTrade(activeTrade.id, "exitPrice", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Exit Date</label>
                <button
                  onClick={() => setShowDatePicker(`exit-${activeTrade.id}`)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground hover:bg-muted/50 transition-colors text-sm"
                >
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatDateForDisplay(activeTrade.exitDate)}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Optional Fields (Collapsible) */}
        <details className="group">
          <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            <span>Optional fields</span>
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Stop Loss
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={activeTrade.stopLoss}
                  onChange={(e) => updateTrade(activeTrade.id, "stopLoss", e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  <Target className="w-3 h-3 inline mr-1" />
                  Take Profit
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={activeTrade.takeProfit}
                  onChange={(e) => updateTrade(activeTrade.id, "takeProfit", e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  <Receipt className="w-3 h-3 inline mr-1" />
                  Commission
                </label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={activeTrade.commission}
                  onChange={(e) => updateTrade(activeTrade.id, "commission", e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Other Charges</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={activeTrade.otherCharges}
                  onChange={(e) => updateTrade(activeTrade.id, "otherCharges", e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Add Another Trade Button */}
      {trades.length === 1 && (
        <button
          onClick={addNewTrade}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border/50 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add another trade
        </button>
      )}

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitting || !activeTrade.symbol || !activeTrade.entryPrice}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "w-full py-4 rounded-xl text-sm font-semibold transition-all",
          isSubmitting || !activeTrade.symbol || !activeTrade.entryPrice
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            {trades.length > 1 ? `Add ${trades.length} Trades` : "Add Trade"}
          </span>
        )}
      </motion.button>

      {/* Date Pickers */}
      <CustomDateTimePicker
        isOpen={showDatePicker === `entry-${activeTrade.id}`}
        onClose={() => setShowDatePicker(null)}
        onApply={(value: Date) => updateTrade(activeTrade.id, "entryDate", value.toISOString().slice(0, 16))}
      />
      <CustomDateTimePicker
        isOpen={showDatePicker === `exit-${activeTrade.id}`}
        onClose={() => setShowDatePicker(null)}
        onApply={(value: Date) => updateTrade(activeTrade.id, "exitDate", value.toISOString().slice(0, 16))}
      />
    </div>
  );
}
