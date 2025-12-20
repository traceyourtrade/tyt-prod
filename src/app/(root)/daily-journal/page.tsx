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
import TradeChart from "@/components/daily-journal/TradeChart";

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

const demoTemplates: Template[] = [
  {
    name: "Trade Review",
    description: "Comprehensive review of your trade execution",
    icon: "ClipboardCheck",
    color: "blue",
    prompts: [
      { id: "went_well", label: "What went well?", placeholder: "Describe the positive aspects of this trade...", type: "textarea" },
      { id: "improve", label: "What could improve?", placeholder: "Areas for improvement...", type: "textarea" },
      { id: "lessons", label: "Key lessons learned", placeholder: "What will you remember from this trade?", type: "textarea" },
      { id: "follow_plan", label: "Did you follow your plan?", placeholder: "Yes/No and explain...", type: "textarea" },
    ],
    isPremade: true,
  },
  {
    name: "Quick Notes",
    description: "Simple freeform notes for fast journaling",
    icon: "Zap",
    color: "yellow",
    prompts: [{ id: "notes", label: "Trade Notes", placeholder: "Write your thoughts about this trade...", type: "textarea" }],
    isPremade: true,
  },
  {
    name: "Setup Analysis",
    description: "Analyze your entry and exit decisions",
    icon: "Target",
    color: "green",
    prompts: [
      { id: "entry_reason", label: "Entry Reason", placeholder: "Why did you enter this trade?", type: "textarea" },
      { id: "exit_reason", label: "Exit Reason", placeholder: "Why did you exit?", type: "textarea" },
      { id: "setup_grade", label: "Setup Quality (1-10)", placeholder: "Rate your setup...", type: "text" },
      { id: "would_take_again", label: "Would you take this trade again?", placeholder: "Yes/No and why...", type: "textarea" },
    ],
    isPremade: true,
  },
  {
    name: "Emotional Check",
    description: "Track your mindset and emotions",
    icon: "Heart",
    color: "pink",
    prompts: [
      { id: "mindset_before", label: "Mindset before trade", placeholder: "How were you feeling before entering?", type: "textarea" },
      { id: "emotions_during", label: "Emotions during trade", placeholder: "What emotions came up while in the trade?", type: "textarea" },
      { id: "mindset_after", label: "Mindset after trade", placeholder: "How do you feel about the outcome?", type: "textarea" },
      { id: "confidence", label: "Confidence level (1-10)", placeholder: "Rate your confidence...", type: "text" },
    ],
    isPremade: true,
  },
];

