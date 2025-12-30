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
  Hash,
  Settings2,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAccountDetails from "@/store/accountdetails";
import symbols from "./components/symbols/Forex";
import usStocks from "./components/symbols/USAStock";
import indianStocks from "./components/symbols/IndianStocks";
import indianFnO from "./components/symbols/IndianFnO";
import crypto from "./components/symbols/Crypto";

import CustomDateTimePicker from "../../custom date picker/CustomDateTimePicker";

const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case "INR": return "₹";
    case "EUR": return "€";
    case "GBP": return "£";
    case "JPY": return "¥";
    default: return "$";
  }
};

const getCurrencyForMarket = (market: string): string => {
  switch (market) {
    case "INDIAN STOCKS":
    case "INDIAN F&O":
      return "INR";
    default:
      return "USD";
  }
};

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
  { id: "FOREX", label: "Forex", icon: "💱" },
  { id: "US STOCKS", label: "US Stocks", icon: "🇺🇸" },
  { id: "INDIAN STOCKS", label: "Indian", icon: "🇮🇳" },
  { id: "INDIAN F&O", label: "F&O", icon: "📊" },
  { id: "CRYPTO", label: "Crypto", icon: "₿" },
];

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "Now";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
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

  useEffect(() => {
    if (onSubmitStateChange) {
      const canSubmit = validateForm() === null;
      onSubmitStateChange(isSubmitting, trades.length, canSubmit);
    }
  }, [isSubmitting, trades, onSubmitStateChange]);

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
    updateTrade(activeTrade.id, "currency", getCurrencyForMarket(newMarket));
    updateTrade(activeTrade.id, "size", "");
  };

  const updateTrade = (id: string, field: keyof TradeEntry, value: string) => {
    setTrades(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
    if (errorMessage) setErrorMessage(null);
  };

  const popularSymbols: Record<string, string[]> = {
    "FOREX": ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "AUDUSD", "USDCAD"],
    "US STOCKS": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"],
    "INDIAN STOCKS": ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN"],
    "INDIAN F&O": ["NIFTY", "BANKNIFTY", "SENSEX", "FINNIFTY", "MIDCPNIFTY", "NIFTYIT"],
    "CRYPTO": ["BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD", "BNBUSD", "ADAUSD"]
  };

  const getSymbols = () => {
    const searchLower = symbolSearch.toLowerCase().trim();
    let source: Array<{ symbol: string; name: string; market?: string; curr?: string; lotSize?: number }> = [];
    
    switch (market) {
      case "FOREX": source = symbols; break;
      case "US STOCKS": source = usStocks; break;
      case "INDIAN STOCKS": source = indianStocks; break;
      case "INDIAN F&O": source = indianFnO; break;
      case "CRYPTO": source = crypto; break;
    }
    
    if (!searchLower) {
      const popular = popularSymbols[market] || [];
      return source.filter(s => popular.includes(s.symbol)).slice(0, 6);
    }
    
    return source.filter(s => 
      s.symbol.toLowerCase().includes(searchLower) ||
      s.name.toLowerCase().includes(searchLower)
    ).slice(0, 8);
  };
  
  const isShowingPopularSymbols = !symbolSearch.trim();
  
  const currencySymbol = getCurrencySymbol(activeTrade.currency);

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
    
    if (market === "INDIAN F&O") {
      const fnoSymbol = indianFnO.find(s => s.symbol.toUpperCase() === upperSymbol);
      return fnoSymbol?.lotSize || 25;
    }
    
    if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
      return 100;
    }
    if (upperSymbol.includes("XAG") || upperSymbol.includes("SILVER")) {
      return 5000;
    }
    
    switch (market) {
      case "FOREX":
        return 100000;
      case "CRYPTO":
        return 1;
      case "INDIAN STOCKS":
      case "INDIAN_STOCK":
      case "INDIAN_INDICES":
      case "STOCK":
      case "US_STOCK":
      case "US STOCKS":
      case "STOCKS":
        return 1;
      case "COMMODITIES":
        if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
          return 100;
        }
        if (upperSymbol.includes("XAG") || upperSymbol.includes("SILVER")) {
          return 5000;
        }
        return 100;
      default:
        if (upperMarket.includes("STOCK") || upperMarket.includes("EQUIT")) {
          return 1;
        }
        if (upperSymbol.includes("XAU") || upperSymbol.includes("GOLD")) {
          return 100;
        }
        if (upperSymbol.includes("XAG") || upperSymbol.includes("SILVER")) {
          return 5000;
        }
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
    
    const upperSymbol = trade.symbol.toUpperCase();
    if (trade.market === "FOREX" && upperSymbol.length >= 6) {
      const quoteCurrency = upperSymbol.slice(-3);
      
      switch (quoteCurrency) {
        case "JPY":
          pnl = pnl / 150;
          break;
        case "CHF":
          pnl = pnl * 1.13;
          break;
        case "CAD":
          pnl = pnl * 0.71;
          break;
        case "GBP":
          pnl = pnl * 1.27;
          break;
        case "AUD":
          pnl = pnl * 0.62;
          break;
        case "NZD":
          pnl = pnl * 0.57;
          break;
        case "EUR":
          pnl = pnl * 1.04;
          break;
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
    <div className="space-y-2">
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
                className="w-16 h-16 rounded-full bg-gradient-to-br from-profit/20 to-profit/5 flex items-center justify-center mx-auto mb-3 ring-4 ring-profit/20"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Check className="w-8 h-8 text-profit" strokeWidth={3} />
                </motion.div>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-semibold text-foreground"
              >
                Trade Added!
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-loss/10 border border-loss/20 rounded-lg p-2.5 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-loss shrink-0" />
            <p className="text-xs text-loss flex-1">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="text-loss/50 hover:text-loss p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Market Pills - Horizontal Scroll */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {markets.map((m) => (
          <motion.button
            key={m.id}
            onClick={() => setMarket(m.id)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all shrink-0",
              market === m.id
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="text-xs">{m.icon}</span>
            <span>{m.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Trade Tabs (for multiple trades) */}
      {trades.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              layout
              onClick={() => setActiveTradeId(trade.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer",
                activeTradeId === trade.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Hash className="w-3 h-3" />
              {index + 1}
              {trades.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrade(trade.id);
                  }}
                  className="w-4 h-4 rounded-full hover:bg-loss/20 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Compact Form */}
      <div className="bg-muted/20 border border-border/30 rounded-lg p-2.5 space-y-2">
        
        {/* Row 1: Symbol + Direction (side by side) */}
        <div className="grid grid-cols-5 gap-2">
          {/* Symbol - takes 3 cols */}
          <div className="col-span-3 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={symbolInputRef}
                type="text"
                placeholder="Symbol..."
                value={activeTrade.symbol || symbolSearch}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setSymbolSearch(val);
                  updateTrade(activeTrade.id, "symbol", val);
                  setShowSymbolDropdown(true);
                }}
                onFocus={() => setShowSymbolDropdown(true)}
                className="w-full pl-9 pr-8 py-2.5 bg-background/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium"
              />
              {activeTrade.symbol && (
                <button
                  onClick={() => updateTrade(activeTrade.id, "symbol", "")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {showSymbolDropdown && getSymbols().length > 0 && (
                <motion.div
                  ref={symbolDropdownRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto"
                >
                  {isShowingPopularSymbols && (
                    <div className="px-3 py-1.5 border-b border-border/50">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        Popular
                      </span>
                    </div>
                  )}
                  {getSymbols().map((sym, idx) => (
                    <button
                      key={sym.symbol}
                      onClick={() => selectSymbol(sym)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{sym.symbol}</span>
                        <span className="text-muted-foreground/70 truncate max-w-[80px]">{sym.name}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Direction - takes 2 cols */}
          <div className="col-span-2 grid grid-cols-2 gap-1 p-0.5 bg-muted/30 rounded-lg">
            <motion.button
              onClick={() => updateTrade(activeTrade.id, "side", "buy")}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center justify-center gap-1 py-2 rounded-md text-xs font-semibold transition-all",
                activeTrade.side === "buy"
                  ? "bg-profit text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Long
            </motion.button>
            <motion.button
              onClick={() => updateTrade(activeTrade.id, "side", "sell")}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center justify-center gap-1 py-2 rounded-md text-xs font-semibold transition-all",
                activeTrade.side === "sell"
                  ? "bg-loss text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Short
            </motion.button>
          </div>
        </div>

        {/* Row 2: Entry Price + Size (with quick presets) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Entry</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={activeTrade.entryPrice}
                onChange={(e) => updateTrade(activeTrade.id, "entryPrice", e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 bg-background/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {market === "FOREX" ? "Lots" : market === "INDIAN F&O" ? "Lots" : "Qty"}
            </label>
            <input
              type="number"
              step="any"
              placeholder={market === "INDIAN F&O" ? "1" : "0.00"}
              value={activeTrade.size}
              onChange={(e) => updateTrade(activeTrade.id, "size", e.target.value)}
              className="w-full px-3 py-2.5 bg-background/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Quick Lot Presets - Prominent with color */}
        <div className="flex gap-1">
          {(market === "FOREX" 
            ? [0.01, 0.1, 0.5, 1.0] 
            : market === "INDIAN F&O" 
              ? [1, 2, 5, 10] 
              : [1, 10, 50, 100]
          ).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => updateTrade(activeTrade.id, "size", preset.toString())}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                parseFloat(activeTrade.size) === preset
                  ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40"
                  : "bg-muted/40 text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-400"
              )}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Row 3: Status Toggle - Compact */}
        <div className="grid grid-cols-3 gap-1.5">
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
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all",
                  isActive
                    ? status.color === "profit" 
                      ? "bg-profit/15 text-profit ring-1 ring-profit/30"
                      : status.color === "warning"
                      ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                      : "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                )}
              >
                <Icon className={cn("w-3 h-3", status.id === "pending" && isActive && "animate-spin")} />
                {status.label}
              </motion.button>
            );
          })}
        </div>

        {/* Exit Fields (for completed trades) - Compact */}
        <AnimatePresence>
          {activeTrade.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2 pt-2 border-t border-border/20"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Exit Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={activeTrade.exitPrice}
                      onChange={(e) => updateTrade(activeTrade.id, "exitPrice", e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-background/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Exit Date</label>
                  <button
                    onClick={() => setShowDatePicker(`exit-${activeTrade.id}`)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-background/60 border border-border/50 rounded-lg text-foreground hover:bg-muted/30 transition-colors text-xs font-medium"
                  >
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">{formatDateForDisplay(activeTrade.exitDate)}</span>
                  </button>
                </div>
              </div>

              {/* P&L Preview - More prominent with color psychology */}
              {activeTrade.exitPrice && activeTrade.entryPrice && activeTrade.size && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-3 rounded-lg flex items-center justify-between",
                    currentPnL >= 0 
                      ? "bg-gradient-to-r from-profit/15 to-profit/5 border border-profit/25"
                      : "bg-gradient-to-r from-loss/15 to-loss/5 border border-loss/25"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      currentPnL >= 0 ? "bg-profit/20" : "bg-loss/20"
                    )}>
                      {currentPnL >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-profit" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-loss" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">P&L</p>
                      <p className={cn(
                        "text-base font-bold",
                        currentPnL >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {currentPnL >= 0 ? "+" : "-"}{currencySymbol}{Math.abs(currentPnL).toLocaleString(activeTrade.currency === 'INR' ? 'en-IN' : 'en-US', { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional Fields Toggle - More subtle */}
        <button
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <Settings2 className="w-3 h-3" />
          <span>More options</span>
          <motion.div animate={{ rotate: showOptionalFields ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight className="w-3 h-3" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showOptionalFields && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2 overflow-hidden"
            >
              {/* Entry Date */}
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Entry Date</label>
                <button
                  onClick={() => setShowDatePicker(`entry-${activeTrade.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-background/60 border border-border/50 rounded-lg text-foreground hover:bg-muted/30 transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium">{formatDateForDisplay(activeTrade.entryDate)}</span>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    <Shield className="w-2.5 h-2.5 inline mr-0.5" />
                    Stop Loss
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional"
                    value={activeTrade.stopLoss}
                    onChange={(e) => updateTrade(activeTrade.id, "stopLoss", e.target.value)}
                    className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    <Target className="w-2.5 h-2.5 inline mr-0.5" />
                    Take Profit
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional"
                    value={activeTrade.takeProfit}
                    onChange={(e) => updateTrade(activeTrade.id, "takeProfit", e.target.value)}
                    className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    <Receipt className="w-2.5 h-2.5 inline mr-0.5" />
                    Commission
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={activeTrade.commission}
                    onChange={(e) => updateTrade(activeTrade.id, "commission", e.target.value)}
                    className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Other Charges</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={activeTrade.otherCharges}
                    onChange={(e) => updateTrade(activeTrade.id, "otherCharges", e.target.value)}
                    className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-xs"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Another Trade - More subtle */}
      {trades.length === 1 && (
        <button
          onClick={addNewTrade}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border/40 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
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
