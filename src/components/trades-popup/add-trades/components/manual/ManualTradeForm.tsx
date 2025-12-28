'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Target,
  Shield,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  Receipt,
  AlertCircle,
  X,
  Sparkles,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAccountDetails from "@/store/accountdetails";
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
  onSubmitStateChange?: (isSubmitting: boolean, tradesCount: number, canSubmit: boolean) => void;
  submitTrigger?: number;
}

const markets = [
  { id: "FOREX", label: "Forex", icon: "💱", color: "from-blue-500/20 to-cyan-500/20" },
  { id: "US STOCKS", label: "US Stocks", icon: "🇺🇸", color: "from-red-500/20 to-blue-500/20" },
  { id: "INDIAN STOCKS", label: "Indian Stocks", icon: "🇮🇳", color: "from-orange-500/20 to-green-500/20" },
  { id: "CRYPTO", label: "Crypto", icon: "₿", color: "from-yellow-500/20 to-orange-500/20" },
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

export default function ManualTradeForm({ selectedAccount, onClose, onSubmitStateChange, submitTrigger }: ManualTradeFormProps) {
  const { selectedAccounts, setAccounts } = useAccountDetails();
  
  const [marketOpen, setMarketOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  
  const [trades, setTrades] = useState<TradeEntry[]>([{
    id: generateId(),
    symbol: "",
    market: "FOREX",
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
  const symbolDropdownRef = useRef<HTMLDivElement>(null);
  const prevSubmitTriggerRef = useRef(submitTrigger || 0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (marketRef.current && !marketRef.current.contains(e.target as Node)) {
        setMarketOpen(false);
      }
      if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(e.target as Node) &&
          symbolInputRef.current && !symbolInputRef.current.contains(e.target as Node)) {
        setShowSymbolDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notify parent of submit state changes
  useEffect(() => {
    if (onSubmitStateChange) {
      const canSubmit = validateForm() === null;
      onSubmitStateChange(isSubmitting, trades.length, canSubmit);
    }
  }, [isSubmitting, trades, onSubmitStateChange]);

  // Handle submit trigger from parent - only fire on actual changes
  useEffect(() => {
    if (submitTrigger && submitTrigger > prevSubmitTriggerRef.current) {
      prevSubmitTriggerRef.current = submitTrigger;
      handleSubmit();
    }
  }, [submitTrigger]);

  const activeTrade = trades.find(t => t.id === activeTradeId) || trades[0];
  const market = activeTrade.market;

  const setMarket = (newMarket: string) => {
    updateTrade(activeTrade.id, "market", newMarket);
    updateTrade(activeTrade.id, "symbol", "");
  };

  const updateTrade = (id: string, field: keyof TradeEntry, value: string) => {
    setTrades(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
    if (errorMessage) setErrorMessage(null);
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
    ).slice(0, 8);
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
      market: activeTrade.market || "FOREX",
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

  const validateForm = (): string | null => {
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      const tradeNum = trades.length > 1 ? ` (Trade ${i + 1})` : "";
      
      if (!trade.market) return `Please select a market${tradeNum}`;
      if (!trade.symbol.trim()) return `Please enter a symbol${tradeNum}`;
      if (!trade.size || parseFloat(trade.size) <= 0) return `Please enter a valid lot size${tradeNum}`;
      if (!trade.entryPrice || parseFloat(trade.entryPrice) <= 0) return `Please enter entry price${tradeNum}`;
      
      if (trade.status === "completed") {
        if (!trade.exitPrice || parseFloat(trade.exitPrice) <= 0) return `Please enter exit price for completed trade${tradeNum}`;
      }
    }
    return null;
  };

  const getContractSize = (market: string, symbol: string): number => {
    const upperSymbol = symbol.toUpperCase();
    const upperMarket = market.toUpperCase();
    
    // PRIORITY: Check for commodities by symbol FIRST
    // Gold/Silver may be listed under FOREX but need commodity contract sizes
    if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
      return 100; // Gold: 100 oz per lot
    }
    if (upperSymbol.includes("XAG") || upperSymbol.includes("SILVER")) {
      return 5000; // Silver: 5000 oz per lot
    }
    
    switch (market) {
      case "FOREX":
        return 100000; // 1 lot = 100,000 units
      case "CRYPTO":
        return 1; // Direct units
      case "INDIAN_STOCK":
      case "INDIAN_INDICES":
      case "STOCK":
      case "US_STOCK":
      case "US STOCKS":
      case "STOCKS":
        return 1; // Direct units for stocks
      case "COMMODITIES":
        if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
          return 100; // Gold: 100 oz per lot
        }
        if (upperSymbol.includes("XAG") || upperSymbol.includes("SILVER")) {
          return 5000; // Silver: 5000 oz per lot
        }
        return 100; // Default commodity lot size
      default:
        // Check if it's a stock-related market type
        if (upperMarket.includes("STOCK") || upperMarket.includes("EQUIT")) {
          return 1; // Direct units for any stock market
        }
        // Check for commodities by symbol
        if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
          return 100; // Gold: 100 oz per lot
        }
        if (upperSymbol.includes("XAG") || upperSymbol.includes("SILVER")) {
          return 5000; // Silver: 5000 oz per lot
        }
        // Default to direct units (1) for unknown markets - safer than assuming Forex
        return 1;
    }
  };

  const calculatePnL = (trade: TradeEntry): number => {
    const entryPrice = parseFloat(trade.entryPrice) || 0;
    const exitPrice = parseFloat(trade.exitPrice) || 0;
    const size = parseFloat(trade.size) || 0;
    const commission = parseFloat(trade.commission) || 0;
    const otherCharges = parseFloat(trade.otherCharges) || 0;
    
    if (trade.status !== "completed" || exitPrice === 0) return 0;
    
    const contractSize = getContractSize(trade.market, trade.symbol);
    const priceDiff = trade.side === "buy" 
      ? exitPrice - entryPrice 
      : entryPrice - exitPrice;
    
    let pnl = priceDiff * size * contractSize;
    
    // For non-USD quote currencies, convert P&L to USD
    // The quote currency (last 3 chars) determines what currency P&L is calculated in
    const upperSymbol = trade.symbol.toUpperCase();
    if (trade.market === "FOREX" && upperSymbol.length >= 6) {
      const quoteCurrency = upperSymbol.slice(-3);
      
      // Approximate conversion rates to USD (as of late 2024)
      // These are rough estimates - actual rates vary
      switch (quoteCurrency) {
        case "JPY":
          pnl = pnl / 150; // USD/JPY ~150
          break;
        case "CHF":
          pnl = pnl * 1.13; // USD/CHF ~0.88, so multiply by 1/0.88
          break;
        case "CAD":
          pnl = pnl * 0.71; // USD/CAD ~1.40, so multiply by 1/1.40
          break;
        case "GBP":
          pnl = pnl * 1.27; // GBP/USD ~1.27
          break;
        case "AUD":
          pnl = pnl * 0.62; // AUD/USD ~0.62
          break;
        case "NZD":
          pnl = pnl * 0.57; // NZD/USD ~0.57
          break;
        case "EUR":
          pnl = pnl * 1.04; // EUR/USD ~1.04
          break;
        // USD quote currency - no conversion needed
        case "USD":
        default:
          break;
      }
    }
    
    return pnl - commission - otherCharges;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const account = selectedAccounts.find(a => a.accountName === selectedAccount);
      if (!account) {
        throw new Error("Account not found. Please select a valid account.");
      }

      const newTradeData = trades.map(trade => {
        const entryPrice = parseFloat(trade.entryPrice) || 0;
        const exitPrice = parseFloat(trade.exitPrice) || 0;
        const size = parseFloat(trade.size) || 0;
        const commission = parseFloat(trade.commission) || 0;
        const otherCharges = parseFloat(trade.otherCharges) || 0;
        
        const profit = calculatePnL(trade);

        return {
          date: trade.entryDate.split('T')[0],
          time: trade.entryDate.split('T')[1] || "00:00",
          OpenTime: trade.entryDate,
          Ticket: Math.floor(Math.random() * 1000000),
          Item: trade.symbol.toUpperCase(),
          Type: trade.side,
          marketType: trade.market,
          Size: size,
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

      const response = await fetch("/api/dashboard/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          apiName: "postManualUpload",
          accountName: selectedAccount,
          accountId: account.accountId || account._id,
          accountType: account.accountType || "Manual",
          tradeData: newTradeData,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. Please try again.");
      }
      
      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Server error (${response.status})`);
      }

      setShowSuccess(true);
      await setAccounts();
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error("Error saving trade:", error);
      setErrorMessage(error?.message || "Failed to save trade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPnL = calculatePnL(activeTrade);
  const isFormValid = activeTrade.symbol && activeTrade.entryPrice && activeTrade.size && 
                      (activeTrade.status !== "completed" || activeTrade.exitPrice);

  return (
    <div className="space-y-4">
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-card/98 backdrop-blur-md z-50 flex items-center justify-center rounded-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-profit/20 to-profit/5 flex items-center justify-center mx-auto mb-4 ring-4 ring-profit/20"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Check className="w-10 h-10 text-profit" strokeWidth={3} />
                </motion.div>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-semibold text-foreground"
              >
                Trade Added!
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-muted-foreground mt-1"
              >
                Your trade has been recorded successfully
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-gradient-to-r from-loss/10 to-loss/5 border border-loss/20 rounded-xl p-3 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-loss/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-loss" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-loss">Something went wrong</p>
              <p className="text-xs text-loss/70 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-loss/50 hover:text-loss transition-colors p-1 hover:bg-loss/10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Pills */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Market</label>
        <div className="flex gap-2 flex-wrap">
          {markets.map((m) => (
            <motion.button
              key={m.id}
              onClick={() => setMarket(m.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                market === m.id
                  ? "bg-gradient-to-r " + m.color + " text-foreground ring-1 ring-primary/30 shadow-sm"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="text-base">{m.icon}</span>
              <span>{m.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Trade Tabs (for multiple trades) */}
      {trades.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              layout
              onClick={() => setActiveTradeId(trade.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0 cursor-pointer",
                activeTradeId === trade.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Hash className="w-3 h-3" />
              Trade {index + 1}
              {trades.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrade(trade.id);
                  }}
                  className="w-4 h-4 rounded-full hover:bg-loss/20 flex items-center justify-center cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-gradient-to-b from-muted/20 to-transparent border border-border/40 rounded-2xl p-4 space-y-4">
        
        {/* Symbol Search */}
        <div className="relative">
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Symbol</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={symbolInputRef}
              type="text"
              placeholder="Search or type symbol..."
              value={activeTrade.symbol || symbolSearch}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setSymbolSearch(val);
                updateTrade(activeTrade.id, "symbol", val);
                setShowSymbolDropdown(true);
              }}
              onFocus={() => setShowSymbolDropdown(true)}
              className="w-full pl-11 pr-4 py-3.5 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium"
            />
            {activeTrade.symbol && (
              <button
                onClick={() => updateTrade(activeTrade.id, "symbol", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {showSymbolDropdown && getSymbols().length > 0 && (
              <motion.div
                ref={symbolDropdownRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto"
              >
                {getSymbols().map((sym, idx) => (
                  <button
                    key={sym.symbol}
                    onClick={() => selectSymbol(sym)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-muted/50 transition-colors",
                      idx === 0 && "rounded-t-xl",
                      idx === getSymbols().length - 1 && "rounded-b-xl"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{sym.symbol.slice(0, 2)}</span>
                      </div>
                      <span className="font-semibold text-foreground">{sym.symbol}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">{sym.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direction Toggle */}
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Direction</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/20 rounded-xl">
            <motion.button
              onClick={() => updateTrade(activeTrade.id, "side", "buy")}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTrade.side === "buy"
                  ? "bg-profit text-white shadow-lg shadow-profit/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <ArrowUpRight className="w-4 h-4" />
              Long
            </motion.button>
            <motion.button
              onClick={() => updateTrade(activeTrade.id, "side", "sell")}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTrade.side === "sell"
                  ? "bg-loss text-white shadow-lg shadow-loss/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <ArrowDownRight className="w-4 h-4" />
              Short
            </motion.button>
          </div>
        </div>

        {/* Price & Size Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Entry Price</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={activeTrade.entryPrice}
                onChange={(e) => updateTrade(activeTrade.id, "entryPrice", e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {market === "FOREX" ? "Lot Size" : "Quantity"}
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={activeTrade.size}
              onChange={(e) => updateTrade(activeTrade.id, "size", e.target.value)}
              className="w-full px-4 py-3.5 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Entry Date & Time</label>
          <button
            onClick={() => setShowDatePicker(`entry-${activeTrade.id}`)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-background/50 border border-border/50 rounded-xl text-foreground hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">{formatDateForDisplay(activeTrade.entryDate)}</span>
            </div>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Trade Status</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "waiting", label: "Open", icon: Clock, color: "primary" },
              { id: "pending", label: "Pending", icon: Loader2, color: "warning" },
              { id: "completed", label: "Closed", icon: Check, color: "profit" }
            ].map((status) => {
              const Icon = status.icon;
              const isActive = activeTrade.status === status.id;
              return (
                <motion.button
                  key={status.id}
                  onClick={() => updateTrade(activeTrade.id, "status", status.id)}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all",
                    isActive
                      ? status.color === "profit" 
                        ? "bg-profit/15 text-profit ring-1 ring-profit/30"
                        : status.color === "warning"
                        ? "bg-yellow-500/15 text-yellow-500 ring-1 ring-yellow-500/30"
                        : "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", status.id === "pending" && isActive && "animate-spin")} />
                  {status.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Exit Fields (for completed trades) */}
        <AnimatePresence>
          {activeTrade.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-4 border-t border-border/30"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Exit Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={activeTrade.exitPrice}
                      onChange={(e) => updateTrade(activeTrade.id, "exitPrice", e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Exit Date</label>
                  <button
                    onClick={() => setShowDatePicker(`exit-${activeTrade.id}`)}
                    className="w-full flex items-center gap-2 px-4 py-3.5 bg-background/50 border border-border/50 rounded-xl text-foreground hover:bg-muted/30 transition-colors text-sm font-medium"
                  >
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{formatDateForDisplay(activeTrade.exitDate)}</span>
                  </button>
                </div>
              </div>

              {/* P&L Preview */}
              {activeTrade.exitPrice && activeTrade.entryPrice && activeTrade.size && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-4 rounded-xl flex items-center justify-between",
                    currentPnL >= 0 
                      ? "bg-gradient-to-r from-profit/10 to-profit/5 border border-profit/20"
                      : "bg-gradient-to-r from-loss/10 to-loss/5 border border-loss/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      currentPnL >= 0 ? "bg-profit/20" : "bg-loss/20"
                    )}>
                      {currentPnL >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-profit" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-loss" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated P&L</p>
                      <p className={cn(
                        "text-lg font-bold",
                        currentPnL >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {currentPnL >= 0 ? "+" : ""}{currentPnL.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Sparkles className={cn("w-5 h-5", currentPnL >= 0 ? "text-profit/50" : "text-loss/50")} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional Fields Toggle */}
        <button
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <motion.div
            animate={{ rotate: showOptionalFields ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
          <span>Optional fields</span>
          <span className="text-xs text-muted-foreground/50">(SL, TP, Commission)</span>
        </button>

        <AnimatePresence>
          {showOptionalFields && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Stop Loss
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional"
                    value={activeTrade.stopLoss}
                    onChange={(e) => updateTrade(activeTrade.id, "stopLoss", e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    <Target className="w-3 h-3 inline mr-1" />
                    Take Profit
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional"
                    value={activeTrade.takeProfit}
                    onChange={(e) => updateTrade(activeTrade.id, "takeProfit", e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    <Receipt className="w-3 h-3 inline mr-1" />
                    Commission
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={activeTrade.commission}
                    onChange={(e) => updateTrade(activeTrade.id, "commission", e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Other Charges</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={activeTrade.otherCharges}
                    onChange={(e) => updateTrade(activeTrade.id, "otherCharges", e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Another Trade */}
      {trades.length === 1 && (
        <button
          onClick={addNewTrade}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border/50 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add another trade
        </button>
      )}

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
