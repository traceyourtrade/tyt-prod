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
      {/* Premium Glassmorphic Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-profit to-blue-500" />
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center border border-primary/20">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-profit border-2 border-background flex items-center justify-center">
                  <Sparkles className="h-1.5 w-1.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Daily Journal</h1>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTrades} trades · {stats.journaledTrades} journaled
                </p>
              </div>
            </div>

            {/* Quick Stats Pills */}
            <div className="hidden md:flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${stats.totalPnL >= 0 ? "bg-profit/10 border-profit/20" : "bg-loss/10 border-loss/20"}`}
              >
                {stats.totalPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-profit" /> : <TrendingDown className="w-3.5 h-3.5 text-loss" />}
                <span className={`text-sm font-semibold ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                  {formatCompactCurrency(stats.totalPnL, currency, exchangeRate)}
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border"
              >
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">{stats.winRate}%</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border"
              >
                <span className="text-sm font-semibold text-profit">{stats.winners}</span>
                <span className="text-muted-foreground text-sm">W</span>
                <span className="text-muted-foreground text-sm">/</span>
                <span className="text-sm font-semibold text-loss">{stats.losers}</span>
                <span className="text-muted-foreground text-sm">L</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout - Three Columns */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Trade List */}
        <AnimatePresence mode="wait">
          {isLeftPanelOpen && (
            <motion.div
              initial={{ opacity: 0, marginLeft: -384 }}
              animate={{ opacity: 1, marginLeft: 0 }}
              exit={{ opacity: 0, marginLeft: -384 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`${mobileView === "list" ? "flex" : "hidden md:flex"} w-full md:w-80 lg:w-96 flex-col flex-shrink-0 border-r border-border bg-card/30`}
            >
              {/* Premium Search & Filter */}
              <div className="p-4 space-y-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-profit/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search trades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                </div>
                
                {/* Pill-Style Filter Buttons */}
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "All", icon: LayoutDashboard },
                    { value: "winners", label: "Winners", icon: TrendingUp, count: stats.winners },
                    { value: "losers", label: "Losers", icon: TrendingDown, count: stats.losers },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <motion.button
                        key={f.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFilter(f.value as typeof filter)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          filter === f.value
                            ? f.value === "winners" 
                              ? "bg-profit/10 text-profit border border-profit/30 shadow-sm shadow-profit/10" 
                              : f.value === "losers" 
                              ? "bg-loss/10 text-loss border border-loss/30 shadow-sm shadow-loss/10"
                              : "bg-primary/10 text-primary border border-primary/30 shadow-sm shadow-primary/10"
                            : "bg-background border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{f.label}</span>
                        {f.count !== undefined && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            filter === f.value 
                              ? f.value === "winners" ? "bg-profit/20" : "bg-loss/20"
                              : "bg-muted"
                          }`}>
                            {f.count}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Trade List */}
              <div className="flex-1 overflow-y-auto">
                {Object.keys(groupedTrades).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 px-4"
                  >
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-muted flex items-center justify-center border-2 border-background">
                        <Search className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-foreground font-medium mb-1">No trades found</p>
                    <p className="text-sm text-muted-foreground text-center">Try adjusting your filters or search</p>
                  </motion.div>
                ) : (
                  Object.entries(groupedTrades).map(([dateLabel, dateTrades], groupIdx) => (
                    <div key={dateLabel}>
                      <div className="sticky top-0 z-10 px-4 py-2 bg-gradient-to-r from-muted/80 to-muted/50 backdrop-blur-sm border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{dateLabel}</span>
                          <span className="text-[10px] text-muted-foreground/60">({dateTrades.length})</span>
                        </div>
                      </div>
                      <div className="divide-y divide-border/30">
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
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              whileHover={{ backgroundColor: "var(--muted)" }}
                              onClick={() => handleSelectTrade(trade)}
                              className={`w-full p-4 text-left transition-all relative group ${
                                isSelected 
                                  ? isProfit ? "bg-profit/5" : "bg-loss/5"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              {/* Selection Indicator */}
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    exit={{ scaleY: 0 }}
                                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${isProfit ? "bg-profit" : "bg-loss"}`}
                                  />
                                )}
                              </AnimatePresence>

                              <div className="flex items-center gap-3">
                                {/* Symbol Badge */}
                                <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                                  isProfit 
                                    ? "bg-gradient-to-br from-profit/20 to-profit/10 text-profit border border-profit/20" 
                                    : "bg-gradient-to-br from-loss/20 to-loss/10 text-loss border border-loss/20"
                                }`}>
                                  <span className="text-[10px]">{(trade.Item || trade.symbol || "?").slice(0, 4)}</span>
                                  <span className="text-[8px] opacity-60">{trade.side || trade.Type}</span>
                                </div>

                                {/* Trade Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold text-foreground truncate">{trade.Item || trade.symbol}</span>
                                    {isJournaled && (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                                        <Pencil className="w-2.5 h-2.5 text-primary" />
                                        <span className="text-[9px] font-medium text-primary">Journaled</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(trade.EntryTime || trade.time) || "—"}</span>
                                    {trade.strategy && (
                                      <>
                                        <span className="text-border">•</span>
                                        <span className="truncate">{trade.strategy}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* P&L */}
                                <div className="text-right flex-shrink-0">
                                  <div className={`flex items-center gap-1 text-base font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
                                    {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {formatCompactCurrency(Math.abs(trade.Profit), currency, exchangeRate)}
                                  </div>
                                  {trade.jrData?.sentiment && (
                                    <span className="text-xs">
                                      {trade.jrData.sentiment === "great" ? "🎯" : trade.jrData.sentiment === "okay" ? "😐" : "😔"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Panel - Journal Content */}
        <div className={`flex-1 min-w-0 flex flex-col ${mobileView === "content" ? "block" : "hidden md:block"}`}>
          {/* Panel Toggle Toolbar */}
          <div className="hidden md:flex items-center justify-between px-4 py-2 border-b border-border bg-card/30">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              {isLeftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              <span>{isLeftPanelOpen ? "Hide" : "Show"} Trades</span>
            </motion.button>
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
                className={`p-4 md:p-6 space-y-4 mx-auto transition-all ${
                  !isLeftPanelOpen && !isSidebarOpen ? "max-w-4xl" : "max-w-2xl"
                }`}
              >
                {/* Premium Trade Header Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative overflow-hidden rounded-2xl border p-5 ${
                    selectedTrade.Profit >= 0 
                      ? "bg-gradient-to-br from-profit/5 via-profit/3 to-transparent border-profit/20" 
                      : "bg-gradient-to-br from-loss/5 via-loss/3 to-transparent border-loss/20"
                  }`}
                >
                  {/* Subtle gradient glow */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
                    selectedTrade.Profit >= 0 ? "bg-profit" : "bg-loss"
                  }`} />
                  
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold ${
                        selectedTrade.Profit >= 0 
                          ? "bg-gradient-to-br from-profit/30 to-profit/10 text-profit border border-profit/30" 
                          : "bg-gradient-to-br from-loss/30 to-loss/10 text-loss border border-loss/30"
                      }`}>
                        <span className="text-sm">{(selectedTrade.Item || selectedTrade.symbol || "?").slice(0, 4)}</span>
                        <span className="text-[10px] opacity-70">{selectedTrade.side || selectedTrade.Type}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-bold text-foreground">{selectedTrade.Item || selectedTrade.symbol}</h2>
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                            {selectedTrade.side || selectedTrade.Type}
                          </span>
                          {selectedTrade.strategy && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {selectedTrade.strategy}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            ${selectedTrade.entryPrice ? parseFloat(String(selectedTrade.entryPrice)).toFixed(2) : "—"}
                          </span>
                          <span>→</span>
                          <span className="flex items-center gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            ${selectedTrade.exitPrice ? parseFloat(String(selectedTrade.exitPrice)).toFixed(2) : "—"}
                          </span>
                          <span className="text-border">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(selectedTrade.EntryTime || selectedTrade.time) || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-2 text-2xl font-bold ${selectedTrade.Profit >= 0 ? "text-profit" : "text-loss"}`}>
                        {selectedTrade.Profit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        {selectedTrade.Profit >= 0 ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit, currency, exchangeRate)}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Screenshots - Premium Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Trade Screenshots</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {["before", "after"].map((type) => (
                      <div key={type}>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                          {type === "before" ? <ArrowUpRight className="w-3 h-3 text-profit" /> : <ArrowDownRight className="w-3 h-3 text-loss" />}
                          {type === "before" ? "Entry" : "Exit"}
                        </p>
                        {selectedTrade[`${type}URL`] ? (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-border shadow-sm"
                            onClick={() => setLightboxImage(selectedTrade[`${type}URL`])}
                          >
                            <img
                              src={selectedTrade[`${type}URL`]}
                              alt={`${type} screenshot`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-3 transition-opacity">
                              <span className="text-white text-xs font-medium flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-all bg-muted/20 hover:bg-muted/40 group">
                            <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-2 transition-colors">
                              <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium transition-colors">
                              Upload {type === "before" ? "Entry" : "Exit"}
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
                </motion.div>

                {/* Sentiment Selector - Premium */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">How was this trade?</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "great", emoji: "🎯", label: "Great", desc: "Executed perfectly", color: "profit" },
                      { id: "okay", emoji: "😐", label: "Okay", desc: "Room to improve", color: "amber" },
                      { id: "poor", emoji: "😔", label: "Poor", desc: "Learn from this", color: "loss" },
                    ].map((s) => (
                      <motion.button
                        key={s.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSentimentChange(s.id as "great" | "okay" | "poor")}
                        className={`relative p-4 rounded-xl border transition-all flex flex-col items-center ${
                          journalData.sentiment === s.id
                            ? s.color === "profit" 
                              ? "border-profit bg-profit/10 shadow-sm shadow-profit/10" 
                              : s.color === "amber" 
                              ? "border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                              : "border-loss bg-loss/10 shadow-sm shadow-loss/10"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                        }`}
                      >
                        <span className="text-2xl mb-2">{s.emoji}</span>
                        <span className={`text-sm font-semibold mb-0.5 ${
                          journalData.sentiment === s.id 
                            ? s.color === "profit" ? "text-profit" : s.color === "amber" ? "text-amber-500" : "text-loss"
                            : "text-foreground"
                        }`}>
                          {s.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                        {journalData.sentiment === s.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${
                              s.color === "profit" ? "bg-profit" : s.color === "amber" ? "bg-amber-500" : "bg-loss"
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Template Selection - Pill Style */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Journal Template</h3>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {templates.map((template, idx) => {
                      const Icon = getTemplateIcon(template.icon);
                      const colors = getTemplateColor(template.color);
                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedTemplateIdx(idx)}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl border text-sm transition-all ${
                            selectedTemplateIdx === idx
                              ? `${colors.bg} ${colors.border} ${colors.text}`
                              : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium whitespace-nowrap">{template.name}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Journal Prompts - Floating Label Style */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${getTemplateColor(templates[selectedTemplateIdx]?.color || "blue").bg} flex items-center justify-center`}>
                      {(() => {
                        const Icon = getTemplateIcon(templates[selectedTemplateIdx]?.icon || "FileText");
                        return <Icon className={`w-4 h-4 ${getTemplateColor(templates[selectedTemplateIdx]?.color || "blue").text}`} />;
                      })()}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {templates[selectedTemplateIdx]?.name || "Notes"}
                    </h3>
                  </div>
                  <div className="space-y-5">
                    {templates[selectedTemplateIdx]?.prompts.map((prompt, promptIdx) => {
                      const hasValue = Boolean(journalData.prompts?.[prompt.id]);
                      return (
                        <motion.div
                          key={prompt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + promptIdx * 0.05 }}
                          className="group relative"
                        >
                          {prompt.type === "textarea" ? (
                            <div className="relative">
                              <textarea
                                id={`prompt-${prompt.id}`}
                                value={journalData.prompts?.[prompt.id] || ""}
                                onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                                rows={3}
                                className="peer w-full px-4 pt-6 pb-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none transition-all"
                                placeholder={prompt.placeholder}
                              />
                              <label
                                htmlFor={`prompt-${prompt.id}`}
                                className={`absolute left-4 transition-all duration-200 pointer-events-none flex items-center gap-1.5 ${
                                  hasValue 
                                    ? "top-2 text-[10px] font-semibold text-primary" 
                                    : "top-4 text-sm text-muted-foreground peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-primary"
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold transition-colors ${
                                  hasValue ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground peer-focus:bg-primary/20 peer-focus:text-primary"
                                }`}>
                                  {promptIdx + 1}
                                </span>
                                {prompt.label}
                              </label>
                              {!hasValue && (
                                <span className="absolute left-4 top-[3.25rem] text-xs text-muted-foreground/60 pointer-events-none peer-focus:opacity-100 opacity-0 transition-opacity">
                                  {prompt.placeholder}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                id={`prompt-${prompt.id}`}
                                type="text"
                                value={journalData.prompts?.[prompt.id] || ""}
                                onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                                className="peer w-full px-4 pt-5 pb-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                placeholder={prompt.placeholder}
                              />
                              <label
                                htmlFor={`prompt-${prompt.id}`}
                                className={`absolute left-4 transition-all duration-200 pointer-events-none flex items-center gap-1.5 ${
                                  hasValue 
                                    ? "top-1.5 text-[10px] font-semibold text-primary" 
                                    : "top-3.5 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-primary"
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold transition-colors ${
                                  hasValue ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground peer-focus:bg-primary/20 peer-focus:text-primary"
                                }`}>
                                  {promptIdx + 1}
                                </span>
                                {prompt.label}
                              </label>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Tags - Premium */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Quick Tags</h3>
                  </div>
                  
                  {journalData.tags && journalData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {journalData.tags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium border border-primary/20"
                        >
                          {tag}
                          <button 
                            onClick={() => handleRemoveTag(tag)} 
                            className="hover:text-primary/70 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {commonTags.filter(t => !journalData.tags?.includes(t)).map((tag) => (
                      <motion.button
                        key={tag}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddTag(tag)}
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-all border border-border hover:border-primary/30"
                      >
                        + {tag}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Save Button - Premium */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSave}
                  disabled={isSaving || isDemo}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
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
                    Demo mode - Add real trades to save journal entries
                  </p>
                )}
              </motion.div>
            ) : (
              /* Premium Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center p-8"
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 via-profit/10 to-blue-500/10 flex items-center justify-center border border-border">
                    <BookOpen className="w-10 h-10 text-primary" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-profit to-profit/50 flex items-center justify-center shadow-lg shadow-profit/30"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Select a Trade</h3>
                <p className="text-muted-foreground text-center max-w-xs mb-6">
                  Choose a trade from the list to start journaling your thoughts and analysis
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {[
                    { icon: Pencil, text: "Document your trade decisions" },
                    { icon: Target, text: "Track your emotional state" },
                    { icon: Award, text: "Build your trading playbook" },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Analytics */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 320 }}
              exit={{ opacity: 0, width: 0 }}
              className="hidden lg:block flex-shrink-0 border-l border-border bg-card/30 overflow-hidden"
            >
              <div className="w-80 p-4 space-y-4 overflow-y-auto h-full">
                {/* Glassmorphic Summary Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Performance</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl ${stats.totalPnL >= 0 ? "bg-profit/10 border border-profit/20" : "bg-loss/10 border border-loss/20"}`}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total P&L</p>
                      <p className={`text-lg font-bold ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatCompactCurrency(stats.totalPnL, currency, exchangeRate)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
                      <p className="text-lg font-bold text-foreground">{stats.winRate}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Record</p>
                      <p className="text-lg font-bold">
                        <span className="text-profit">{stats.winners}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-loss">{stats.losers}</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Profit Factor</p>
                      <p className="text-lg font-bold text-foreground">{stats.profitFactor}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Win Rate Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-2xl bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Win Rate</span>
                    <span className="text-lg font-bold text-foreground">{stats.winRate}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.winRate}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-profit rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{stats.winners} wins</span>
                    <span>{stats.losers} losses</span>
                  </div>
                </motion.div>

                {/* Avg Win/Loss */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="p-3 rounded-xl bg-profit/10 border border-profit/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-profit" />
                      <span className="text-[10px] text-profit uppercase tracking-wider font-medium">Avg Win</span>
                    </div>
                    <p className="text-base font-bold text-profit">{formatCompactCurrency(stats.avgWin, currency, exchangeRate)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-loss/10 border border-loss/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-loss" />
                      <span className="text-[10px] text-loss uppercase tracking-wider font-medium">Avg Loss</span>
                    </div>
                    <p className="text-base font-bold text-loss">{formatCompactCurrency(stats.avgLoss, currency, exchangeRate)}</p>
                  </div>
                </motion.div>

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
