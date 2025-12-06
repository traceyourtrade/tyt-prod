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
  Clock,
  CheckCircle2,
} from "lucide-react";
import useAccountDetails from "@/store/accountdetails";
import { formatCompactNumber } from "@/utils/formatNumber";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

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
  [key: string]: any;
}

interface JournalData {
  templateId?: string;
  prompts?: Record<string, string>;
  sentiment?: "great" | "okay" | "poor";
  tags?: string[];
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
  { id: "demo-1", date: new Date().toISOString().split("T")[0], EntryTime: "09:32:00", Profit: 1250, Item: "AAPL", symbol: "AAPL", Type: "Long", side: "Long", strategy: "Momentum" },
  { id: "demo-2", date: new Date().toISOString().split("T")[0], EntryTime: "10:15:00", Profit: -380, Item: "TSLA", symbol: "TSLA", Type: "Short", side: "Short", strategy: "Breakout" },
  { id: "demo-3", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], EntryTime: "11:45:00", Profit: 890, Item: "NVDA", symbol: "NVDA", Type: "Long", side: "Long", strategy: "Scalping" },
  { id: "demo-4", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], EntryTime: "14:20:00", Profit: -520, Item: "MSFT", symbol: "MSFT", Type: "Long", side: "Long", strategy: "Swing" },
  { id: "demo-5", date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], EntryTime: "09:55:00", Profit: 2100, Item: "META", symbol: "META", Type: "Long", side: "Long", strategy: "Reversal" },
  { id: "demo-6", date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], EntryTime: "13:10:00", Profit: 450, Item: "GOOGL", symbol: "GOOGL", Type: "Short", side: "Short", strategy: "Momentum" },
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
    case "blue": return "text-blue-500 bg-blue-500/10";
    case "yellow": return "text-yellow-500 bg-yellow-500/10";
    case "green": return "text-green-500 bg-green-500/10";
    case "pink": return "text-pink-500 bg-pink-500/10";
    case "purple": return "text-purple-500 bg-purple-500/10";
    default: return "text-primary bg-primary/10";
  }
};