const demoTrades: Trade[] = [
  { id: "demo-1", date: new Date().toISOString().split("T")[0], EntryTime: "09:32:00", ExitTime: "10:45:00", Profit: 280.98, Item: "XAUUSD", symbol: "XAUUSD", Type: "Short", side: "Short", strategy: "Breakout", entryPrice: "2672.2", exitPrice: "2662.764", quantity: 0.3, stopLoss: 2700, takeProfit: 2650, fees: 2.1, swap: 0, jrData: { sentiment: "great", tradeRating: 5, tags: ["Perfect Setup", "Followed Plan"] } },
  { id: "demo-2", date: new Date().toISOString().split("T")[0], EntryTime: "10:15:00", ExitTime: "11:30:00", Profit: -380, Item: "TSLA", symbol: "TSLA", Type: "Short", side: "Short", strategy: "Breakout", entryPrice: "245.80", exitPrice: "248.10", quantity: 100, fees: 1.5 },
  { id: "demo-3", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], EntryTime: "11:45:00", ExitTime: "14:20:00", Profit: 890, Item: "NVDA", symbol: "NVDA", Type: "Long", side: "Long", strategy: "Scalping", entryPrice: "485.20", exitPrice: "492.75", quantity: 50, jrData: { sentiment: "okay", tradeRating: 4 } },
  { id: "demo-4", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], EntryTime: "14:20:00", ExitTime: "15:30:00", Profit: -520, Item: "MSFT", symbol: "MSFT", Type: "Long", side: "Long", strategy: "Swing", entryPrice: "378.90", exitPrice: "375.40", quantity: 25 },
  { id: "demo-5", date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], EntryTime: "09:55:00", ExitTime: "12:10:00", Profit: 2100, Item: "META", symbol: "META", Type: "Long", side: "Long", strategy: "Reversal", entryPrice: "312.50", exitPrice: "324.80", quantity: 75, jrData: { sentiment: "great", tradeRating: 5, tags: ["News Play"] } },
  { id: "demo-6", date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], EntryTime: "13:10:00", ExitTime: "14:45:00", Profit: 450, Item: "GOOGL", symbol: "GOOGL", Type: "Short", side: "Short", strategy: "Momentum", entryPrice: "141.20", exitPrice: "138.95", quantity: 100 },
];

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

  const [trades, setTrades] = useState<Trade[]>(demoTrades);
  const [templates, setTemplates] = useState<Template[]>(demoTemplates);
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
        setTemplates(demoTemplates);
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
    <div className="h-screen bg-[#08090b] overflow-hidden flex flex-col">
      {/* Top Header Bar */}
      <div className="flex-shrink-0 border-b border-white/[0.06] bg-[#0c0d10]/80 backdrop-blur-xl">
        <div className="h-[2px] bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500" />
        
        <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
          {/* Left: Trade Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Trade List Toggle */}
            <button
              onClick={() => setIsMobileTradeListOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
              aria-label="Open trade list"
            >
              <Layers className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => navigateTrade("prev")}
                className="p-1.5 sm:p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-xs sm:text-sm font-medium text-foreground">{currentTradeNumber}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">/{filteredTrades.length}</span>
              </div>
              <button
                onClick={() => navigateTrade("next")}
                className="p-1.5 sm:p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Current Trade Info - Hide date on mobile */}
            {selectedTrade && (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-white/[0.06]">
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
              className="lg:hidden p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
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
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-sm text-muted-foreground hover:text-foreground transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden md:inline">Share</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isDemo || isSaving}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
          className="hidden md:block flex-shrink-0 border-r border-white/[0.06] bg-[#0a0b0e] overflow-hidden"
        >
          <div className="w-[280px] h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trades..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Trade List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                    className={`w-full p-4 text-left border-b border-white/[0.03] transition-all ${
                      isSelected 
                        ? "bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-l-primary" 
                        : "hover:bg-white/[0.02]"
                    }`}
                    whileHover={{ x: isSelected ? 0 : 4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SymbolLogo symbol={trade.Item || trade.symbol || ""} size="sm" />
                        <div>
                          <span className="font-medium text-foreground text-sm">{trade.Item || trade.symbol}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{formatDate(trade.date)}</span>
                            {trade.strategy && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-[10px] text-muted-foreground">{trade.strategy}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${tradeProfit ? "text-profit" : "text-loss"}`}>
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
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 p-1.5 bg-[#0c0d10] border border-white/[0.06] rounded-r-lg hover:bg-white/[0.05] transition-colors items-center justify-center"
        >
          {isLeftPanelCollapsed ? <PanelRightOpen className="w-4 h-4 text-muted-foreground" /> : <PanelRightClose className="w-4 h-4 text-muted-foreground" />}
        </motion.button>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Center Tab Bar */}
          <div className="flex-shrink-0 px-3 sm:px-6 py-2 sm:py-3 border-b border-white/[0.06] flex items-center justify-between gap-2 bg-[#0a0b0e]/50">
            <div className="flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/[0.06]">
              {[
                { key: "chart", label: "Chart", icon: LineChart },
                { key: "notes", label: "Notes", icon: MessageSquare },
                { key: "runningPnL", label: "P&L", icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCenterTab(tab.key as typeof centerTab)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    centerTab === tab.key
                      ? "bg-white/[0.08] text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {centerTab === "chart" && (
              <div className="hidden sm:flex items-center gap-1 text-xs">
                {["5y", "1y", "3m", "1m", "4h", "1h", "D"].map((tf) => (
                  <button
                    key={tf}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all ${
                      tf === "4h"
                        ? "bg-primary/20 text-primary font-medium"
                        : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center Main Content */}
          <div className="flex-1 overflow-hidden">
            {centerTab === "chart" && selectedTrade && (
              <div className="h-full relative bg-[#08090b]">
                <TradeChart
                  symbol={selectedTrade.Item || selectedTrade.symbol || ""}
                  date={selectedTrade.date?.split("T")[0] || new Date().toISOString().split("T")[0]}
                  entryPrice={selectedTrade.entryPrice ? parseFloat(String(selectedTrade.entryPrice)) : undefined}
                  exitPrice={selectedTrade.exitPrice ? parseFloat(String(selectedTrade.exitPrice)) : undefined}
                  entryTime={selectedTrade.EntryTime}
                  exitTime={selectedTrade.ExitTime}
                  isLong={(selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long" || selectedTrade.Type?.toLowerCase() === "buy")}
                  interval="5min"
                />
              </div>
            )}

            {centerTab === "notes" && (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Notes Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/[0.06] w-fit">
                    <button
                      onClick={() => setNotesTab("trade")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        notesTab === "trade" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Trade Note
                    </button>
                    <button
                      onClick={() => setNotesTab("daily")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        notesTab === "daily" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Daily Journal
                    </button>
                  </div>

                  {notesTab === "trade" ? (
                    <div className="space-y-6">
                      {/* Template Selector */}
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Template</h3>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
                                    : "bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground border-white/[0.06]"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {template.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Journal Prompts */}
                      <div className="space-y-4">
                        {templates[selectedTemplateIdx]?.prompts.map((prompt) => (
                          <div key={prompt.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-foreground font-medium">{prompt.label}</label>
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
                                rows={4}
                                placeholder={prompt.placeholder}
                                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                              />
                            ) : (
                              <input
                                type="text"
                                value={journalData.prompts?.[prompt.id] || ""}
                                onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                                placeholder={prompt.placeholder}
                                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Quick Tags */}
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <h3 className="text-sm font-medium text-foreground mb-3">Quick Tags</h3>
                        {journalData.tags && journalData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {journalData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium border border-primary/20"
                              >
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-primary/70">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {commonTags.filter(t => !journalData.tags?.includes(t)).map((tag) => (
                            <button
                              key={tag}
                              onClick={() => handleAddTag(tag)}
                              className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-all border border-white/[0.06]"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Daily Journal Entry</h3>
                        <textarea
                          value={journalData.dailyNotes || ""}
                          onChange={(e) => handleDailyNotesChange(e.target.value)}
                          rows={12}
                          placeholder="Write about your trading day, market conditions, mindset, and key takeaways..."
                          className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none transition-colors"
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
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent flex items-center justify-center mb-4 mx-auto border border-white/[0.06]">
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
          className="hidden lg:block flex-shrink-0 border-l border-white/[0.06] bg-[#0a0b0e] overflow-hidden"
        >
          <div className="w-[340px] h-full flex flex-col">
            {/* Right Panel Tabs */}
            <div className="flex-shrink-0 p-4 border-b border-white/[0.06]">
              <div className="flex gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                {[
                  { key: "stats", label: "Stats", icon: BarChart2 },
                  { key: "strategy", label: "Strategy", icon: Target },
                  { key: "executions", label: "Executions", icon: Activity },
                  { key: "attachments", label: "Media", icon: ImageIcon },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMainTab(tab.key as typeof mainTab)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      mainTab === tab.key
                        ? "bg-white/[0.08] text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Panel Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
              {/* Stats Tab */}
              {mainTab === "stats" && selectedTrade && metrics && (
                <>
                  {/* Hero P&L Card */}
                  <div className={`p-5 rounded-2xl border ${isProfit ? "bg-profit/5 border-profit/20" : "bg-loss/5 border-loss/20"}`}>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net P&L</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className={`text-3xl font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
                        {isProfit ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit * exchangeRate, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Trade Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Side</span>
                      <p className={`text-sm font-semibold mt-1 ${
                        (selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long" || selectedTrade.Type?.toLowerCase() === "buy")
                          ? "text-profit"
                          : "text-loss"
                      }`}>
                        {selectedTrade.Type || selectedTrade.side || "--"}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Quantity</span>
                      <p className="text-sm font-semibold text-foreground mt-1">{selectedTrade.quantity || "--"}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pips</span>
                      <p className="text-sm font-semibold text-primary mt-1">{metrics.pips}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Return/Pip</span>
                      <p className="text-sm font-semibold text-foreground mt-1">{formatCompactCurrency(metrics.returnPerPip * exchangeRate, currency)}</p>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="space-y-2">
                    {[
                      { label: "Fees", value: formatCompactCurrency((selectedTrade.fees || 0) * exchangeRate, currency) },
                      { label: "Swap", value: formatCompactCurrency((selectedTrade.swap || 0) * exchangeRate, currency) },
                      { label: "Net ROI", value: `${metrics.netROI > 0 ? "+" : ""}${isFinite(metrics.netROI) ? metrics.netROI.toFixed(2) : "0"}%`, color: metrics.netROI >= 0 ? "text-profit" : "text-loss" },
                      { label: "Gross P&L", value: formatCompactCurrency(metrics.grossPnL * exchangeRate, currency), color: metrics.grossPnL >= 0 ? "text-profit" : "text-loss" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className={`text-sm font-semibold ${item.color || "text-foreground"}`}>{item.value}</span>
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
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-xs text-muted-foreground block mb-3">Trade Rating</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingChange(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              (journalData.tradeRating || 0) >= star
                                ? "text-amber-400 fill-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sentiment */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-xs text-muted-foreground block mb-3">How did this trade feel?</span>
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
                            className={`p-3 rounded-xl border transition-all ${
                              isSelected
                                ? s.color === "profit" 
                                  ? "bg-profit/10 border-profit/30 text-profit"
                                  : s.color === "loss"
                                  ? "bg-loss/10 border-loss/30 text-loss"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:border-white/10"
                            }`}
                          >
                            <s.icon className="w-5 h-5 mx-auto mb-1.5" />
                            <span className="text-xs font-medium">{s.label}</span>
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
                                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"
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
                        <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <ListChecks className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No rules defined for this strategy</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/[0.06]">
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
                  <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06]">
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

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
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

              {/* Attachments Tab */}
              {mainTab === "attachments" && selectedTrade && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-2">Entry Screenshot</span>
                    {selectedTrade.beforeURL ? (
                      <div 
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-white/[0.06]"
                        onClick={() => openLightbox(selectedTrade.beforeURL!, "before")}
                      >
                        <img 
                          src={selectedTrade.beforeURL} 
                          alt="Entry" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-white/10 hover:border-primary/30 cursor-pointer transition-colors bg-white/[0.01]">
                        <Upload className="w-6 h-6 text-muted-foreground/40 mb-2" />
                        <span className="text-xs text-muted-foreground">Upload Entry Screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, "before")}
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-2">Exit Screenshot</span>
                    {selectedTrade.afterURL ? (
                      <div 
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-white/[0.06]"
                        onClick={() => openLightbox(selectedTrade.afterURL!, "after")}
                      >
                        <img 
                          src={selectedTrade.afterURL} 
                          alt="Exit" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-white/10 hover:border-primary/30 cursor-pointer transition-colors bg-white/[0.01]">
                        <Upload className="w-6 h-6 text-muted-foreground/40 mb-2" />
                        <span className="text-xs text-muted-foreground">Upload Exit Screenshot</span>
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
              )}
            </div>
          </div>
        </motion.div>

        {/* Toggle Right Panel - Desktop Only */}
        <motion.button
          initial={false}
          animate={{ right: isRightPanelCollapsed ? 0 : 340 }}
          onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-10 p-1.5 bg-[#0c0d10] border border-white/[0.06] rounded-l-lg hover:bg-white/[0.05] transition-colors items-center justify-center"
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
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileTradeListOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-[#0a0b0e] border-r border-white/[0.06] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Trades</span>
                <button
                  onClick={() => setIsMobileTradeListOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05]"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 border-b border-white/[0.06]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search trades..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
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
                      className={`w-full p-4 text-left border-b border-white/[0.03] transition-all ${
                        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-white/[0.02]"
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
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileStatsOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[90%] max-w-[360px] bg-[#0a0b0e] border-l border-white/[0.06] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/[0.06] flex-1 mr-2">
                  {[
                    { key: "stats", label: "Stats", icon: BarChart2 },
                    { key: "strategy", label: "Strategy", icon: Target },
                    { key: "executions", label: "Exec", icon: Activity },
                    { key: "attachments", label: "Media", icon: ImageIcon },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setMainTab(tab.key as typeof mainTab)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        mainTab === tab.key ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsMobileStatsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05]"
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
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <span className="text-[10px] text-muted-foreground uppercase">Side</span>
                        <p className={`text-sm font-semibold mt-1 ${
                          (selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long") ? "text-profit" : "text-loss"
                        }`}>{selectedTrade.Type || selectedTrade.side}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <span className="text-[10px] text-muted-foreground uppercase">Qty</span>
                        <p className="text-sm font-semibold text-foreground mt-1">{selectedTrade.quantity || "--"}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
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
                      <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/[0.06]">
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

                {/* Attachments Tab - Mobile */}
                {mainTab === "attachments" && selectedTrade && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-2">Entry Screenshot</span>
                      {selectedTrade.beforeURL ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden cursor-pointer" onClick={() => openLightbox(selectedTrade.beforeURL!, "before")}>
                          <img src={selectedTrade.beforeURL} alt="Entry" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-white/10 cursor-pointer">
                          <Upload className="w-5 h-5 text-muted-foreground/40 mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "before")} />
                        </label>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-2">Exit Screenshot</span>
                      {selectedTrade.afterURL ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden cursor-pointer" onClick={() => openLightbox(selectedTrade.afterURL!, "after")}>
                          <img src={selectedTrade.afterURL} alt="Exit" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-white/10 cursor-pointer">
                          <Upload className="w-5 h-5 text-muted-foreground/40 mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "after")} />
                        </label>
                      )}
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
