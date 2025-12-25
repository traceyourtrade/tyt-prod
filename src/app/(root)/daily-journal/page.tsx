"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  BookOpen,
  Upload,
  Image as ImageIcon,
  X,
  Save,
  FileText,
  ClipboardCheck,
  Heart,
  Shield,
  BarChart3,
  Clock,
  CheckCircle2,
  Activity,
  Star,
  Percent,
  Scale,
  ListChecks,
  Check,
  DollarSign,
  ArrowUpDown,
  PanelLeft,
  Eye,
  Share2,
  Layers,
  FileImage,
  MessageSquare,
  Play,
  ChevronUp,
  Crosshair,
  AlertTriangle,
  BarChart2,
  LineChart,
  Maximize2,
  ArrowRight,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import useAccountDetails from "@/store/accountdetails";
import { formatCompactNumber } from "@/utils/formatNumber";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";
import { SymbolLogo } from "@/components/ui/SymbolLogo";
import QuickFillDropdown from "@/components/journal/QuickFillDropdown";
import ShareTradeModal from "@/components/shared/ShareTradeModal";

interface Trade {
  id?: string;
  _id?: string;
  date: string;
  time?: string;
  EntryTime?: string;
  ExitTime?: string;
  Profit: number;
  Item?: string;
  symbol?: string;
  Type?: string;
  side?: string;
  strategy?: string;
  accountType?: string;
  beforeURL?: string;
  afterURL?: string;
  jrData?: JournalData;
  entryPrice?: string | number;
  exitPrice?: string | number;
  quantity?: number;
  stopLoss?: number | string;
  takeProfit?: number | string;
  fees?: number;
  swap?: number;
  [key: string]: any;
}

interface JournalData {
  templateId?: string;
  prompts?: Record<string, string>;
  sentiment?: "great" | "okay" | "poor";
  tags?: string[];
  rulesCompliance?: Record<string, boolean>;
  tradeRating?: number;
  tradeNotes?: string;
  dailyNotes?: string;
}

interface Template {
  _id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  prompts: { id: string; label: string; placeholder: string; type: string }[];
  isPremade?: boolean;
}

interface Account {
  tradeData?: Trade[];
  [key: string]: any;
}


const commonTags = ["FOMO", "Perfect Setup", "Revenge Trade", "Followed Plan", "Overtraded", "Early Exit", "Late Entry", "News Play", "Gap Fill", "Trend Follow"];

const getTemplateIcon = (iconName: string) => {
  switch (iconName) {
    case "ClipboardCheck": return ClipboardCheck;
    case "Zap": return Zap;
    case "Target": return Target;
    case "Heart": return Heart;
    case "Shield": return Shield;
    default: return FileText;
  }
};