const DailyJournal = () => {
  const { selectedAccounts, setAccounts } = useAccountDetails();
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
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [mobileView, setMobileView] = useState<"list" | "content">("list");

  const filterRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    return { winners, losers, totalPnL, winRate, profitFactor, avgWin, avgLoss, totalTrades: trades.length };
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
    if (!selectedTrade) return;
    setIsSaving(true);
    try {
      const tradeId = selectedTrade._id || selectedTrade.id;
      const payload = {
        tokenn,
        apiName: "uploadJournalData",
        id: tradeId,
        tradeId: tradeId,
        accountType: selectedTrade.accountType,
        jrData: { ...journalData, templateId: templates[selectedTemplateIdx]?.name },
      };
      await fetch("/api/daily-journal/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setAccounts();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (!file || !selectedTrade) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;
        const maxSize = 1024;
        if (width > height) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
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

      let bgClass = "";
      if (pnl > 500) bgClass = "bg-profit text-white";
      else if (pnl > 0) bgClass = "bg-profit/40 text-profit";
      else if (pnl < -500) bgClass = "bg-loss text-white";
      else if (pnl < 0) bgClass = "bg-loss/40 text-loss";

      cells.push(
        <div
          key={day}
          className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${bgClass} ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""} ${!bgClass ? "text-foreground hover:bg-muted" : ""}`}
        >
          {day}
        </div>
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

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-sm font-semibold text-foreground">Journal</h1>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setMobileView("list")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mobileView === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Trades
          </button>
          <button
            onClick={() => setMobileView("content")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mobileView === "content" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Journal
          </button>
        </div>
      </div>

      {/* Left Panel - Trade List */}
      <div className={`w-full md:w-[300px] border border-border/40 flex-col bg-gradient-to-b from-card via-card to-card/95 shrink-0 md:rounded-2xl md:m-3 md:mr-0 pt-14 md:pt-0 backdrop-blur-xl shadow-2xl shadow-black/10 ${mobileView === "list" ? "flex" : "hidden md:flex"}`}>
        <div className="p-5 border-b border-border/30 space-y-4 bg-gradient-to-b from-muted/5 to-transparent">
          <div className="hidden md:flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <BookOpen className="w-5 h-5 text-primary relative z-10" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Journal</h1>
              <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">Trade entries</p>
            </div>
          </div>

          {/* Search - Premium Glass Style */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-focus-within:opacity-100 blur-xl transition-all duration-500" />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
            <input
              type="text"
              placeholder="Search trades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted/20 backdrop-blur-sm border border-border/40 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-muted/30 transition-all duration-300 shadow-inner shadow-black/5"
            />
          </div>

          {/* Filter - Premium Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 backdrop-blur-sm border border-border/40 rounded-xl text-sm text-foreground hover:bg-muted/30 hover:border-border/60 transition-all duration-300 shadow-inner shadow-black/5"
            >
              <span className="flex items-center gap-2.5">
                <Filter className="w-4 h-4 text-muted-foreground/60" />
                <span className="font-medium">{filter === "all" ? "All Trades" : filter === "winners" ? "Winners" : "Losers"}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground/60 transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/30 overflow-hidden z-50"
                >
                  {[
                    { value: "all", label: "All Trades", icon: null, color: "" },
                    { value: "winners", label: "Winners", icon: TrendingUp, color: "text-profit" },
                    { value: "losers", label: "Losers", icon: TrendingDown, color: "text-loss" },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFilter(opt.value as typeof filter);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all duration-200 ${filter === opt.value ? "bg-primary/10 text-primary" : `text-foreground hover:bg-muted/40 ${opt.color}`}`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Trade List */}
        <div className="flex-1 overflow-y-auto scrollbar-sleek">
          {Object.keys(groupedTrades).length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground/60 text-sm font-medium">No trades found</p>
            </div>
          ) : (
            Object.entries(groupedTrades).map(([dateLabel, dateTrades]) => (
              <div key={dateLabel}>
                <div className="px-5 py-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] bg-gradient-to-r from-muted/20 via-muted/10 to-transparent backdrop-blur-sm sticky top-0 z-10 border-b border-border/20">
                  {dateLabel}
                </div>
                {dateTrades.map((trade, idx) => {
                  const getTradeKey = (t: Trade) => t._id || t.id || `${t.date}-${t.EntryTime || t.time || ''}-${t.Item || t.symbol || ''}-${t.Profit}`;
                  const tradeKey = getTradeKey(trade);
                  const selectedKey = selectedTrade ? getTradeKey(selectedTrade) : null;
                  const isSelected = tradeKey === selectedKey;
                  const isJournaled = Boolean(trade.jrData && (
                    trade.jrData.sentiment ||
                    trade.jrData.templateId ||
                    trade.jrData.tags?.length > 0 ||
                    Object.keys(trade.jrData.prompts || {}).some(k => trade.jrData?.prompts?.[k]?.trim())
                  ));
                  const isProfit = trade.Profit >= 0;
                  return (
                    <motion.button
                      key={tradeKey || `${trade.date}-${idx}`}
                      onClick={() => handleSelectTrade(trade)}
                      whileHover={{ x: 4, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
                      whileTap={{ scale: 0.98 }}
                      className={`group w-full flex items-center justify-between px-4 py-3.5 mx-1 my-0.5 rounded-xl transition-all duration-300 ${isSelected 
                        ? `bg-gradient-to-r ${isProfit ? "from-profit/10 via-profit/5 to-transparent border-l-2 border-l-profit" : "from-loss/10 via-loss/5 to-transparent border-l-2 border-l-loss"} shadow-lg shadow-black/5` 
                        : "hover:bg-muted/20 border-l-2 border-l-transparent"}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Symbol Badge with Gradient */}
                        <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold overflow-hidden shadow-lg ${isProfit ? "bg-gradient-to-br from-profit/20 to-profit/5 text-profit shadow-profit/10" : "bg-gradient-to-br from-loss/20 to-loss/5 text-loss shadow-loss/10"}`}>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                          <span className="relative z-10 text-[11px] font-extrabold tracking-tight">{(trade.Item || trade.symbol || "?").slice(0, 2)}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-foreground group-hover:text-foreground/90 transition-colors">{trade.Item || trade.symbol}</div>
                          <div className="text-[11px] text-muted-foreground/50 flex items-center gap-1.5 mt-0.5 font-medium">
                            <Clock className="w-3 h-3" />
                            {formatTime(trade.EntryTime || trade.time)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {isJournaled && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10" 
                            title="Journaled"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          </motion.div>
                        )}
                        <div className={`px-2.5 py-1 rounded-lg text-sm font-bold tracking-tight ${isProfit ? "text-profit bg-profit/10" : "text-loss bg-loss/10"}`}>
                          {formatCompactCurrency(trade.Profit, currency, exchangeRate)}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Center Panel - Journal Workspace */}
      <div className={`flex-1 flex-col overflow-hidden bg-background pt-14 md:pt-0 ${mobileView === "content" ? "flex" : "hidden md:flex"}`}>
        <AnimatePresence mode="wait">
          {!selectedTrade ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/5">
                  <BookOpen className="w-9 h-9 text-primary/70" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Select a trade to journal</h2>
                <p className="text-muted-foreground/80 text-sm">Choose a trade from the list to start journaling</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={selectedTrade.id || selectedTrade.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 overflow-y-auto scrollbar-sleek p-6 space-y-5"
            >
              {/* Trade Header - Premium Glass Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className={`relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border rounded-2xl p-6 shadow-xl shadow-black/5 ${selectedTrade.Profit >= 0 ? "border-profit/20" : "border-loss/20"}`}
              >
                {/* Ambient Glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${selectedTrade.Profit >= 0 ? "bg-profit" : "bg-loss"}`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Symbol Badge - Premium Gradient */}
                    <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl ${selectedTrade.Profit >= 0 ? "bg-gradient-to-br from-profit/30 via-profit/20 to-profit/5 shadow-profit/20" : "bg-gradient-to-br from-loss/30 via-loss/20 to-loss/5 shadow-loss/20"}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                      <span className={`relative z-10 text-lg font-black tracking-tight ${selectedTrade.Profit >= 0 ? "text-profit" : "text-loss"}`}>
                        {(selectedTrade.Item || selectedTrade.symbol || "?").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">{selectedTrade.Item || selectedTrade.symbol}</h2>
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide shadow-lg ${(selectedTrade.Type || selectedTrade.side) === "Long" 
                          ? "bg-gradient-to-r from-profit/20 to-profit/10 text-profit shadow-profit/10 border border-profit/20" 
                          : "bg-gradient-to-r from-loss/20 to-loss/10 text-loss shadow-loss/10 border border-loss/20"}`}>
                          {selectedTrade.Type || selectedTrade.side}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground/70 mt-2 flex items-center gap-2.5 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(selectedTrade.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(selectedTrade.EntryTime || selectedTrade.time)}
                        </span>
                        {selectedTrade.strategy && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold">{selectedTrade.strategy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* P&L Display - Premium */}
                  <div className={`flex flex-col items-end`}>
                    <div className={`text-3xl font-black tracking-tight ${selectedTrade.Profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatCompactCurrency(selectedTrade.Profit, currency, exchangeRate)}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${selectedTrade.Profit >= 0 ? "text-profit/70" : "text-loss/70"}`}>
                      {selectedTrade.Profit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {selectedTrade.Profit >= 0 ? "Winning Trade" : "Losing Trade"}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Screenshots - Premium Glass Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border border-border/40 rounded-2xl p-6 shadow-xl shadow-black/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <h3 className="relative text-sm font-bold text-foreground mb-5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center shadow-lg shadow-black/5">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span>Screenshots</span>
                  <span className="ml-auto text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Entry & Exit</span>
                </h3>
                <div className="relative grid grid-cols-2 gap-5">
                  {["before", "after"].map((type) => {
                    const url = type === "before" ? selectedTrade.beforeURL : selectedTrade.afterURL;
                    return (
                      <div key={type} className="relative group">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${type === "before" ? "text-primary/70" : "text-profit/70"}`}>
                            {type === "before" ? "Before Trade" : "After Trade"}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${type === "before" ? "bg-primary/50" : "bg-profit/50"} animate-pulse`} />
                        </div>
                        {url ? (
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            onClick={() => setLightboxImage(url)}
                            className="relative aspect-video rounded-xl overflow-hidden border border-border/30 cursor-pointer shadow-xl shadow-black/10 bg-muted/10"
                          >
                            <img src={url} alt={`${type} screenshot`} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 backdrop-blur-[2px]">
                              <span className="flex items-center gap-2 text-white text-sm font-semibold">
                                <ImageIcon className="w-4 h-4" />
                                View Full
                              </span>
                            </div>
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          </motion.div>
                        ) : (
                          <motion.label 
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border/30 hover:border-primary/40 bg-gradient-to-br from-muted/10 to-muted/5 cursor-pointer transition-all duration-300 group shadow-inner shadow-black/5"
                          >
                            <div className="w-12 h-12 rounded-xl bg-muted/30 group-hover:bg-primary/10 flex items-center justify-center mb-2 transition-all duration-300 shadow-lg shadow-black/5">
                              <Upload className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors duration-300" />
                            </div>
                            <span className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground font-semibold transition-colors duration-300">
                              Upload {type}
                            </span>
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, type as "before" | "after")} className="hidden" />
                          </motion.label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Template Tabs - Premium Pill Navigation */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border border-border/40 rounded-2xl p-6 shadow-xl shadow-black/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                
                {/* Pill Tab Navigation */}
                <div className="relative flex items-center gap-2 overflow-x-auto pb-5 scrollbar-hide">
                  <div className="absolute bottom-5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                  {templates.map((template, idx) => {
                    const Icon = getTemplateIcon(template.icon);
                    const isActive = idx === selectedTemplateIdx;
                    return (
                      <motion.button
                        key={template.name}
                        onClick={() => setSelectedTemplateIdx(idx)}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                          isActive 
                            ? `${getTemplateColor(template.color)} shadow-lg ring-1 ring-inset ring-white/10` 
                            : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {template.name}
                        {isActive && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Prompts - Premium Floating Label Inputs */}
                <div className="relative space-y-6">
                  {templates[selectedTemplateIdx]?.prompts.map((prompt, idx) => {
                    const hasValue = Boolean(journalData.prompts?.[prompt.id]);
                    return (
                      <motion.div 
                        key={prompt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="group relative"
                      >
                        {/* Ambient Glow Effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-focus-within:opacity-100 blur-2xl transition-all duration-500 pointer-events-none" />
                        
                        {prompt.type === "textarea" ? (
                          <div className="relative">
                            <textarea
                              id={`prompt-${prompt.id}`}
                              placeholder=" "
                              value={journalData.prompts?.[prompt.id] || ""}
                              onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                              rows={3}
                              className="peer relative w-full px-4 pt-7 pb-3 bg-muted/10 backdrop-blur-sm border border-border/30 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-muted/20 resize-none transition-all duration-300 shadow-inner shadow-black/5"
                            />
                            {/* Floating Label */}
                            <label 
                              htmlFor={`prompt-${prompt.id}`}
                              className={`absolute left-4 transition-all duration-300 pointer-events-none font-semibold
                                ${hasValue 
                                  ? "top-2 text-[10px] text-primary uppercase tracking-wider" 
                                  : "top-5 text-sm text-muted-foreground/50 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-primary peer-focus:uppercase peer-focus:tracking-wider"
                                }`}
                            >
                              {prompt.label}
                            </label>
                            {/* Bottom hint */}
                            <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/30 font-medium opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                              {prompt.placeholder}
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              id={`prompt-${prompt.id}`}
                              type="text"
                              placeholder=" "
                              value={journalData.prompts?.[prompt.id] || ""}
                              onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                              className="peer relative w-full px-4 pt-6 pb-2 bg-muted/10 backdrop-blur-sm border border-border/30 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-muted/20 transition-all duration-300 shadow-inner shadow-black/5"
                            />
                            {/* Floating Label */}
                            <label 
                              htmlFor={`prompt-${prompt.id}`}
                              className={`absolute left-4 transition-all duration-300 pointer-events-none font-semibold
                                ${hasValue 
                                  ? "top-2 text-[10px] text-primary uppercase tracking-wider" 
                                  : "top-4 text-sm text-muted-foreground/50 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-primary peer-focus:uppercase peer-focus:tracking-wider"
                                }`}
                            >
                              {prompt.label}
                            </label>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Sentiment - Premium Mood Selector */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border border-border/40 rounded-2xl p-6 shadow-xl shadow-black/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <h3 className="relative text-sm font-bold text-foreground mb-5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center shadow-lg shadow-pink-500/10">
                    <Heart className="w-4 h-4 text-pink-500/80" />
                  </div>
                  How do you feel about this trade?
                </h3>
                <div className="relative flex gap-4">
                  {[
                    { value: "great", emoji: "😊", label: "Great", color: "border-profit bg-gradient-to-br from-profit/15 to-profit/5 shadow-profit/20", activeGlow: "shadow-profit/30" },
                    { value: "okay", emoji: "😐", label: "Okay", color: "border-yellow-400 bg-gradient-to-br from-yellow-400/15 to-yellow-400/5 shadow-yellow-400/20", activeGlow: "shadow-yellow-400/30" },
                    { value: "poor", emoji: "😞", label: "Poor", color: "border-loss bg-gradient-to-br from-loss/15 to-loss/5 shadow-loss/20", activeGlow: "shadow-loss/30" },
                  ].map((opt) => {
                    const isActive = journalData.sentiment === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        onClick={() => handleSentimentChange(opt.value as "great" | "okay" | "poor")}
                        whileHover={{ scale: 1.04, y: -3 }}
                        whileTap={{ scale: 0.96 }}
                        className={`relative flex-1 flex flex-col items-center gap-3 py-6 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                          isActive 
                            ? `${opt.color} shadow-xl ${opt.activeGlow}` 
                            : "border-border/30 hover:border-muted-foreground/20 bg-muted/10 hover:bg-muted/20"
                        }`}
                      >
                        {isActive && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />}
                        <span className={`text-4xl transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>{opt.emoji}</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? "text-foreground" : "text-muted-foreground/70"}`}>
                          {opt.label}
                        </span>
                        {isActive && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Tags - Premium Tag System */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border border-border/40 rounded-2xl p-6 shadow-xl shadow-black/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <h3 className="relative text-sm font-bold text-foreground mb-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  Tags
                  <span className="ml-auto text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                    {journalData.tags?.length || 0} selected
                  </span>
                </h3>
                
                {/* Selected Tags */}
                <div className="relative flex flex-wrap gap-2 mb-4 min-h-[40px]">
                  <AnimatePresence>
                    {journalData.tags?.map((tag) => (
                      <motion.span
                        key={tag}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/15 to-primary/5 text-primary rounded-lg text-sm font-semibold border border-primary/20 shadow-lg shadow-primary/10"
                      >
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-primary/60 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  {(!journalData.tags || journalData.tags.length === 0) && (
                    <span className="text-xs text-muted-foreground/40 font-medium">No tags added yet</span>
                  )}
                </div>
                
                {/* Tag Input */}
                <div className="relative flex gap-2 mb-4">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-focus-within:opacity-100 blur-xl transition-all duration-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Add a custom tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTag(tagInput)}
                      className="relative w-full px-4 py-3 bg-muted/15 backdrop-blur-sm border border-border/30 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-300 shadow-inner shadow-black/5"
                    />
                  </div>
                  <motion.button
                    onClick={() => handleAddTag(tagInput)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
                
                {/* Suggested Tags */}
                <div className="relative">
                  <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-3">Suggestions</div>
                  <div className="flex flex-wrap gap-2">
                    {commonTags.filter((t) => !journalData.tags?.includes(t)).slice(0, 6).map((tag) => (
                      <motion.button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3.5 py-1.5 text-xs text-muted-foreground/70 font-medium border border-border/30 rounded-lg hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-300"
                      >
                        + {tag}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Save Button - Premium CTA */}
              <motion.button
                onClick={handleSave}
                disabled={isSaving}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground rounded-2xl font-bold text-base shadow-2xl shadow-primary/30 hover:shadow-[0_20px_60px_-10px] hover:shadow-primary/40 transition-all duration-300 disabled:opacity-50 disabled:shadow-none overflow-hidden group"
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <Save className="relative w-5 h-5" />
                <span className="relative">{isSaving ? "Saving..." : "Save Journal Entry"}</span>
                {isSaving && (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Panel - Stats Sidebar - Premium Design */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="hidden lg:block border border-border/40 bg-gradient-to-b from-card via-card to-card/95 shrink-0 overflow-hidden rounded-2xl m-3 ml-0 backdrop-blur-xl shadow-2xl shadow-black/10"
          >
            <div className="w-[340px] h-full overflow-y-auto scrollbar-sleek p-6 space-y-5">
              {/* Toggle Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">Statistics</h3>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg hover:bg-muted/30 transition-all duration-200">
                  <PanelRightClose className="w-4 h-4 text-muted-foreground/60" />
                </button>
              </div>

              {/* Period P&L - Premium Card */}
              <div className={`relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border rounded-xl p-5 shadow-xl shadow-black/5 ${stats.totalPnL >= 0 ? "border-profit/20" : "border-loss/20"}`}>
                {/* Ambient Glow */}
                <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 ${stats.totalPnL >= 0 ? "bg-profit" : "bg-loss"}`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                
                <div className="relative">
                  <div className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em] font-bold mb-2">Total P&L</div>
                  <div className={`text-4xl font-black tracking-tight ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                    {formatCompactCurrency(stats.totalPnL, currency, exchangeRate)}
                  </div>
                  <div className="flex items-center gap-4 mt-5">
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-profit/10 rounded-lg border border-profit/20">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-profit/30 to-profit/10 flex items-center justify-center shadow-lg shadow-profit/20">
                        <Trophy className="w-3.5 h-3.5 text-profit" />
                      </div>
                      <span className="text-sm font-bold text-profit">{stats.winners} wins</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-loss/10 rounded-lg border border-loss/20">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-loss/30 to-loss/10 flex items-center justify-center shadow-lg shadow-loss/20">
                        <Target className="w-3.5 h-3.5 text-loss" />
                      </div>
                      <span className="text-sm font-bold text-loss">{stats.losers} losses</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Calendar - Premium */}
              <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border border-border/40 rounded-xl p-5 shadow-xl shadow-black/5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center shadow-lg shadow-black/5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    Calendar
                  </h4>
                  <div className="flex items-center gap-1 bg-muted/20 rounded-lg p-0.5">
                    <button onClick={() => setSelectedMonth((m) => (m === 0 ? (setSelectedYear((y) => y - 1), 11) : m - 1))} className="p-1.5 rounded-md hover:bg-muted/40 transition-colors">
                      <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <span className="text-xs font-bold text-foreground px-3 min-w-[50px] text-center">
                      {new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short" })}
                    </span>
                    <button onClick={() => setSelectedMonth((m) => (m === 11 ? (setSelectedYear((y) => y + 1), 0) : m + 1))} className="p-1.5 rounded-md hover:bg-muted/40 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="relative grid grid-cols-7 gap-1 mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="h-6 flex items-center justify-center text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">{d}</div>
                  ))}
                </div>
                <div className="relative grid grid-cols-7 gap-1.5">{renderCalendar()}</div>
                <div className="relative flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/20">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-profit to-profit/70 shadow-lg shadow-profit/30" />
                    <span className="text-[10px] text-muted-foreground/60 font-semibold">Profit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-loss to-loss/70 shadow-lg shadow-loss/30" />
                    <span className="text-[10px] text-muted-foreground/60 font-semibold">Loss</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats - Premium */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center shadow-lg shadow-black/5">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  Quick Stats
                </h4>
                
                {/* Win Rate - Premium Progress */}
                <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border border-border/40 rounded-xl p-5 shadow-xl shadow-black/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                  <div className="relative flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground/70 font-semibold uppercase tracking-wider">Win Rate</span>
                    <span className="text-2xl font-black text-foreground">{stats.winRate}%</span>
                  </div>
                  <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden shadow-inner shadow-black/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.winRate}%` }}
                      transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                      className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full shadow-lg shadow-primary/30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border border-border/40 rounded-xl p-4 shadow-xl shadow-black/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                    <div className="relative text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em] font-bold mb-2">Profit Factor</div>
                    <div className="relative text-2xl font-black text-foreground">{stats.profitFactor}</div>
                  </div>
                  <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/90 border border-border/40 rounded-xl p-4 shadow-xl shadow-black/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                    <div className="relative text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em] font-bold mb-2">Total Trades</div>
                    <div className="relative text-2xl font-black text-foreground">{stats.totalTrades}</div>
                  </div>
                  <div className="relative overflow-hidden bg-gradient-to-br from-profit/5 to-profit/[0.02] border border-profit/20 rounded-xl p-4 shadow-xl shadow-profit/5">
                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full blur-xl opacity-40 bg-profit" />
                    <div className="relative flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3.5 h-3.5 text-profit" />
                      <span className="text-[9px] text-profit/70 uppercase tracking-[0.12em] font-bold">Avg Win</span>
                    </div>
                    <div className="relative text-xl font-black text-profit">{formatCompactCurrency(stats.avgWin, currency, exchangeRate)}</div>
                  </div>
                  <div className="relative overflow-hidden bg-gradient-to-br from-loss/5 to-loss/[0.02] border border-loss/20 rounded-xl p-4 shadow-xl shadow-loss/5">
                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full blur-xl opacity-40 bg-loss" />
                    <div className="relative flex items-center gap-1.5 mb-2">
                      <TrendingDown className="w-3.5 h-3.5 text-loss" />
                      <span className="text-[9px] text-loss/70 uppercase tracking-[0.12em] font-bold">Avg Loss</span>
                    </div>
                    <div className="relative text-xl font-black text-loss">{formatCompactCurrency(stats.avgLoss, currency, exchangeRate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle (when closed) */}
      {!isSidebarOpen && (
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsSidebarOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 p-3 bg-card border border-border rounded-xl shadow-lg hover:bg-muted transition-all duration-200 z-40"
        >
          <PanelRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={lightboxImage}
              alt="Screenshot"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-200"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyJournal;
