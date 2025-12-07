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
} from "lucide-react";
import useAccountDetails from "@/store/accountdetails";
import { formatCompactNumber } from "@/utils/formatNumber";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";
import { SymbolLogo } from "@/components/ui/SymbolLogo";
import QuickFillDropdown from "@/components/journal/QuickFillDropdown";

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
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
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
      await fetch("/api/daily-journal/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiName: "updateJournal",
          id: tradeId,
          tokenn,
          accountType: selectedTrade.accountType,
          jrData: { ...journalData, templateId: templates[selectedTemplateIdx]?.name },
        }),
      });
      setAccounts();
    } catch (error) {
      console.error("Error saving journal:", error);
    } finally {
      setIsSaving(false);
    }
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

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="h-8" />);

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const pnl = calendarData[dateStr] || 0;
      const isToday = new Date(selectedYear, selectedMonth, day).toDateString() === today.toDateString();

      let cellClass = "text-muted-foreground hover:bg-muted/50";
      if (pnl > 0) cellClass = "bg-profit/20 text-profit hover:bg-profit/30 font-medium";
      else if (pnl < 0) cellClass = "bg-loss/20 text-loss hover:bg-loss/30 font-medium";

      cells.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all ${cellClass} ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Stats Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/95 border-b border-border/50">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Trade count */}
            <p className="text-xs text-muted-foreground">
              {stats.totalTrades} trades · {stats.journaledTrades} journaled
            </p>

            {/* Right: Compact Stats */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">P&L</span>
                <span className={`text-sm font-semibold tabular-nums ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                  {stats.totalPnL >= 0 ? "+" : ""}{formatCompactCurrency(stats.totalPnL, currency, exchangeRate)}
                </span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Win Rate</span>
                <span className="text-sm font-semibold text-foreground">{stats.winRate}%</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-profit">{stats.winners}</span>
                <span className="text-xs text-muted-foreground">W</span>
                <span className="text-muted-foreground mx-0.5">/</span>
                <span className="text-sm font-semibold text-loss">{stats.losers}</span>
                <span className="text-xs text-muted-foreground">L</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout - Two Columns */}
      <div className="flex h-[calc(100vh-49px)]">
        {/* Left Panel - Trade List (Always Visible) */}
        <div className={`${mobileView === "list" ? "flex" : "hidden md:flex"} w-full md:w-80 lg:w-96 flex-col flex-shrink-0 border-r border-border bg-card/30`}>
              {/* Clean Search & Minimal Filters */}
              <div className="p-3 space-y-3 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search trades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted/50 border-0 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-background transition-all"
                  />
                </div>
                
                {/* Segmented Control Filter */}
                <div className="flex p-0.5 bg-muted/50 rounded-lg">
                  {[
                    { value: "all", label: "All" },
                    { value: "winners", label: "Won", count: stats.winners },
                    { value: "losers", label: "Lost", count: stats.losers },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value as typeof filter)}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        filter === f.value
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter === f.value && (
                        <motion.div
                          layoutId="filter-bg"
                          className="absolute inset-0 bg-card rounded-md shadow-sm"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      <span className="relative z-10">{f.label}</span>
                      {f.count !== undefined && (
                        <span className={`relative z-10 text-[10px] tabular-nums ${
                          filter === f.value 
                            ? f.value === "winners" ? "text-profit" : f.value === "losers" ? "text-loss" : ""
                            : "text-muted-foreground/60"
                        }`}>
                          {f.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade List */}
              <div className="flex-1 overflow-y-auto">
                {Object.keys(groupedTrades).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                      <Search className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">No trades found</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
                  </div>
                ) : (
                  Object.entries(groupedTrades).map(([dateLabel, dateTrades], groupIdx) => (
                    <div key={dateLabel}>
                      <div className="sticky top-0 z-10 px-3 py-2 bg-background/80 backdrop-blur-sm">
                        <span className="text-[11px] font-medium text-muted-foreground">{dateLabel}</span>
                        <span className="text-[11px] text-muted-foreground/50 ml-1.5">· {dateTrades.length}</span>
                      </div>
                      <div className="px-2 py-2 space-y-1.5">
                        {dateTrades.map((trade, idx) => {
                          const getTradeKey = (t: Trade) => t._id || t.id || `${t.date}-${t.EntryTime || t.time || ''}-${t.Item || t.symbol || ''}-${t.Profit}`;
                          const tradeKey = getTradeKey(trade);
                          const selectedKey = selectedTrade ? getTradeKey(selectedTrade) : null;
                          const isSelected = tradeKey === selectedKey;
                          const isJournaled = Boolean(trade.jrData && (
                            trade.jrData.sentiment ||
                            trade.jrData.templateId ||
                            (trade.jrData.prompts && Object.values(trade.jrData.prompts).some(v => v)) ||
                            (trade.jrData.tags && trade.jrData.tags.length > 0)
                          ));
                          const isProfit = trade.Profit >= 0;

                          return (
                            <motion.button
                              key={tradeKey}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02, duration: 0.15 }}
                              whileHover={{ y: -2, transition: { duration: 0.15 } }}
                              onClick={() => handleSelectTrade(trade)}
                              className={`w-full text-left transition-all duration-200 relative rounded-xl overflow-hidden group ${
                                isSelected 
                                  ? "bg-card ring-1 ring-primary/40 shadow-lg shadow-primary/10"
                                  : "hover:bg-card/80 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/15"
                              }`}
                            >

                              <div className="relative p-3">
                                {/* Top Row: Symbol + Side + Time */}
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2.5">
                                    {/* Symbol Logo */}
                                    <SymbolLogo 
                                      symbol={trade.Item || trade.symbol || "?"} 
                                      size="md"
                                      isProfit={isProfit}
                                      isSelected={isSelected}
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-sm text-foreground">{trade.Item || trade.symbol}</span>
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                          (trade.side || trade.Type)?.toLowerCase() === "long" 
                                            ? "bg-profit/10 text-profit" 
                                            : "bg-loss/10 text-loss"
                                        }`}>
                                          {trade.side || trade.Type}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-muted-foreground">
                                        {formatTime(trade.EntryTime || trade.time) || "—"}
                                        {trade.strategy && <span className="text-muted-foreground/50"> · {trade.strategy}</span>}
                                      </span>
                                    </div>
                                  </div>

                                  {/* P&L - Clean & Bold */}
                                  <div className={`text-right`}>
                                    <div className={`text-base font-bold tabular-nums ${isProfit ? "text-profit" : "text-loss"}`}>
                                      {isProfit ? "+" : "−"}{formatCompactCurrency(Math.abs(trade.Profit), currency, exchangeRate)}
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Row: Status Chips */}
                                <div className="flex items-center gap-1.5 ml-[46px]">
                                  {isJournaled && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/8 text-primary text-[10px] font-medium">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      Journaled
                                    </span>
                                  )}
                                  {trade.jrData?.sentiment && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                      trade.jrData.sentiment === "great" 
                                        ? "bg-profit/10 text-profit" 
                                        : trade.jrData.sentiment === "okay" 
                                        ? "bg-amber-500/10 text-amber-500"
                                        : "bg-loss/10 text-loss"
                                    }`}>
                                      {trade.jrData.sentiment === "great" ? "Great" : trade.jrData.sentiment === "okay" ? "Okay" : "Poor"}
                                    </span>
                                  )}
                                  {trade.jrData?.tags?.slice(0, 2).map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium truncate max-w-[80px]">
                                      {tag}
                                    </span>
                                  ))}
                                  {(trade.jrData?.tags?.length || 0) > 2 && (
                                    <span className="text-[10px] text-muted-foreground">+{(trade.jrData?.tags?.length || 0) - 2}</span>
                                  )}
                                </div>
                              </div>

                              {/* Selection indicator - thin left border */}
                              {isSelected && (
                                <motion.div
                                  layoutId="trade-indicator"
                                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
        </div>

        {/* Center Panel - Journal Content */}
        <div className={`flex-1 min-w-0 flex flex-col ${mobileView === "content" ? "block" : "hidden md:block"}`}>
          {/* Analytics Toggle - Right aligned */}
          <div className="hidden md:flex items-center justify-end px-4 py-2 border-b border-border bg-card/30">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <span>{isSidebarOpen ? "Hide" : "Show"} Analytics</span>
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </motion.button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {selectedTrade ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 md:p-6 space-y-4"
              >
                {/* Clean Trade Header */}
                <div className="pb-4 border-b border-border/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <SymbolLogo 
                        symbol={selectedTrade.Item || selectedTrade.symbol || "?"} 
                        size="lg"
                        isProfit={selectedTrade.Profit >= 0}
                        isSelected={true}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-foreground">{selectedTrade.Item || selectedTrade.symbol}</h2>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            (selectedTrade.side || selectedTrade.Type)?.toLowerCase() === "long" 
                              ? "bg-profit/10 text-profit" 
                              : "bg-loss/10 text-loss"
                          }`}>
                            {selectedTrade.side || selectedTrade.Type}
                          </span>
                          {selectedTrade.strategy && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {selectedTrade.strategy}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{formatTime(selectedTrade.EntryTime || selectedTrade.time) || "—"}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span>Entry ${selectedTrade.entryPrice ? parseFloat(String(selectedTrade.entryPrice)).toFixed(2) : "—"}</span>
                          <span className="text-muted-foreground/30">→</span>
                          <span>Exit ${selectedTrade.exitPrice ? parseFloat(String(selectedTrade.exitPrice)).toFixed(2) : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-xl font-bold tabular-nums ${selectedTrade.Profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {selectedTrade.Profit >= 0 ? "+" : "−"}{formatCompactCurrency(Math.abs(selectedTrade.Profit), currency, exchangeRate)}
                    </div>
                  </div>
                </div>

                {/* Screenshots - Clean Card */}
                <div className="p-4 bg-card border border-border rounded-xl">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Screenshots</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {["before", "after"].map((type) => (
                      <div key={type}>
                        <p className="text-[11px] text-muted-foreground mb-1.5">
                          {type === "before" ? "Entry" : "Exit"}
                        </p>
                        {selectedTrade[`${type}URL`] ? (
                          <div
                            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group border border-border"
                            onClick={() => setLightboxImage(selectedTrade[`${type}URL`])}
                          >
                            <img
                              src={selectedTrade[`${type}URL`]}
                              alt={`${type} screenshot`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                              <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer transition-all hover:bg-muted/30 group">
                            <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                              Upload
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, type as "before" | "after")}
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentiment Selector - Clean */}
                <div className="p-4 bg-card border border-border rounded-xl">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">How was this trade?</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "great", label: "Great", color: "profit" },
                      { id: "okay", label: "Okay", color: "amber" },
                      { id: "poor", label: "Poor", color: "loss" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSentimentChange(s.id as "great" | "okay" | "poor")}
                        className={`relative py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                          journalData.sentiment === s.id
                            ? s.color === "profit" 
                              ? "border-profit bg-profit/10 text-profit" 
                              : s.color === "amber" 
                              ? "border-amber-500 bg-amber-500/10 text-amber-500"
                              : "border-loss bg-loss/10 text-loss"
                            : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        {journalData.sentiment === s.id && (
                          <motion.div
                            layoutId="sentiment-bg"
                            className="absolute inset-0 rounded-lg"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                          />
                        )}
                        <span className="relative z-10">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Journal Template - Clean */}
                <div className="p-4 bg-card border border-border rounded-xl">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Template</h3>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {templates.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTemplateIdx(idx)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedTemplateIdx === idx
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Journal Prompts - Clean Floating Labels with Quick Fill */}
                <div className="p-4 bg-card border border-border rounded-xl space-y-4">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {templates[selectedTemplateIdx]?.name || "Notes"}
                  </h3>
                  {templates[selectedTemplateIdx]?.prompts.map((prompt, promptIdx) => {
                    const hasValue = Boolean(journalData.prompts?.[prompt.id]);
                    return (
                      <div key={prompt.id} className="relative">
                        {/* Quick Fill Button */}
                        <div className="absolute right-2 top-1 z-10">
                          <QuickFillDropdown
                            promptId={prompt.id}
                            promptType={prompt.type === "textarea" ? "textarea" : "text"}
                            currentValue={journalData.prompts?.[prompt.id] || ""}
                            onSelect={(value) => handlePromptChange(prompt.id, value)}
                          />
                        </div>
                        
                        {prompt.type === "textarea" ? (
                          <>
                            <textarea
                              id={`prompt-${prompt.id}`}
                              value={journalData.prompts?.[prompt.id] || ""}
                              onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                              rows={3}
                              className="peer w-full px-3 pt-7 pb-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 resize-none transition-all"
                              placeholder={prompt.placeholder}
                            />
                            <label
                              htmlFor={`prompt-${prompt.id}`}
                              className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                                hasValue 
                                  ? "top-1.5 text-[10px] font-medium text-primary" 
                                  : "top-3 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-primary"
                              }`}
                            >
                              {prompt.label}
                            </label>
                          </>
                        ) : (
                          <>
                            <input
                              id={`prompt-${prompt.id}`}
                              type="text"
                              value={journalData.prompts?.[prompt.id] || ""}
                              onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                              className="peer w-full px-3 pt-7 pb-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all"
                              placeholder={prompt.placeholder}
                            />
                            <label
                              htmlFor={`prompt-${prompt.id}`}
                              className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                                hasValue 
                                  ? "top-1.5 text-[10px] font-medium text-primary" 
                                  : "top-3 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-primary"
                              }`}
                            >
                              {prompt.label}
                            </label>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quick Tags - Clean */}
                <div className="p-4 bg-card border border-border rounded-xl">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Tags</h3>
                  
                  {journalData.tags && journalData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {journalData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                        >
                          {tag}
                          <button 
                            onClick={() => handleRemoveTag(tag)} 
                            className="hover:text-primary/70 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {commonTags.filter(t => !journalData.tags?.includes(t)).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className="px-2 py-1 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md text-xs font-medium transition-all"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button - Clean */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || isDemo}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Entry
                    </>
                  )}
                </button>

                {isDemo && (
                  <p className="text-center text-xs text-muted-foreground">
                    Demo mode - Add real trades to save
                  </p>
                )}
              </motion.div>
            ) : (
              /* Clean Empty State */
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Select a Trade</h3>
                <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                  Choose a trade from the list to start journaling
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Analytics */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 300 }}
              exit={{ opacity: 0, width: 0 }}
              className="hidden lg:block flex-shrink-0 border-l border-border/50 bg-background overflow-hidden"
            >
              <div className="w-[300px] p-4 space-y-4 overflow-y-auto h-full">
                {/* Clean Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Analytics</h4>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <PanelRightClose className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Summary Stats - Clean Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Total P&L</span>
                    <span className={`text-base font-semibold tabular-nums ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                      {stats.totalPnL >= 0 ? "+" : ""}{formatCompactCurrency(stats.totalPnL, currency, exchangeRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="text-base font-semibold text-foreground">{stats.winRate}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Record</span>
                    <span className="text-base font-semibold">
                      <span className="text-profit">{stats.winners}</span>
                      <span className="text-muted-foreground mx-0.5">/</span>
                      <span className="text-loss">{stats.losers}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Profit Factor</span>
                    <span className="text-base font-semibold text-foreground">{stats.profitFactor}</span>
                  </div>
                </div>

                {/* Win Rate Bar */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Win Rate Distribution</span>
                    <span className="text-sm font-semibold text-foreground">{stats.winRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.winRate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-profit rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
                    <span>{stats.winners} wins</span>
                    <span>{stats.losers} losses</span>
                  </div>
                </div>

                {/* Avg Win/Loss - Minimal Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg Win</span>
                    <p className="text-sm font-semibold text-profit mt-1">{formatCompactCurrency(stats.avgWin, currency, exchangeRate)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg Loss</span>
                    <p className="text-sm font-semibold text-loss mt-1">{formatCompactCurrency(stats.avgLoss, currency, exchangeRate)}</p>
                  </div>
                </div>

                {/* Premium Calendar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Calendar</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedMonth((m) => (m === 0 ? (setSelectedYear((y) => y - 1), 11) : m - 1))}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <span className="text-xs font-semibold text-foreground px-2 min-w-[80px] text-center">
                        {new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short", year: "numeric" })}
                      </span>
                      <button
                        onClick={() => setSelectedMonth((m) => (m === 11 ? (setSelectedYear((y) => y + 1), 0) : m + 1))}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="h-8 flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                  
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-profit/40" />
                      <span className="text-[10px] text-muted-foreground">Profit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-loss/40" />
                      <span className="text-[10px] text-muted-foreground">Loss</span>
                    </div>
                  </div>
                </motion.div>
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
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={lightboxImage}
              alt="Trade screenshot"
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border px-4 py-3 z-50">
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileView("list")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              mobileView === "list" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Trades
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileView("content")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              mobileView === "content" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Pencil className="w-4 h-4" />
            Journal
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default DailyJournal;
