"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Zap,
  BookOpen,
  Upload,
  Image as ImageIcon,
  X,
  Save,
  Plus,
  FileText,
  ClipboardCheck,
  Heart,
  Shield,
  BarChart3,
  PanelRightClose,
  PanelRight,
  PanelLeftClose,
  PanelLeft,
  Clock,
  CheckCircle2,
  Activity,
  Flame,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Pencil,
  Eye,
  Share2,
  Check,
  ChevronUp,
  Percent,
  Scale,
  ListChecks,
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
  [key: string]: any;
}

interface JournalData {
  templateId?: string;
  prompts?: Record<string, string>;
  sentiment?: "great" | "okay" | "poor";
  tags?: string[];
  rulesCompliance?: Record<string, boolean>;
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
  { id: "demo-1", date: new Date().toISOString().split("T")[0], EntryTime: "09:32:00", Profit: 1250, Item: "AAPL", symbol: "AAPL", Type: "Long", side: "Long", strategy: "Momentum", entryPrice: "178.50", exitPrice: "182.35", jrData: { sentiment: "great", tags: ["Perfect Setup", "Followed Plan"] } },
  { id: "demo-2", date: new Date().toISOString().split("T")[0], EntryTime: "10:15:00", Profit: -380, Item: "TSLA", symbol: "TSLA", Type: "Short", side: "Short", strategy: "Breakout", entryPrice: "245.80", exitPrice: "248.10" },
  { id: "demo-3", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], EntryTime: "11:45:00", Profit: 890, Item: "NVDA", symbol: "NVDA", Type: "Long", side: "Long", strategy: "Scalping", entryPrice: "485.20", exitPrice: "492.75", jrData: { sentiment: "okay" } },
  { id: "demo-4", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], EntryTime: "14:20:00", Profit: -520, Item: "MSFT", symbol: "MSFT", Type: "Long", side: "Long", strategy: "Swing", entryPrice: "378.90", exitPrice: "375.40" },
  { id: "demo-5", date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], EntryTime: "09:55:00", Profit: 2100, Item: "META", symbol: "META", Type: "Long", side: "Long", strategy: "Reversal", entryPrice: "312.50", exitPrice: "324.80", jrData: { sentiment: "great", tags: ["News Play"] } },
  { id: "demo-6", date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], EntryTime: "13:10:00", Profit: 450, Item: "GOOGL", symbol: "GOOGL", Type: "Short", side: "Short", strategy: "Momentum", entryPrice: "141.20", exitPrice: "138.95" },
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
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
  const [journalData, setJournalData] = useState<JournalData>({ prompts: {}, tags: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "winners" | "losers">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<"before" | "after" | null>(null);
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    tradeId: string;
    accountId: string;
    tradeSummary: { symbol?: string; pnl?: number; date?: string };
  } | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [mobileView, setMobileView] = useState<"list" | "content">("list");
  const [isStrategyDropdownOpen, setIsStrategyDropdownOpen] = useState(false);
  const [strategyRules, setStrategyRules] = useState<{id: string; text: string}[]>([]);
  const [rulesCompliance, setRulesCompliance] = useState<Record<string, boolean>>({});
  const [loadingRules, setLoadingRules] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const strategyDropdownRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
      if (strategyDropdownRef.current && !strategyDropdownRef.current.contains(e.target as Node)) {
        setIsStrategyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateTradeStrategy = async (strategy: string) => {
    if (!selectedTrade || isDemo) return;
    
    try {
      const tradeId = selectedTrade._id || selectedTrade.id;
      await fetch("/api/daily-journal/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiName: "editDropdowns",
          id: tradeId,
          type: "strategy",
          value: strategy,
          tokenn,
          accountType: selectedTrade.accountType,
        }),
      });
      setSelectedTrade({ ...selectedTrade, strategy });
      setIsStrategyDropdownOpen(false);
      setAccounts();
      fetchStrategyRules(strategy);
    } catch (error) {
      console.error("Error updating strategy:", error);
    }
  };

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
      setJournalData({ prompts: {}, tags: [] });
      setSelectedTemplateIdx(0);
    }
  }, [selectedTrade, templates]);

  const filteredTrades = useMemo(() => {
    let data = trades;
    if (filter === "winners") data = data.filter((t) => t.Profit > 0);
    if (filter === "losers") data = data.filter((t) => t.Profit < 0);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((t) => (t.Item || t.symbol || "").toLowerCase().includes(q));
    }
    return data;
  }, [trades, filter, searchQuery]);

  const groupedTrades = useMemo(() => {
    const groups: Record<string, Trade[]> = {};
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    filteredTrades.forEach((trade) => {
      let label = trade.date;
      if (trade.date === today) label = "Today";
      else if (trade.date === yesterday) label = "Yesterday";
      else {
        const d = new Date(trade.date);
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(trade);
    });
    return groups;
  }, [filteredTrades]);

  const stats = useMemo(() => {
    const winners = trades.filter((t) => t.Profit > 0).length;
    const losers = trades.filter((t) => t.Profit < 0).length;
    const totalPnL = trades.reduce((sum, t) => sum + (t.Profit || 0), 0);
    const winRate = trades.length ? Math.round((winners / trades.length) * 100) : 0;
    const totalWins = trades.filter((t) => t.Profit > 0).reduce((sum, t) => sum + t.Profit, 0);
    const totalLosses = Math.abs(trades.filter((t) => t.Profit < 0).reduce((sum, t) => sum + t.Profit, 0));
    const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? "∞" : "0.00";
    const avgWin = winners > 0 ? totalWins / winners : 0;
    const avgLoss = losers > 0 ? totalLosses / losers : 0;
    const journaledTrades = trades.filter(t => t.jrData && (t.jrData.sentiment || t.jrData.templateId || (t.jrData.tags && t.jrData.tags.length > 0))).length;
    return { winners, losers, totalPnL, winRate, profitFactor, avgWin, avgLoss, totalTrades: trades.length, journaledTrades };
  }, [trades]);

  const calendarData = useMemo(() => {
    return trades.reduce((acc: Record<string, number>, trade) => {
      if (!acc[trade.date]) acc[trade.date] = 0;
      acc[trade.date] += trade.Profit;
      return acc;
    }, {});
  }, [trades]);

  const handleSelectTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setMobileView("content");
  };

  const handlePromptChange = (promptId: string, value: string) => {
    setJournalData((prev) => ({
      ...prev,
      prompts: { ...prev.prompts, [promptId]: value },
    }));
  };

  const handleSentimentChange = (sentiment: "great" | "okay" | "poor") => {
    setJournalData((prev) => ({ ...prev, sentiment }));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !journalData.tags?.includes(tag)) {
      setJournalData((prev) => ({ ...prev, tags: [...(prev.tags || []), tag] }));
      setTagInput("");
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
      const jrDataWithRules = {
        ...journalData,
        templateId: templates[selectedTemplateIdx]?.name,
        rulesCompliance: strategyRules.length > 0 ? rulesCompliance : undefined
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

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDay = firstDayOfMonth(selectedYear, selectedMonth);
    const cells = [];
    const today = new Date();

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="h-7" />);

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const pnl = calendarData[dateStr] || 0;
      const isToday = new Date(selectedYear, selectedMonth, day).toDateString() === today.toDateString();

      let cellClass = "text-muted-foreground/70 hover:bg-white/5";
      if (pnl > 0) cellClass = "bg-profit/20 text-profit hover:bg-profit/30 font-medium";
      else if (pnl < 0) cellClass = "bg-loss/20 text-loss hover:bg-loss/30 font-medium";

      cells.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`h-7 w-7 rounded-md flex items-center justify-center text-[11px] cursor-pointer transition-all ${cellClass} ${isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}`}
        >
          {day}
        </motion.div>
      );
    }
    return cells;
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const isJournaled = (trade: Trade) => {
    return trade.jrData && (trade.jrData.sentiment || trade.jrData.templateId || (trade.jrData.tags && trade.jrData.tags.length > 0));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Glassmorphic Header */}
      <div className="sticky top-0 z-40">
        {/* Gradient accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="backdrop-blur-xl bg-background/80 border-b border-white/5">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Title & Stats */}
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Daily Journal</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.totalTrades} trades · {stats.journaledTrades} journaled
                  </p>
                </div>
                
                {/* Quick Stat Pills */}
                <div className="hidden md:flex items-center gap-2">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm ${
                      stats.totalPnL >= 0 
                        ? "bg-profit/10 border-profit/20" 
                        : "bg-loss/10 border-loss/20"
                    }`}
                  >
                    {stats.totalPnL >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-profit" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-loss" />
                    )}
                    <span className={`text-sm font-semibold tabular-nums ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                      {stats.totalPnL >= 0 ? "+" : ""}{formatCompactCurrency(stats.totalPnL, currency, exchangeRate)}
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                  >
                    <Percent className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-sm font-semibold text-foreground">{stats.winRate}%</span>
                    <span className="text-xs text-muted-foreground">Win</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-semibold">
                      <span className="text-profit">{stats.winners}</span>
                      <span className="text-muted-foreground mx-0.5">W</span>
                      <span className="text-loss">{stats.losers}</span>
                      <span className="text-muted-foreground">L</span>
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Right: Panel Toggles */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                  className={`p-2 rounded-lg transition-all ${isLeftPanelOpen ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-muted-foreground"}`}
                >
                  {isLeftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-2 rounded-lg transition-all ${isSidebarOpen ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-muted-foreground"}`}
                >
                  {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View Toggle */}
      <div className="lg:hidden sticky top-[58px] z-30 bg-background/95 backdrop-blur-xl border-b border-white/5 px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMobileView("list")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mobileView === "list" 
                ? "bg-primary text-primary-foreground" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            Trades
          </button>
          <button
            onClick={() => setMobileView("content")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mobileView === "content" 
                ? "bg-primary text-primary-foreground" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            Journal
          </button>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex h-[calc(100vh-100px)] lg:h-[calc(100vh-74px)]">
        {/* Left Panel - Trade List */}
        <AnimatePresence>
          {(isLeftPanelOpen || mobileView === "list") && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: mobileView === "list" ? "100%" : 340 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex-shrink-0 border-r border-white/5 bg-background overflow-hidden ${
                mobileView === "content" ? "hidden lg:block" : ""
              }`}
            >
              <div className="w-full lg:w-[340px] h-full flex flex-col">
                {/* Search & Filter */}
                <div className="p-4 space-y-3 border-b border-white/5">
                  {/* Premium Search Bar */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity" />
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
                      <Search className="w-4 h-4 text-muted-foreground ml-3" />
                      <input
                        type="text"
                        placeholder="Search trades..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="p-2 hover:bg-white/5">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-2">
                    {[
                      { key: "all", label: "All", count: trades.length, icon: LayoutDashboard },
                      { key: "winners", label: "Winners", count: stats.winners, icon: TrendingUp, color: "text-profit" },
                      { key: "losers", label: "Losers", count: stats.losers, icon: TrendingDown, color: "text-loss" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key as "all" | "winners" | "losers")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filter === f.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        }`}
                      >
                        <f.icon className={`w-3 h-3 ${filter !== f.key ? f.color || "" : ""}`} />
                        <span>{f.label}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          filter === f.key ? "bg-white/20" : "bg-white/10"
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trade List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {Object.entries(groupedTrades).map(([date, dateTrades]) => (
                    <div key={date} className="space-y-2">
                      {/* Date Header */}
                      <div className="flex items-center gap-2 px-2 py-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{date}</span>
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[10px] text-muted-foreground">{dateTrades.length}</span>
                      </div>

                      {/* Trade Cards */}
                      {dateTrades.map((trade) => {
                        const isSelected = selectedTrade?.id === trade.id || selectedTrade?._id === trade._id;
                        const isProfitable = trade.Profit >= 0;
                        const journaled = isJournaled(trade);

                        return (
                          <motion.div
                            key={trade.id || trade._id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectTrade(trade)}
                            className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary/10 border border-primary/30 shadow-lg shadow-primary/5"
                                : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                            }`}
                          >
                            {/* Selection Indicator */}
                            {isSelected && (
                              <motion.div
                                layoutId="selectedIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                              />
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Symbol Logo */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                                  isProfitable ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                                }`}>
                                  <SymbolLogo symbol={trade.Item || trade.symbol || ""} size="md" />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">{trade.Item || trade.symbol}</span>
                                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                                      trade.Type?.toLowerCase() === "buy" || trade.side?.toLowerCase() === "long"
                                        ? "bg-profit/10 text-profit"
                                        : "bg-loss/10 text-loss"
                                    }`}>
                                      {trade.Type || trade.side}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[11px] text-muted-foreground">
                                      {formatTime(trade.EntryTime || trade.time)}
                                    </span>
                                    {trade.strategy && trade.strategy !== "Select" && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                        <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                                          {trade.strategy}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className={`text-sm font-bold tabular-nums ${isProfitable ? "text-profit" : "text-loss"}`}>
                                  {isProfitable ? "+" : ""}{formatCompactCurrency(trade.Profit, currency, exchangeRate)}
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  {journaled && (
                                    <span className="flex items-center gap-0.5 text-[10px] text-primary">
                                      <CheckCircle2 className="w-3 h-3" />
                                    </span>
                                  )}
                                  {trade.jrData?.sentiment && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      trade.jrData.sentiment === "great" 
                                        ? "bg-profit/10 text-profit" 
                                        : trade.jrData.sentiment === "okay"
                                        ? "bg-amber-500/10 text-amber-500"
                                        : "bg-loss/10 text-loss"
                                    }`}>
                                      {trade.jrData.sentiment === "great" ? "Great" : trade.jrData.sentiment === "okay" ? "Okay" : "Poor"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Tags */}
                            {trade.jrData?.tags && trade.jrData.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {trade.jrData.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-white/5 text-[10px] text-muted-foreground rounded">
                                    {tag}
                                  </span>
                                ))}
                                {trade.jrData.tags.length > 3 && (
                                  <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    +{trade.jrData.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}

                  {filteredTrades.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                        <Search className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No trades found</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Journal Content */}
        <div className={`flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/95 ${
          mobileView === "list" ? "hidden lg:block" : ""
        }`}>
          {selectedTrade ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto"
            >
              {/* Trade Header Card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent">
                {/* Glow effect */}
                <div className={`absolute inset-0 opacity-20 ${
                  selectedTrade.Profit >= 0 
                    ? "bg-gradient-to-br from-profit/20 to-transparent" 
                    : "bg-gradient-to-br from-loss/20 to-transparent"
                }`} />
                
                <div className="relative p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        selectedTrade.Profit >= 0 ? "bg-profit/10" : "bg-loss/10"
                      }`}>
                        <SymbolLogo symbol={selectedTrade.Item || selectedTrade.symbol || ""} size="lg" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-foreground">{selectedTrade.Item || selectedTrade.symbol}</h2>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                            selectedTrade.Type?.toLowerCase() === "buy" || selectedTrade.side?.toLowerCase() === "long"
                              ? "bg-profit/15 text-profit"
                              : "bg-loss/15 text-loss"
                          }`}>
                            {selectedTrade.Type || selectedTrade.side}
                          </span>
                          {selectedTrade.strategy && selectedTrade.strategy !== "Select" && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-md">
                              {selectedTrade.strategy}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(selectedTrade.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(selectedTrade.EntryTime || selectedTrade.time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-2xl font-bold tabular-nums ${
                        selectedTrade.Profit >= 0 ? "text-profit" : "text-loss"
                      }`}>
                        {selectedTrade.Profit >= 0 ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit, currency, exchangeRate)}
                      </p>
                      <button
                        onClick={() => setShareModal({
                          isOpen: true,
                          tradeId: selectedTrade._id || selectedTrade.id || "",
                          accountId: selectedTrade.accountType || "",
                          tradeSummary: {
                            symbol: selectedTrade.Item || selectedTrade.symbol,
                            pnl: selectedTrade.Profit,
                            date: selectedTrade.date
                          }
                        })}
                        className="mt-1 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                        Share
                      </button>
                    </div>
                  </div>

                  {/* Entry/Exit Info */}
                  {(selectedTrade.entryPrice || selectedTrade.exitPrice) && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
                      {selectedTrade.entryPrice && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry</span>
                          <p className="text-sm font-semibold text-foreground">${selectedTrade.entryPrice}</p>
                        </div>
                      )}
                      {selectedTrade.exitPrice && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Exit</span>
                          <p className="text-sm font-semibold text-foreground">${selectedTrade.exitPrice}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Screenshots Section */}
              <div className="grid grid-cols-2 gap-3">
                {(["before", "after"] as const).map((type) => {
                  const url = type === "before" ? selectedTrade.beforeURL : selectedTrade.afterURL;
                  return (
                    <div
                      key={type}
                      className="group relative aspect-video rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
                    >
                      {url ? (
                        <>
                          <img
                            src={url}
                            alt={`${type} screenshot`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={() => openLightbox(url, type)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-white/80 font-medium uppercase tracking-wider">
                              {type === "before" ? "Entry" : "Exit"}
                            </span>
                            <button
                              onClick={() => openLightbox(url, type)}
                              className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-white/[0.04] transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-2">
                            <Upload className="w-4 h-4 text-muted-foreground/60" />
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {type === "before" ? "Entry" : "Exit"} Screenshot
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, type)}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Strategy Rules Checklist */}
              {selectedTrade.strategy && selectedTrade.strategy !== "Select" && strategyRules.length > 0 && (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium text-foreground">Strategy Rules</h3>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {Object.values(rulesCompliance).filter(Boolean).length}/{strategyRules.length}
                    </span>
                  </div>
                  {loadingRules ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {strategyRules.map((rule) => (
                        <label
                          key={rule.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            rulesCompliance[rule.id]
                              ? "bg-profit/5 border-profit/20"
                              : "bg-white/[0.02] border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            rulesCompliance[rule.id] ? "bg-profit text-white" : "bg-white/10"
                          }`}>
                            {rulesCompliance[rule.id] && <Check className="w-3 h-3" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={rulesCompliance[rule.id] || false}
                            onChange={() => toggleRuleCompliance(rule.id)}
                            className="sr-only"
                          />
                          <span className={`text-sm leading-relaxed ${
                            rulesCompliance[rule.id] ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {rule.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sentiment Selector */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-medium text-foreground mb-4">How was this trade?</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "poor", label: "Poor", icon: TrendingDown, color: "loss" },
                    { key: "okay", label: "Okay", icon: Activity, color: "amber-500" },
                    { key: "great", label: "Great", icon: TrendingUp, color: "profit" },
                  ].map((s) => {
                    const isSelected = journalData.sentiment === s.key;
                    return (
                      <motion.button
                        key={s.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSentimentChange(s.key as "great" | "okay" | "poor")}
                        className={`relative p-4 rounded-xl border transition-all ${
                          isSelected
                            ? s.color === "profit" 
                              ? "bg-profit/10 border-profit/30 text-profit"
                              : s.color === "loss"
                              ? "bg-loss/10 border-loss/30 text-loss"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            : "bg-white/[0.02] border-white/5 text-muted-foreground hover:border-white/10"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="sentimentIndicator"
                            className={`absolute inset-0 rounded-xl ${
                              s.color === "profit" ? "bg-profit/5" : s.color === "loss" ? "bg-loss/5" : "bg-amber-500/5"
                            }`}
                          />
                        )}
                        <div className="relative flex flex-col items-center gap-2">
                          <s.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{s.label}</span>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                              s.color === "profit" ? "bg-profit" : s.color === "loss" ? "bg-loss" : "bg-amber-500"
                            }`}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Template Selector */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
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
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? `${colors.bg} ${colors.text} border ${colors.border}`
                            : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-transparent"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {template.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Journal Prompts */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    {templates[selectedTemplateIdx]?.name || "Notes"}
                  </h3>
                </div>
                {templates[selectedTemplateIdx]?.prompts.map((prompt) => {
                  const hasValue = Boolean(journalData.prompts?.[prompt.id]);
                  return (
                    <div key={prompt.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">{prompt.label}</label>
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
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                        />
                      ) : (
                        <input
                          type="text"
                          value={journalData.prompts?.[prompt.id] || ""}
                          onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                          placeholder={prompt.placeholder}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Tags */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-medium text-foreground mb-3">Quick Tags</h3>
                
                {journalData.tags && journalData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {journalData.tags.map((tag) => (
                      <motion.span
                        key={tag}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                      >
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-primary/70">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {commonTags.filter(t => !journalData.tags?.includes(t)).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-md text-xs font-medium transition-all"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSave}
                disabled={isSaving || isDemo}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Journal Entry
                  </>
                )}
              </motion.button>

              {isDemo && (
                <p className="text-center text-xs text-muted-foreground">
                  Demo mode - Add real trades to save your journal entries
                </p>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center mb-5 mx-auto">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Trade</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Choose a trade from the list to start journaling and track your progress
                </p>
              </motion.div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Analytics */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 280 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block flex-shrink-0 border-l border-white/5 bg-background overflow-hidden"
            >
              <div className="w-[280px] p-4 space-y-4 overflow-y-auto h-full">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analytics</h4>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <PanelRightClose className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Glassmorphic Stat Cards */}
                <div className="space-y-2">
                  {[
                    { label: "Total P&L", value: formatCompactCurrency(stats.totalPnL, currency, exchangeRate), isProfit: stats.totalPnL >= 0 },
                    { label: "Win Rate", value: `${stats.winRate}%`, icon: Percent },
                    { label: "Record", value: `${stats.winners}W / ${stats.losers}L` },
                    { label: "Profit Factor", value: stats.profitFactor },
                  ].map((stat, idx) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between py-3 px-3 rounded-lg bg-white/[0.02] border border-white/5"
                    >
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <span className={`text-sm font-semibold tabular-nums ${
                        stat.isProfit !== undefined 
                          ? stat.isProfit ? "text-profit" : "text-loss"
                          : "text-foreground"
                      }`}>
                        {stat.isProfit !== undefined && stat.isProfit ? "+" : ""}{stat.value}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Win Rate Progress */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Win Rate</span>
                    <span className="text-sm font-semibold text-foreground">{stats.winRate}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.winRate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-profit to-emerald-400 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                    <span className="text-profit">{stats.winners} wins</span>
                    <span className="text-loss">{stats.losers} losses</span>
                  </div>
                </div>

                {/* Avg Win/Loss */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-profit/5 border border-profit/10">
                    <span className="text-[10px] text-profit/70 uppercase tracking-wider">Avg Win</span>
                    <p className="text-sm font-semibold text-profit mt-1">{formatCompactCurrency(stats.avgWin, currency, exchangeRate)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-loss/5 border border-loss/10">
                    <span className="text-[10px] text-loss/70 uppercase tracking-wider">Avg Loss</span>
                    <p className="text-sm font-semibold text-loss mt-1">{formatCompactCurrency(stats.avgLoss, currency, exchangeRate)}</p>
                  </div>
                </div>

                {/* Calendar */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold text-foreground">Calendar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedMonth((m) => (m === 0 ? (setSelectedYear((y) => y - 1), 11) : m - 1))}
                        className="p-1 rounded hover:bg-white/5 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <span className="text-[10px] font-medium text-muted-foreground min-w-[60px] text-center">
                        {new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short", year: "numeric" })}
                      </span>
                      <button
                        onClick={() => setSelectedMonth((m) => (m === 11 ? (setSelectedYear((y) => y + 1), 0) : m + 1))}
                        className="p-1 rounded hover:bg-white/5 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="h-6 flex items-center justify-center text-[9px] font-medium text-muted-foreground/60">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">{renderCalendar()}</div>
                  
                  <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-profit/40" />
                      <span className="text-[9px] text-muted-foreground">Profit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-loss/40" />
                      <span className="text-[9px] text-muted-foreground">Loss</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium">
                  {lightboxType === "before" ? "Entry Screenshot" : "Exit Screenshot"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isDemo && (
                  <button
                    onClick={() => handleDeleteScreenshot(lightboxType!)}
                    className="px-3 py-1.5 rounded-lg bg-loss/20 hover:bg-loss/30 text-loss text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={closeLightbox}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
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
