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
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts";
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
  reasonForEntry?: string;
  setupValidation?: string;
  exitRationale?: string;
  emotionalState?: string;
  mistakes?: string;
  whatWentWell?: string;
  improvements?: string;
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
  const { setAccounts, profileData } = useAccountDetails();
  const { selectedAccounts } = useModeFilteredAccounts();
  const { currency, exchangeRate } = useCurrencyStore();
  const tokenn = Cookies.get("ProJournX") || "";

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
  const [tradeFilter, setTradeFilter] = useState<"all" | "winners" | "losers">("all");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Removed tab states - now using single scrollable view for center content and right panel

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

  // Keyboard navigation for trades
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focused on an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") return;
      
      const finalFilteredTrades = filteredTrades.filter(t => {
        if (tradeFilter === "winners") return t.Profit >= 0;
        if (tradeFilter === "losers") return t.Profit < 0;
        return true;
      });
      
      if (finalFilteredTrades.length === 0) return;
      
      const currentIdx = finalFilteredTrades.findIndex(t => (t.id || t._id) === (selectedTrade?.id || selectedTrade?._id));
      
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const newIdx = currentIdx <= 0 ? finalFilteredTrades.length - 1 : currentIdx - 1;
        setSelectedTrade(finalFilteredTrades[newIdx]);
        setSelectedTradeIndex(newIdx);
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const newIdx = currentIdx >= finalFilteredTrades.length - 1 ? 0 : currentIdx + 1;
        setSelectedTrade(finalFilteredTrades[newIdx]);
        setSelectedTradeIndex(newIdx);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!isDemo && !isSaving) handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredTrades, tradeFilter, selectedTrade, isDemo, isSaving]);

  // Track unsaved changes
  useEffect(() => {
    if (selectedTrade) {
      const originalData = selectedTrade.jrData || {};
      const hasChanges = JSON.stringify(journalData) !== JSON.stringify(originalData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [journalData, selectedTrade]);

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
      
      // Update selectedTrade with the saved jrData to sync state
      setSelectedTrade(prev => prev ? { ...prev, jrData: jrDataWithRules } : null);
      setTrades(prev => prev.map(t => 
        (t.id || t._id) === tradeId ? { ...t, jrData: jrDataWithRules } : t
      ));
      
      // Reset unsaved changes indicator
      setHasUnsavedChanges(false);
      
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
        
        <div className="px-2 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
          {/* Left: Trade Navigation */}
          <div className="flex items-center gap-1 sm:gap-4 min-w-0 flex-shrink overflow-hidden">
            {/* Mobile Trade List Toggle */}
            <button
              onClick={() => setIsMobileTradeListOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border transition-all flex-shrink-0"
              aria-label="Open trade list"
            >
              <Layers className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => navigateTrade("prev")}
                className="p-1 sm:p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </button>
              <div className="px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] min-w-[40px] sm:min-w-[56px] text-center">
                <span className="text-[10px] sm:text-sm font-semibold text-foreground tabular-nums">{currentTradeNumber}</span>
                <span className="text-[10px] sm:text-sm text-muted-foreground/60">/{filteredTrades.length}</span>
              </div>
              <button
                onClick={() => navigateTrade("next")}
                className="p-1 sm:p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Current Trade Info */}
            {selectedTrade && (
              <div className="flex items-center gap-1.5 sm:gap-3 pl-1.5 sm:pl-4 border-l border-border min-w-0 overflow-hidden">
                <SymbolLogo symbol={selectedTrade.Item || selectedTrade.symbol || ""} size="sm" />
                <div className="min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[60px] sm:max-w-none">{selectedTrade.Item || selectedTrade.symbol}</span>
                    <span className={`hidden sm:inline px-2 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0 ${
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
                <span className={`sm:hidden text-xs font-bold flex-shrink-0 ${isProfit ? "text-profit" : "text-loss"}`}>
                  {isProfit ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit * exchangeRate, currency)}
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
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
              className={`group relative flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-xl text-white font-semibold text-[10px] sm:text-sm transition-all duration-300 disabled:opacity-50 shadow-lg ${
                hasUnsavedChanges 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20 hover:shadow-amber-500/30" 
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/30"
              }`}
            >
              {hasUnsavedChanges && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              )}
              <Save className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden xs:inline sm:inline">{isSaving ? "..." : hasUnsavedChanges ? "Save" : "Saved"}</span>
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
            {/* Search & Filters */}
            <div className="p-3 border-b border-white/[0.06] space-y-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trades..."
                  className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all duration-200"
                />
              </div>
              {/* Filter Buttons */}
              <div className="flex gap-1">
                {[
                  { key: "all", label: "All" },
                  { key: "winners", label: "Winners", color: "profit" },
                  { key: "losers", label: "Losers", color: "loss" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTradeFilter(f.key as "all" | "winners" | "losers")}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      tradeFilter === f.key
                        ? f.color === "profit"
                          ? "bg-profit/15 text-profit border border-profit/30"
                          : f.color === "loss"
                          ? "bg-loss/15 text-loss border border-loss/30"
                          : "bg-primary/15 text-primary border border-primary/30"
                        : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] border border-transparent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trade List with Day Grouping */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
              {(() => {
                // Group trades by date
                const groupedTrades: { [key: string]: typeof filteredTrades } = {};
                const finalFilteredTrades = filteredTrades.filter(t => {
                  if (tradeFilter === "winners") return t.Profit >= 0;
                  if (tradeFilter === "losers") return t.Profit < 0;
                  return true;
                });
                
                finalFilteredTrades.forEach(trade => {
                  const dateKey = trade.date || "Unknown";
                  if (!groupedTrades[dateKey]) groupedTrades[dateKey] = [];
                  groupedTrades[dateKey].push(trade);
                });

                const getDateLabel = (dateStr: string) => {
                  const today = new Date().toISOString().split('T')[0];
                  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                  if (dateStr === today) return "Today";
                  if (dateStr === yesterday) return "Yesterday";
                  return formatDate(dateStr);
                };

                const sortedDates = Object.keys(groupedTrades).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                if (sortedDates.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm text-muted-foreground/70 mb-1">No trades found</p>
                      <p className="text-xs text-muted-foreground/50">
                        {tradeFilter !== "all" ? "Try changing the filter" : "Add trades to get started"}
                      </p>
                    </div>
                  );
                }

                return sortedDates.map(dateKey => (
                  <div key={dateKey} className="mb-3">
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 px-2 py-1.5 mb-1 bg-background/95 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                          {getDateLabel(dateKey)}
                        </span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[9px] text-muted-foreground/50">
                          {groupedTrades[dateKey].length} trade{groupedTrades[dateKey].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    {/* Trades for this date */}
                    <div className="space-y-1">
                      {groupedTrades[dateKey].map((trade, idx) => {
                        const globalIdx = finalFilteredTrades.indexOf(trade);
                        const isSelected = (trade.id || trade._id) === (selectedTrade?.id || selectedTrade?._id);
                        const tradeProfit = trade.Profit >= 0;
                        const hasJournalData = trade.jrData?.widw || trade.jrData?.tradeRating;
                        return (
                          <motion.button
                            key={trade.id || trade._id || idx}
                            onClick={() => {
                              setSelectedTrade(trade);
                              setSelectedTradeIndex(globalIdx);
                            }}
                            className={`w-full p-2.5 text-left rounded-xl transition-all duration-200 group ${
                              isSelected 
                                ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/5" 
                                : "hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08]"
                            }`}
                            whileHover={{ scale: isSelected ? 1 : 1.005 }}
                            whileTap={{ scale: 0.995 }}
                          >
                            <div className="flex items-center gap-2.5">
                              <SymbolLogo 
                                symbol={trade.Item || trade.symbol || ""} 
                                size="sm" 
                                isProfit={tradeProfit}
                                isSelected={isSelected}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`font-semibold text-sm truncate ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>
                                    {trade.Item || trade.symbol}
                                  </span>
                                  <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${tradeProfit ? "text-profit" : "text-loss"}`}>
                                    {tradeProfit ? "+" : ""}{formatCompactCurrency(trade.Profit * exchangeRate, currency)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground/60">{formatTime(trade.EntryTime || trade.time)}</span>
                                  {trade.strategy && trade.strategy !== "Select" && (
                                    <>
                                      <span className="text-muted-foreground/30">·</span>
                                      <span className="text-[10px] text-primary/60 truncate max-w-[70px]">{trade.strategy}</span>
                                    </>
                                  )}
                                  {hasJournalData && (
                                    <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                                      Journaled
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
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
          {/* Hero Summary Bar - Always Visible */}
          {selectedTrade && metrics && (
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* P&L Hero */}
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl ${isProfit ? 'bg-profit/10 border border-profit/20' : 'bg-loss/10 border border-loss/20'}`}>
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider block">Net P&L</span>
                    <span className={`text-xl font-bold tabular-nums ${isProfit ? 'text-profit' : 'text-loss'}`}>
                      {isProfit ? '+' : ''}{formatCompactCurrency(selectedTrade.Profit * exchangeRate, currency)}
                    </span>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-center px-3">
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block">Entry</span>
                      <span className="text-xs font-semibold text-foreground">{formatTime(selectedTrade.EntryTime || selectedTrade.time)}</span>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="text-center px-3">
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block">Exit</span>
                      <span className="text-xs font-semibold text-foreground">{formatTime(selectedTrade.ExitTime)}</span>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="text-center px-3">
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block">Pips</span>
                      <span className="text-xs font-semibold text-primary">{metrics.pips}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Rating & Sentiment */}
                <div className="flex items-center gap-3">
                  {/* Star Rating - supports half stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = journalData.tradeRating || 0;
                      const isFullStar = rating >= star;
                      const isHalfStar = rating >= star - 0.5 && rating < star;
                      return (
                        <button
                          key={star}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const isLeftHalf = clickX < rect.width / 2;
                            handleRatingChange(isLeftHalf ? star - 0.5 : star);
                          }}
                          className="relative transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <Star className="w-4 h-4 text-white/10" />
                          {isFullStar && (
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 absolute inset-0" />
                          )}
                          {isHalfStar && (
                            <div className="absolute inset-0 overflow-hidden w-1/2">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {journalData.tradeRating ? (
                      <span className="text-xs text-amber-400 ml-1">{journalData.tradeRating}</span>
                    ) : null}
                  </div>

                  {/* Quick Sentiment */}
                  <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                    {[
                      { key: "poor", icon: TrendingDown, color: "loss" },
                      { key: "okay", icon: Activity, color: "amber-500" },
                      { key: "great", icon: TrendingUp, color: "profit" },
                    ].map((s) => {
                      const isSelected = journalData.sentiment === s.key;
                      return (
                        <button
                          key={s.key}
                          onClick={() => handleSentimentChange(s.key as "great" | "okay" | "poor")}
                          className={`p-1.5 rounded-md transition-all duration-200 ${
                            isSelected
                              ? s.color === "profit" 
                                ? "bg-profit/20 text-profit"
                                : s.color === "loss"
                                ? "bg-loss/20 text-loss"
                                : "bg-amber-500/20 text-amber-500"
                              : "text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.05]"
                          }`}
                          title={s.key.charAt(0).toUpperCase() + s.key.slice(1)}
                        >
                          <s.icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Center Main Content - Single Scrollable View */}
          <div className="flex-1 overflow-y-auto">
            {selectedTrade && (
              <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
                
                {/* Screenshots Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Trade Screenshots</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Before Screenshot */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-muted-foreground">Before Entry</span>
                        {selectedTrade.beforeURL && (
                          <button
                            onClick={() => openLightbox(selectedTrade.beforeURL!, "before")}
                            className="ml-auto p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] transition-all"
                          >
                            <Maximize2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden relative group aspect-video">
                        {selectedTrade.beforeURL ? (
                          <img
                            src={selectedTrade.beforeURL}
                            alt="Before trade"
                            className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => openLightbox(selectedTrade.beforeURL!, "before")}
                          />
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-white/[0.03] transition-colors">
                            <Upload className="w-5 h-5 text-muted-foreground/40 mb-1" />
                            <span className="text-[10px] text-muted-foreground/60">Upload</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "before")} />
                          </label>
                        )}
                      </div>
                    </div>
                    
                    {/* After Screenshot */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isProfit ? 'bg-profit' : 'bg-loss'}`} />
                        <span className="text-xs font-medium text-muted-foreground">After Exit</span>
                        {selectedTrade.afterURL && (
                          <button
                            onClick={() => openLightbox(selectedTrade.afterURL!, "after")}
                            className="ml-auto p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] transition-all"
                          >
                            <Maximize2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden relative group aspect-video">
                        {selectedTrade.afterURL ? (
                          <img
                            src={selectedTrade.afterURL}
                            alt="After trade"
                            className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => openLightbox(selectedTrade.afterURL!, "after")}
                          />
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-white/[0.03] transition-colors">
                            <Upload className="w-5 h-5 text-muted-foreground/40 mb-1" />
                            <span className="text-[10px] text-muted-foreground/60">Upload</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "after")} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                {/* Trade Narrative Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Trade Narrative</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] focus-within:border-primary/30 transition-colors">
                      <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium block mb-1.5">
                        Why did you enter this trade?
                      </label>
                      <textarea
                        value={journalData.reasonForEntry || ""}
                        onChange={(e) => setJournalData((prev) => ({ ...prev, reasonForEntry: e.target.value }))}
                        placeholder="Describe the setup, signals, and your reasoning..."
                        rows={2}
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] focus-within:border-primary/30 transition-colors">
                      <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium block mb-1.5">
                        How did you manage & exit?
                      </label>
                      <textarea
                        value={journalData.exitRationale || ""}
                        onChange={(e) => setJournalData((prev) => ({ ...prev, exitRationale: e.target.value }))}
                        placeholder="Target hit, stopped out, or manual exit? What did you observe?"
                        rows={2}
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                {/* Lessons & Reflection Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-foreground">Lessons & Reflection</h3>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] focus-within:border-amber-500/30 transition-colors">
                    <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium block mb-1.5">
                      What did you learn from this trade?
                    </label>
                    <textarea
                      value={journalData.lessonsLearned || ""}
                      onChange={(e) => setJournalData((prev) => ({ ...prev, lessonsLearned: e.target.value }))}
                      placeholder="Key takeaways, mistakes to avoid, patterns to remember..."
                      rows={2}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] focus-within:border-primary/30 transition-colors">
                    <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium block mb-1.5">
                      How were you feeling during this trade?
                    </label>
                    <textarea
                      value={journalData.emotionalState || ""}
                      onChange={(e) => setJournalData((prev) => ({ ...prev, emotionalState: e.target.value }))}
                      placeholder="Confident, anxious, impulsive, calm..."
                      rows={2}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                {/* Quick Tags Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-foreground">Quick Tags</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {["A+ Setup", "Followed Rules", "Emotional Entry", "FOMO", "Revenge Trade", "Patience Paid", "Early Exit", "Perfect Execution"].map((tag) => {
                      const isActive = journalData.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            setJournalData(prev => ({
                              ...prev,
                              tags: isActive 
                                ? (prev.tags || []).filter(t => t !== tag)
                                : [...(prev.tags || []), tag]
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : "bg-white/[0.03] text-muted-foreground border border-white/[0.08] hover:bg-white/[0.06] hover:text-foreground"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Notes Section */}
                <div className="space-y-3 pb-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-foreground">Daily Notes</h3>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] focus-within:border-blue-500/30 transition-colors">
                    <textarea
                      value={journalData.dailyNotes || ""}
                      onChange={(e) => setJournalData((prev) => ({ ...prev, dailyNotes: e.target.value }))}
                      placeholder="General notes about your trading day, market conditions, mindset..."
                      rows={3}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Panel - Unified Stats & Strategy */}
        <motion.div
          initial={false}
          animate={{ width: isRightPanelCollapsed ? 0 : 280 }}
          className="hidden lg:block flex-shrink-0 border-l border-white/[0.06] bg-gradient-to-b from-card/80 to-background overflow-hidden"
        >
          <div className="w-[280px] h-full flex flex-col">
            {/* Right Panel Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Trade Details</h3>
              </div>
            </div>

            {/* Right Panel Content - Single Scrollable View */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
              {selectedTrade && metrics && (
                <>
                  {/* Timing */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Entry</span>
                      <p className="text-[11px] font-semibold text-foreground mt-0.5">{formatTime(selectedTrade.EntryTime || selectedTrade.time)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Exit</span>
                      <p className="text-[11px] font-semibold text-foreground mt-0.5">{formatTime(selectedTrade.ExitTime)}</p>
                    </div>
                  </div>

                  {/* Position & Performance Grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Side</span>
                      <p className={`text-xs font-bold mt-0.5 ${
                        (selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long" || selectedTrade.Type?.toLowerCase() === "buy")
                          ? "text-profit" : "text-loss"
                      }`}>
                        {selectedTrade.Type || selectedTrade.side || "--"}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Size</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{selectedTrade.quantity || selectedTrade.Size || "--"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Pips</span>
                      <p className="text-xs font-bold text-primary mt-0.5">{metrics.pips}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">ROI</span>
                      <p className={`text-xs font-bold mt-0.5 ${metrics.netROI >= 0 ? "text-profit" : "text-loss"}`}>
                        {metrics.netROI > 0 ? "+" : ""}{isFinite(metrics.netROI) ? metrics.netROI.toFixed(1) : "0"}%
                      </p>
                    </div>
                  </div>

                  {/* Costs (Compact) */}
                  <div className="flex gap-2 text-[10px]">
                    <span className="text-muted-foreground/50">Fees: <span className="text-foreground">{formatCompactCurrency((selectedTrade.fees || 0) * exchangeRate, currency)}</span></span>
                    <span className="text-muted-foreground/50">Swap: <span className="text-foreground">{formatCompactCurrency((selectedTrade.swap || 0) * exchangeRate, currency)}</span></span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.06]" />

                  {/* Strategy Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Strategy</span>
                    </div>
                    <select
                      value={selectedTrade.strategy || ""}
                      onChange={(e) => {
                        const newStrategy = e.target.value;
                        setSelectedTrade(prev => prev ? { ...prev, strategy: newStrategy } : null);
                        setTrades(prev => prev.map(t => 
                          (t.id || t._id) === (selectedTrade.id || selectedTrade._id) 
                            ? { ...t, strategy: newStrategy } 
                            : t
                        ));
                        if (newStrategy && newStrategy !== "Select") {
                          fetchStrategyRules(newStrategy);
                        } else {
                          setStrategyRules([]);
                          setRulesCompliance({});
                        }
                      }}
                      className="w-full px-2.5 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-foreground focus:outline-none focus:border-primary/40 transition-all cursor-pointer"
                    >
                      <option value="" className="bg-card text-muted-foreground">Select strategy...</option>
                      {existingStrategies.map((strategy) => (
                        <option key={strategy} value={strategy} className="bg-card text-foreground">
                          {strategy}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Strategy Rules Compliance - Show only if strategy selected */}
                  {strategyRules.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider px-0.5">Rules Compliance</span>
                      <div className="space-y-1">
                        {strategyRules.slice(0, 4).map((rule: { id: string; text: string }, idx) => (
                          <div 
                            key={rule.id || idx} 
                            className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer"
                            onClick={() => {
                              setRulesCompliance(prev => ({
                                ...prev,
                                [rule.id]: prev[rule.id] === true ? false : prev[rule.id] === false ? undefined : true
                              }));
                            }}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                              rulesCompliance[rule.id] === true 
                                ? "bg-profit/20 text-profit border border-profit/30"
                                : rulesCompliance[rule.id] === false 
                                ? "bg-loss/20 text-loss border border-loss/30"
                                : "bg-white/[0.05] border border-white/[0.1]"
                            }`}>
                              {rulesCompliance[rule.id] === true && <Check className="w-3 h-3" />}
                              {rulesCompliance[rule.id] === false && <X className="w-3 h-3" />}
                            </div>
                            <span className="text-[10px] text-foreground truncate">{rule.text}</span>
                          </div>
                        ))}
                        {strategyRules.length > 4 && (
                          <p className="text-[9px] text-muted-foreground/50 px-1">+{strategyRules.length - 4} more rules</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </motion.div>

        {/* Toggle Right Panel - Desktop Only */}
        <motion.button
          initial={false}
          animate={{ right: isRightPanelCollapsed ? 0 : 280 }}
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
                      <div className="flex gap-1 items-center">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = journalData.tradeRating || 0;
                          const isFullStar = rating >= star;
                          const isHalfStar = rating >= star - 0.5 && rating < star;
                          return (
                            <button
                              key={star}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const isLeftHalf = clickX < rect.width / 2;
                                handleRatingChange(isLeftHalf ? star - 0.5 : star);
                              }}
                              className="relative"
                            >
                              <Star className="w-5 h-5 text-muted-foreground/30" />
                              {isFullStar && (
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400 absolute inset-0" />
                              )}
                              {isHalfStar && (
                                <div className="absolute inset-0 overflow-hidden w-1/2">
                                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                        {journalData.tradeRating ? (
                          <span className="text-xs text-amber-400 ml-1">{journalData.tradeRating}</span>
                        ) : null}
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