const getTemplateColor = (color: string) => {
  switch (color) {
    case "blue": return { text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", accent: "bg-blue-500" };
    case "yellow": return { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", accent: "bg-amber-500" };
    case "green": return { text: "text-profit", bg: "bg-profit/10", border: "border-profit/20", accent: "bg-profit" };
    case "pink": return { text: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20", accent: "bg-pink-500" };
    case "purple": return { text: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", accent: "bg-purple-500" };
    default: return { text: "text-primary", bg: "bg-primary/10", border: "border-primary/20", accent: "bg-primary" };
  }
};

const DailyJournal = () => {
  const { selectedAccounts, setAccounts, profileData } = useAccountDetails();
  const { currency, exchangeRate } = useCurrencyStore();
  const tokenn = Cookies.get("Trace Your Trades") || "";

  const [trades, setTrades] = useState<Trade[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState(0);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
  const [journalData, setJournalData] = useState<JournalData>({ prompts: {}, tags: [], tradeRating: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<"before" | "after" | null>(null);
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    tradeId: string;
    accountId: string;
    tradeSummary: { symbol?: string; pnl?: number; date?: string };
  } | null>(null);
  const [strategyRules, setStrategyRules] = useState<{id: string; text: string}[]>([]);
  const [rulesCompliance, setRulesCompliance] = useState<Record<string, boolean>>({});
  const [loadingRules, setLoadingRules] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isMobileTradeListOpen, setIsMobileTradeListOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);

  const [mainTab, setMainTab] = useState<"stats" | "strategy" | "executions" | "attachments">("stats");
  const [centerTab, setCenterTab] = useState<"chart" | "notes" | "runningPnL">("chart");
  const [notesTab, setNotesTab] = useState<"trade" | "daily">("trade");

  const existingStrategies: string[] = (profileData?.otherData?.strategy || []).filter((s: string) => s && s !== "Select");

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);

  useEffect(() => {
    const allTrades = (selectedAccounts as Account[]).flatMap((account) => account.tradeData || []);
    if (allTrades.length > 0) {
      const sorted = allTrades.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.EntryTime || a.time || "00:00:00"}`);
        const dateB = new Date(`${b.date}T${b.EntryTime || b.time || "00:00:00"}`);
        return dateB.getTime() - dateA.getTime();
      });
      setTrades(sorted);
      setIsDemo(false);
      if (sorted.length > 0 && !selectedTrade) {
        setSelectedTrade(sorted[0]);
        setSelectedTradeIndex(0);
      }
    }
  }, [selectedAccounts]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/journal-templates/get", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.length) setTemplates(data.data);
        }
      } catch {
        setTemplates([]);
      }
    };
    fetchTemplates();
  }, []);

  const fetchStrategyRules = async (strategyName: string, existingCompliance?: Record<string, boolean>) => {
    if (!strategyName || strategyName === "Select") {
      setStrategyRules([]);
      setRulesCompliance({});
      return;
    }
    
    setLoadingRules(true);
    try {
      const res = await fetch(`/api/strategy/get?apiName=getStrategyRules&strategyName=${encodeURIComponent(strategyName)}`);
      if (res.ok) {
        const data = await res.json();
        setStrategyRules(data.rules || []);
        if (existingCompliance && Object.keys(existingCompliance).length > 0) {
          setRulesCompliance(existingCompliance);
        } else {
          const initialCompliance: Record<string, boolean> = {};
          (data.rules || []).forEach((rule: {id: string}) => {
            initialCompliance[rule.id] = false;
          });
          setRulesCompliance(initialCompliance);
        }
      }
    } catch (error) {
      console.error("Error fetching strategy rules:", error);
    } finally {
      setLoadingRules(false);
    }
  };

  const toggleRuleCompliance = (ruleId: string) => {
    setRulesCompliance(prev => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  useEffect(() => {
    if (selectedTrade?.strategy && selectedTrade.strategy !== "Select") {
      fetchStrategyRules(selectedTrade.strategy, selectedTrade.jrData?.rulesCompliance);
    } else {
      setStrategyRules([]);
      setRulesCompliance({});
    }
  }, [selectedTrade?.strategy, selectedTrade?.id]);

  useEffect(() => {
    if (selectedTrade?.jrData) {
      setJournalData(selectedTrade.jrData);
      const templateName = selectedTrade.jrData.templateId;
      const idx = templates.findIndex((t) => t.name === templateName);
      if (idx >= 0) setSelectedTemplateIdx(idx);
    } else {
      setJournalData({ prompts: {}, tags: [], tradeRating: 0 });
      setSelectedTemplateIdx(0);
    }
  }, [selectedTrade, templates]);

  const filteredTrades = useMemo(() => {
    let data = trades;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((t) => (t.Item || t.symbol || "").toLowerCase().includes(q));
    }
    return data;
  }, [trades, searchQuery]);

  const navigateTrade = (direction: "prev" | "next") => {
    const currentIdx = filteredTrades.findIndex(t => (t.id || t._id) === (selectedTrade?.id || selectedTrade?._id));
    let newIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
    if (newIdx < 0) newIdx = filteredTrades.length - 1;
    if (newIdx >= filteredTrades.length) newIdx = 0;
    setSelectedTrade(filteredTrades[newIdx]);
    setSelectedTradeIndex(newIdx);
  };

  const calculateTradeMetrics = (trade: Trade) => {
    const entry = parseFloat(String(trade.entryPrice || 0));
    const exit = parseFloat(String(trade.exitPrice || 0));
    const qty = trade.quantity || 1;
    const isLong = trade.Type?.toLowerCase() === "long" || trade.side?.toLowerCase() === "long" || trade.Type?.toLowerCase() === "buy";
    const pips = isLong ? ((exit - entry) * 10000) : ((entry - exit) * 10000);
    const returnPerPip = trade.Profit / (pips || 1);
    const roi = ((trade.Profit) / (entry * qty) * 100);
    const grossPnL = trade.Profit + (trade.fees || 0);
    const adjustedCost = entry * qty;
    const sl = parseFloat(String(trade.stopLoss || 0));
    const tp = parseFloat(String(trade.takeProfit || 0));
    const risk = sl ? Math.abs(entry - sl) * qty : 0;
    const rMultiple = risk > 0 ? trade.Profit / risk : 0;
    const mae = sl ? Math.abs(entry - sl) : 0;
    const mfe = tp ? Math.abs(tp - entry) : 0;
    
    return {
      pips: Math.round(pips * 10) / 10,
      returnPerPip: Math.round(returnPerPip * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      grossPnL,
      adjustedCost,
      netROI: roi,
      mae: entry - mae,
      mfe: entry + mfe,
      rMultiple: Math.round(rMultiple * 100) / 100,
      initialTarget: trade.Profit,
      tradeRisk: risk,
      plannedRMultiple: tp && sl ? Math.abs(tp - entry) / Math.abs(entry - sl) : 0,
      realizedRMultiple: rMultiple
    };
  };

  const handlePromptChange = (promptId: string, value: string) => {
    setJournalData((prev) => ({
      ...prev,
      prompts: { ...prev.prompts, [promptId]: value },
    }));
  };

  const handleTradeNotesChange = (value: string) => {
    setJournalData((prev) => ({ ...prev, tradeNotes: value }));
  };

  const handleDailyNotesChange = (value: string) => {
    setJournalData((prev) => ({ ...prev, dailyNotes: value }));
  };

  const handleRatingChange = (rating: number) => {
    setJournalData((prev) => ({ ...prev, tradeRating: rating }));
  };

  const handleSentimentChange = (sentiment: "great" | "okay" | "poor") => {
    setJournalData((prev) => ({ ...prev, sentiment }));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !journalData.tags?.includes(tag)) {
      setJournalData((prev) => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setJournalData((prev) => ({ ...prev, tags: prev.tags?.filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    if (!selectedTrade || isDemo) return;
    setIsSaving(true);

    try {
      const tradeId = selectedTrade._id || selectedTrade.id;
      const existingRulesCompliance = selectedTrade.jrData?.rulesCompliance;
      const jrDataWithRules = {
        ...journalData,
        templateId: templates[selectedTemplateIdx]?.name,
        rulesCompliance: strategyRules.length > 0 ? rulesCompliance : existingRulesCompliance
      };
      await fetch("/api/daily-journal/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiName: "updateJournal",
          id: tradeId,
          tokenn,
          accountType: selectedTrade.accountType,
          jrData: jrDataWithRules,
        }),
      });
      setAccounts();
    } catch (error) {
      console.error("Error saving journal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteScreenshot = async (type: "before" | "after") => {
    if (!selectedTrade || isDemo) return;
    
    try {
      const tradeId = selectedTrade._id || selectedTrade.id || "";
      await fetch("/api/daily-journal/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiName: "editDropdowns",
          id: tradeId,
          type: type === "before" ? "beforeURL" : "afterURL",
          value: "",
          tokenn,
          accountType: selectedTrade.accountType || "",
        }),
      });
      setAccounts();
      setLightboxImage(null);
      setLightboxType(null);
    } catch (error) {
      console.error("Error deleting screenshot:", error);
    }
  };

  const openLightbox = (url: string, type: "before" | "after") => {
    setLightboxImage(url);
    setLightboxType(type);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxType(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (!file || !selectedTrade || isDemo) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxSize = 1200;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let dataUrl;
        while ((dataUrl = canvas.toDataURL("image/jpeg", quality)).length > 100 * 1024 && quality > 0.2) {
          quality -= 0.1;
        }

        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        const tradeId = selectedTrade._id || selectedTrade.id || "";
        formData.append("image", blob, file.name);
        formData.append("id", tradeId);
        formData.append("imgType", type === "before" ? "beforeURL" : "afterURL");
        formData.append("tokenn", tokenn);
        formData.append("accountType", selectedTrade.accountType || "");
        formData.append("apiName", "uploadImage");

        await fetch("/api/daily-journal/post", { method: "POST", body: formData });
        setAccounts();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (time?: string) => {
    if (!time) return "--";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const metrics = selectedTrade ? calculateTradeMetrics(selectedTrade) : null;
  const isProfit = (selectedTrade?.Profit || 0) >= 0;
  const currentTradeNumber = filteredTrades.findIndex(t => (t.id || t._id) === (selectedTrade?.id || selectedTrade?._id)) + 1;

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Top Header Bar */}
      <div className="flex-shrink-0 border-b border-white/[0.06] bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-2xl">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
          {/* Left: Trade Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Trade List Toggle */}
            <button
              onClick={() => setIsMobileTradeListOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border transition-all"
              aria-label="Open trade list"
            >
              <Layers className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => navigateTrade("prev")}
                className="p-1.5 sm:p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] min-w-[56px] text-center">
                <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums">{currentTradeNumber}</span>
                <span className="text-xs sm:text-sm text-muted-foreground/60">/{filteredTrades.length}</span>
              </div>
              <button
                onClick={() => navigateTrade("next")}
                className="p-1.5 sm:p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Current Trade Info - Hide date on mobile */}
            {selectedTrade && (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border">
                <SymbolLogo symbol={selectedTrade.Item || selectedTrade.symbol || ""} size="sm" />
                <div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-semibold text-foreground text-sm">{selectedTrade.Item || selectedTrade.symbol}</span>
                    <span className={`hidden sm:inline px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long" || selectedTrade.Type?.toLowerCase() === "buy"
                        ? "bg-profit/10 text-profit"
                        : "bg-loss/10 text-loss"
                    }`}>
                      {selectedTrade.Type || selectedTrade.side}
                    </span>
                  </div>
                  <span className="hidden sm:block text-xs text-muted-foreground">{formatDate(selectedTrade.date)}</span>
                </div>
                {/* Mobile P&L Badge */}
                <span className={`sm:hidden text-sm font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
                  {isProfit ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit * exchangeRate, currency)}
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Stats Toggle */}
            <button
              onClick={() => setIsMobileStatsOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border transition-all"
              aria-label="Open stats panel"
            >
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
            </button>

            {selectedTrade && !isDemo && (
              <button
                onClick={() => setShareModal({
                  isOpen: true,
                  tradeId: selectedTrade._id || selectedTrade.id || "",
                  accountId: selectedTrade.accountType || "",
                  tradeSummary: {
                    symbol: selectedTrade.Item || selectedTrade.symbol,
                    pnl: selectedTrade.Profit,
                    date: selectedTrade.date,
                  },
                })}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border text-sm text-muted-foreground hover:text-foreground transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden md:inline">Share</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isDemo || isSaving}
              className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Trade List */}
        <motion.div
          initial={false}
          animate={{ width: isLeftPanelCollapsed ? 0 : 280 }}
          className="hidden md:block flex-shrink-0 border-r border-white/[0.06] bg-gradient-to-b from-card to-background overflow-hidden"
        >
          <div className="w-[280px] h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trades..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all duration-200"
                />
              </div>
            </div>

            {/* Trade List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
              {filteredTrades.map((trade, idx) => {
                const isSelected = (trade.id || trade._id) === (selectedTrade?.id || selectedTrade?._id);
                const tradeProfit = trade.Profit >= 0;
                return (
                  <motion.button
                    key={trade.id || trade._id || idx}
                    onClick={() => {
                      setSelectedTrade(trade);
                      setSelectedTradeIndex(idx);
                    }}
                    className={`w-full p-3 text-left rounded-xl transition-all duration-200 ${
                      isSelected 
                        ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/5" 
                        : "hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]"
                    }`}
                    whileHover={{ scale: isSelected ? 1 : 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`relative ${isSelected ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-background rounded-lg' : ''}`}>
                          <SymbolLogo symbol={trade.Item || trade.symbol || ""} size="sm" />
                        </div>
                        <div>
                          <span className={`font-semibold text-sm ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>{trade.Item || trade.symbol}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground/70">{formatDate(trade.date)}</span>
                            {trade.strategy && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-[10px] text-primary/70">{trade.strategy}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${tradeProfit ? "text-profit" : "text-loss"}`}>
                        {tradeProfit ? "+" : ""}{formatCompactCurrency(trade.Profit * exchangeRate, currency)}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Toggle Left Panel - Desktop Only */}
        <motion.button
          initial={false}
          animate={{ left: isLeftPanelCollapsed ? 0 : 280 }}
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card border border-border rounded-r-lg hover:bg-muted/50 transition-colors items-center justify-center"
        >
          {isLeftPanelCollapsed ? <PanelRightOpen className="w-4 h-4 text-muted-foreground" /> : <PanelRightClose className="w-4 h-4 text-muted-foreground" />}
        </motion.button>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Center Tab Bar */}
          <div className="flex-shrink-0 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/[0.06] flex items-center justify-between gap-2 bg-gradient-to-b from-card/60 to-transparent backdrop-blur-sm">
            <div className="flex items-center gap-0.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.08]">
              {[
                { key: "chart", label: "Screenshots", icon: ImageIcon },
                { key: "notes", label: "Notes", icon: MessageSquare },
                { key: "runningPnL", label: "P&L", icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCenterTab(tab.key as typeof centerTab)}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    centerTab === tab.key
                      ? "bg-white/[0.08] text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${centerTab === tab.key ? 'text-primary' : ''}`} />
                  <span className="hidden xs:inline">{tab.label}</span>
                  {centerTab === tab.key && (
                    <motion.div
                      layoutId="centerTabIndicator"
                      className="absolute inset-0 bg-white/[0.08] rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </button>
              ))}
            </div>

          </div>

          {/* Center Main Content */}
          <div className="flex-1 overflow-hidden">
            {centerTab === "chart" && selectedTrade && (
              <div className="h-full relative bg-background p-4 sm:p-6 overflow-y-auto">
                <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto">
                  {/* Before Screenshot */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-sm font-semibold text-foreground">Before Entry</span>
                      </div>
                      {selectedTrade.beforeURL && (
                        <button
                          onClick={() => openLightbox(selectedTrade.beforeURL!, "before")}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
                        >
                          <Maximize2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden relative group min-h-[200px]">
                      {selectedTrade.beforeURL ? (
                        <>
                          <img
                            src={selectedTrade.beforeURL}
                            alt="Before trade screenshot"
                            className="w-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                            onClick={() => openLightbox(selectedTrade.beforeURL!, "before")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-white/[0.03] transition-colors">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-3">
                            <Upload className="w-6 h-6 text-muted-foreground/50" />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground mb-1">Upload Before Screenshot</span>
                          <span className="text-xs text-muted-foreground/60">Click to browse or drag & drop</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, "before")}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* After Screenshot */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isProfit ? 'bg-profit' : 'bg-loss'}`} />
                        <span className="text-sm font-semibold text-foreground">After Exit</span>
                      </div>
                      {selectedTrade.afterURL && (
                        <button
                          onClick={() => openLightbox(selectedTrade.afterURL!, "after")}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
                        >
                          <Maximize2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden relative group min-h-[200px]">
                      {selectedTrade.afterURL ? (
                        <>
                          <img
                            src={selectedTrade.afterURL}
                            alt="After trade screenshot"
                            className="w-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                            onClick={() => openLightbox(selectedTrade.afterURL!, "after")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-white/[0.03] transition-colors">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-3">
                            <Upload className="w-6 h-6 text-muted-foreground/50" />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground mb-1">Upload After Screenshot</span>
                          <span className="text-xs text-muted-foreground/60">Click to browse or drag & drop</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, "after")}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {centerTab === "notes" && (
              <div className="h-full overflow-y-auto p-3 sm:p-6">
                <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                  {/* Notes Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-xl border border-border w-fit">
                    <button
                      onClick={() => setNotesTab("trade")}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        notesTab === "trade" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Trade Note
                    </button>
                    <button
                      onClick={() => setNotesTab("daily")}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        notesTab === "daily" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Daily Journal
                    </button>
                  </div>

                  {notesTab === "trade" ? (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Template Selector - Compact on mobile */}
                      <div>
                        <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Template</h3>
                        {/* Mobile: Grid layout for templates */}
                        <div className="grid grid-cols-2 gap-2 sm:hidden">
                          {templates.map((template, idx) => {
                            const Icon = getTemplateIcon(template.icon);
                            const colors = getTemplateColor(template.color);
                            const isSelected = selectedTemplateIdx === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedTemplateIdx(idx)}
                                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                                  isSelected
                                    ? `${colors.bg} ${colors.text} ${colors.border}`
                                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground border-border"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{template.name}</span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Desktop: Horizontal scroll */}
                        <div className="hidden sm:flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {templates.map((template, idx) => {
                            const Icon = getTemplateIcon(template.icon);
                            const colors = getTemplateColor(template.color);
                            const isSelected = selectedTemplateIdx === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedTemplateIdx(idx)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                  isSelected
                                    ? `${colors.bg} ${colors.text} ${colors.border}`
                                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground border-border"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {template.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Journal Prompts - Compact on mobile */}
                      <div className="space-y-3 sm:space-y-4">
                        {templates[selectedTemplateIdx]?.prompts.map((prompt) => (
                          <div key={prompt.id} className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs sm:text-sm text-foreground font-medium">{prompt.label}</label>
                              <QuickFillDropdown
                                promptId={prompt.id}
                                promptType={prompt.type === "textarea" ? "textarea" : "text"}
                                currentValue={journalData.prompts?.[prompt.id] || ""}
                                onSelect={(value) => handlePromptChange(prompt.id, value)}
                              />
                            </div>
                            {prompt.type === "textarea" ? (
                              <textarea
                                value={journalData.prompts?.[prompt.id] || ""}
                                onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                                rows={3}
                                placeholder={prompt.placeholder}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/20 border border-border rounded-lg sm:rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                              />
                            ) : (
                              <input
                                type="text"
                                value={journalData.prompts?.[prompt.id] || ""}
                                onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                                placeholder={prompt.placeholder}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/20 border border-border rounded-lg sm:rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Quick Tags - Compact on mobile */}
                      <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/20 border border-border">
                        <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Quick Tags</h3>
                        {journalData.tags && journalData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            {journalData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 text-primary rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border border-primary/20"
                              >
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-primary/70">
                                  <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {commonTags.filter(t => !journalData.tags?.includes(t)).map((tag) => (
                            <button
                              key={tag}
                              onClick={() => handleAddTag(tag)}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all border border-border"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Daily Journal Entry</h3>
                        <textarea
                          value={journalData.dailyNotes || ""}
                          onChange={(e) => handleDailyNotesChange(e.target.value)}
                          rows={8}
                          placeholder="Write about your trading day, market conditions, mindset, and key takeaways..."
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/20 border border-border rounded-lg sm:rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {centerTab === "runningPnL" && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-transparent flex items-center justify-center mb-4 mx-auto border border-border">
                    <BarChart3 className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">Running P&L chart coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Stats/Strategy/Executions/Attachments */}
        <motion.div
          initial={false}
          animate={{ width: isRightPanelCollapsed ? 0 : 340 }}
          className="hidden lg:block flex-shrink-0 border-l border-white/[0.06] bg-gradient-to-b from-card to-background overflow-hidden"
        >
          <div className="w-[340px] h-full flex flex-col">
            {/* Right Panel Tabs */}
            <div className="flex-shrink-0 p-4 border-b border-white/[0.06]">
              <div className="flex gap-0.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                {[
                  { key: "stats", label: "Stats", icon: BarChart2 },
                  { key: "strategy", label: "Strategy", icon: Target },
                  { key: "executions", label: "Executions", icon: Activity },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMainTab(tab.key as typeof mainTab)}
                    className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      mainTab === tab.key
                        ? "bg-white/[0.08] text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 ${mainTab === tab.key ? 'text-primary' : ''}`} />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Panel Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {/* Stats Tab */}
              {mainTab === "stats" && selectedTrade && metrics && (
                <>
                  {/* Hero P&L Card */}
                  <div className={`relative p-5 rounded-2xl border overflow-hidden ${isProfit ? "bg-gradient-to-br from-profit/10 via-profit/5 to-transparent border-profit/25" : "bg-gradient-to-br from-loss/10 via-loss/5 to-transparent border-loss/25"}`}>
                    <div className={`absolute top-0 left-0 right-0 h-[1px] ${isProfit ? 'bg-gradient-to-r from-transparent via-profit/50 to-transparent' : 'bg-gradient-to-r from-transparent via-loss/50 to-transparent'}`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Net P&L</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className={`text-4xl font-bold tabular-nums tracking-tight ${isProfit ? "text-profit" : "text-loss"}`}>
                        {isProfit ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit * exchangeRate, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Trade Info Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="group p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200">
                      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wider font-medium">Side</span>
                      <p className={`text-sm font-bold mt-1.5 ${
                        (selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long" || selectedTrade.Type?.toLowerCase() === "buy")
                          ? "text-profit"
                          : "text-loss"
                      }`}>
                        {selectedTrade.Type || selectedTrade.side || "--"}
                      </p>
                    </div>
                    <div className="group p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200">
                      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wider font-medium">Quantity</span>
                      <p className="text-sm font-bold text-foreground mt-1.5">{selectedTrade.quantity || "--"}</p>
                    </div>
                    <div className="group p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200">
                      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wider font-medium">Pips</span>
                      <p className="text-sm font-bold text-primary mt-1.5">{metrics.pips}</p>
                    </div>
                    <div className="group p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200">
                      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wider font-medium">Return/Pip</span>
                      <p className="text-sm font-bold text-foreground mt-1.5">{formatCompactCurrency(metrics.returnPerPip * exchangeRate, currency)}</p>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="space-y-1.5">
                    {[
                      { label: "Fees", value: formatCompactCurrency((selectedTrade.fees || 0) * exchangeRate, currency) },
                      { label: "Swap", value: formatCompactCurrency((selectedTrade.swap || 0) * exchangeRate, currency) },
                      { label: "Net ROI", value: `${metrics.netROI > 0 ? "+" : ""}${isFinite(metrics.netROI) ? metrics.netROI.toFixed(2) : "0"}%`, color: metrics.netROI >= 0 ? "text-profit" : "text-loss" },
                      { label: "Gross P&L", value: formatCompactCurrency(metrics.grossPnL * exchangeRate, currency), color: metrics.grossPnL >= 0 ? "text-profit" : "text-loss" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200">
                        <span className="text-xs text-muted-foreground/80">{item.label}</span>
                        <span className={`text-sm font-bold tabular-nums ${item.color || "text-foreground"}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Strategy Badge */}
                  {selectedTrade.strategy && selectedTrade.strategy !== "Select" && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                      <span className="text-[10px] text-primary uppercase tracking-wider font-medium">Strategy</span>
                      <p className="text-sm font-semibold text-primary mt-1">{selectedTrade.strategy}</p>
                    </div>
                  )}

                  {/* Trade Rating */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium block mb-3">Trade Rating</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingChange(star)}
                          className="transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors duration-200 ${
                              (journalData.tradeRating || 0) >= star
                                ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                                : "text-white/10 hover:text-white/20"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sentiment */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium block mb-3">How did this trade feel?</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "poor", label: "Poor", icon: TrendingDown, color: "loss" },
                        { key: "okay", label: "Okay", icon: Activity, color: "amber-500" },
                        { key: "great", label: "Great", icon: TrendingUp, color: "profit" },
                      ].map((s) => {
                        const isSelected = journalData.sentiment === s.key;
                        return (
                          <button
                            key={s.key}
                            onClick={() => handleSentimentChange(s.key as "great" | "okay" | "poor")}
                            className={`p-3 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? s.color === "profit" 
                                  ? "bg-profit/15 border-profit/40 text-profit shadow-lg shadow-profit/10"
                                  : s.color === "loss"
                                  ? "bg-loss/15 border-loss/40 text-loss shadow-lg shadow-loss/10"
                                  : "bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-lg shadow-amber-500/10"
                                : "bg-white/[0.02] border-white/[0.06] text-muted-foreground/70 hover:bg-white/[0.05] hover:border-white/[0.12] hover:text-foreground"
                            }`}
                          >
                            <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? '' : 'opacity-60'}`} />
                            <span className="text-xs font-semibold">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Strategy Tab */}
              {mainTab === "strategy" && selectedTrade && (
                <>
                  {selectedTrade.strategy && selectedTrade.strategy !== "Select" ? (
                    <>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="text-xs text-primary uppercase tracking-wider font-medium">Active Strategy</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">{selectedTrade.strategy}</p>
                      </div>

                      {loadingRules ? (
                        <div className="p-8 text-center">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">Loading rules...</span>
                        </div>
                      ) : strategyRules.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider px-1">Rules Compliance</span>
                          {strategyRules.map((rule) => (
                            <button
                              key={rule.id}
                              onClick={() => toggleRuleCompliance(rule.id)}
                              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                                rulesCompliance[rule.id]
                                  ? "bg-profit/10 border-profit/20"
                                  : "bg-muted/20 border-border hover:border-primary/30"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                rulesCompliance[rule.id] ? "bg-profit" : "bg-white/10"
                              }`}>
                                {rulesCompliance[rule.id] && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-sm ${rulesCompliance[rule.id] ? "text-foreground" : "text-muted-foreground"}`}>
                                {rule.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center rounded-xl bg-muted/20 border border-border">
                          <ListChecks className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No rules defined for this strategy</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center rounded-xl bg-muted/20 border border-border">
                      <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-1">No strategy assigned</p>
                      <p className="text-xs text-muted-foreground/70">Assign a strategy to track rule compliance</p>
                    </div>
                  )}
                </>
              )}

              {/* Executions Tab */}
              {mainTab === "executions" && selectedTrade && (
                <>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-transparent border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Execution Summary</span>
                    <p className="text-xl font-semibold text-foreground mt-2">
                      {selectedTrade.quantity || 1} {(selectedTrade.quantity || 1) === 1 ? "Unit" : "Units"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-profit/5 border border-profit/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-profit" />
                        <span className="text-sm font-medium text-profit">Entry</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time</span>
                          <span className="text-foreground font-medium">{formatTime(selectedTrade.EntryTime)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price</span>
                          <span className="text-foreground font-medium">{selectedTrade.entryPrice || "--"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-loss/5 border border-loss/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-loss" />
                        <span className="text-sm font-medium text-loss">Exit</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time</span>
                          <span className="text-foreground font-medium">{formatTime(selectedTrade.ExitTime)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price</span>
                          <span className="text-foreground font-medium">{selectedTrade.exitPrice || "--"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="text-foreground font-medium">
                          {selectedTrade.EntryTime && selectedTrade.ExitTime
                            ? (() => {
                                const [eh, em] = selectedTrade.EntryTime.split(":").map(Number);
                                const [xh, xm] = selectedTrade.ExitTime.split(":").map(Number);
                                const mins = (xh * 60 + xm) - (eh * 60 + em);
                                const hours = Math.floor(mins / 60);
                                const remaining = mins % 60;
                                return hours > 0 ? `${hours}h ${remaining}m` : `${mins}m`;
                              })()
                            : "--"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </motion.div>

        {/* Toggle Right Panel - Desktop Only */}
        <motion.button
          initial={false}
          animate={{ right: isRightPanelCollapsed ? 0 : 340 }}
          onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card border border-border rounded-l-lg hover:bg-muted/50 transition-colors items-center justify-center"
        >
          {isRightPanelCollapsed ? <PanelRightClose className="w-4 h-4 text-muted-foreground" /> : <PanelRightOpen className="w-4 h-4 text-muted-foreground" />}
        </motion.button>
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 right-4 flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium">
                  {lightboxType === "before" ? "Entry Screenshot" : "Exit Screenshot"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isDemo && (
                  <button
                    onClick={() => handleDeleteScreenshot(lightboxType!)}
                    className="px-4 py-2 rounded-xl bg-loss/20 hover:bg-loss/30 text-loss text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={closeLightbox}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
            
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={lightboxImage}
              alt="Screenshot"
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Trade List Drawer */}
      <AnimatePresence>
        {isMobileTradeListOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-background/80 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileTradeListOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-card border-r border-border flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Trades</span>
                <button
                  onClick={() => setIsMobileTradeListOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search trades..."
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredTrades.map((trade, idx) => {
                  const isSelected = (trade.id || trade._id) === (selectedTrade?.id || selectedTrade?._id);
                  const tradeProfit = trade.Profit >= 0;
                  return (
                    <button
                      key={trade.id || trade._id || idx}
                      onClick={() => {
                        setSelectedTrade(trade);
                        setSelectedTradeIndex(idx);
                        setIsMobileTradeListOpen(false);
                      }}
                      className={`w-full p-4 text-left border-b border-border/30 transition-all ${
                        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SymbolLogo symbol={trade.Item || trade.symbol || ""} size="sm" />
                          <div>
                            <span className="font-medium text-foreground text-sm">{trade.Item || trade.symbol}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{formatDate(trade.date)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${tradeProfit ? "text-profit" : "text-loss"}`}>
                          {tradeProfit ? "+" : ""}{formatCompactCurrency(trade.Profit * exchangeRate, currency)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Stats Drawer */}
      <AnimatePresence>
        {isMobileStatsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-background/80 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileStatsOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[90%] max-w-[360px] bg-card border-l border-border flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex gap-1 p-1 bg-muted/20 rounded-xl border border-border flex-1 mr-2">
                  {[
                    { key: "stats", label: "Stats", icon: BarChart2 },
                    { key: "strategy", label: "Strategy", icon: Target },
                    { key: "executions", label: "Exec", icon: Activity },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setMainTab(tab.key as typeof mainTab)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        mainTab === tab.key ? "bg-muted/50 text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsMobileStatsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Stats Tab - Mobile */}
                {mainTab === "stats" && selectedTrade && metrics && (
                  <>
                    <div className={`p-4 rounded-2xl border ${isProfit ? "bg-profit/5 border-profit/20" : "bg-loss/5 border-loss/20"}`}>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Net P&L</span>
                      <div className="mt-1">
                        <span className={`text-2xl font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
                          {isProfit ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit * exchangeRate, currency)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-muted/20 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase">Side</span>
                        <p className={`text-sm font-semibold mt-1 ${
                          (selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long") ? "text-profit" : "text-loss"
                        }`}>{selectedTrade.Type || selectedTrade.side}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase">Qty</span>
                        <p className="text-sm font-semibold text-foreground mt-1">{selectedTrade.quantity || "--"}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border">
                      <span className="text-xs text-muted-foreground block mb-2">Trade Rating</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => handleRatingChange(star)}>
                            <Star className={`w-5 h-5 ${(journalData.tradeRating || 0) >= star ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Strategy Tab - Mobile */}
                {mainTab === "strategy" && selectedTrade && (
                  <>
                    {selectedTrade.strategy && selectedTrade.strategy !== "Select" ? (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                        <span className="text-xs text-primary uppercase tracking-wider">Active Strategy</span>
                        <p className="text-lg font-semibold text-foreground mt-1">{selectedTrade.strategy}</p>
                      </div>
                    ) : (
                      <div className="p-6 text-center rounded-xl bg-muted/20 border border-border">
                        <Target className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No strategy assigned</p>
                      </div>
                    )}
                  </>
                )}

                {/* Executions Tab - Mobile */}
                {mainTab === "executions" && selectedTrade && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-profit/5 border border-profit/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-profit" />
                        <span className="text-xs font-medium text-profit">Entry</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price</span>
                        <span className="text-foreground font-medium">{selectedTrade.entryPrice || "--"}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-loss/5 border border-loss/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-loss" />
                        <span className="text-xs font-medium text-loss">Exit</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price</span>
                        <span className="text-foreground font-medium">{selectedTrade.exitPrice || "--"}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {shareModal && (
        <ShareTradeModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal(null)}
          tradeId={shareModal.tradeId}
          accountId={shareModal.accountId}
          tradeSummary={shareModal.tradeSummary}
        />
      )}
    </div>
  );
};

export default DailyJournal;
