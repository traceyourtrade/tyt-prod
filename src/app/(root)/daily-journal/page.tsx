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
  Activity,
  Flame,
  Award,
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
  { id: "demo-1", date: new Date().toISOString().split("T")[0], EntryTime: "09:32:00", Profit: 1250, Item: "AAPL", symbol: "AAPL", Type: "Long", side: "Long", strategy: "Momentum", entryPrice: "178.50", exitPrice: "182.35" },
  { id: "demo-2", date: new Date().toISOString().split("T")[0], EntryTime: "10:15:00", Profit: -380, Item: "TSLA", symbol: "TSLA", Type: "Short", side: "Short", strategy: "Breakout", entryPrice: "245.80", exitPrice: "248.10" },
  { id: "demo-3", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], EntryTime: "11:45:00", Profit: 890, Item: "NVDA", symbol: "NVDA", Type: "Long", side: "Long", strategy: "Scalping", entryPrice: "485.20", exitPrice: "492.75" },
  { id: "demo-4", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], EntryTime: "14:20:00", Profit: -520, Item: "MSFT", symbol: "MSFT", Type: "Long", side: "Long", strategy: "Swing", entryPrice: "378.90", exitPrice: "375.40" },
  { id: "demo-5", date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], EntryTime: "09:55:00", Profit: 2100, Item: "META", symbol: "META", Type: "Long", side: "Long", strategy: "Reversal", entryPrice: "312.50", exitPrice: "324.80" },
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
    case "blue": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "yellow": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    case "green": return "text-profit bg-profit/10 border-profit/20";
    case "pink": return "text-pink-500 bg-pink-500/10 border-pink-500/20";
    case "purple": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
    default: return "text-primary bg-primary/10 border-primary/20";
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

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="h-9" />);

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const pnl = calendarData[dateStr] || 0;
      const isToday = new Date(selectedYear, selectedMonth, day).toDateString() === today.toDateString();

      let cellClass = "text-muted-foreground hover:bg-muted/50";
      if (pnl > 0) cellClass = "bg-profit/20 text-profit hover:bg-profit/30";
      else if (pnl < 0) cellClass = "bg-loss/20 text-loss hover:bg-loss/30";

      cells.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-colors ${cellClass} ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
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
      {/* Header - Matches app design */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors md:hidden">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Daily Journal</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Review and reflect on your trades</p>
              </div>
            </div>
          </div>

          {/* Stats Summary - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg border ${stats.totalPnL >= 0 ? "bg-profit/10 border-profit/20" : "bg-loss/10 border-loss/20"}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total P&L</p>
              <p className={`text-lg font-bold ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                {formatCompactCurrency(stats.totalPnL, currency, exchangeRate)}
              </p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-card border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
              <p className="text-lg font-bold text-foreground">{stats.winRate}%</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-card border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Record</p>
              <p className="text-lg font-bold">
                <span className="text-profit">{stats.winners}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-loss">{stats.losers}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
          >
            {isSidebarOpen ? <PanelRightClose className="w-5 h-5 text-muted-foreground" /> : <PanelRight className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Main Layout - Three Columns */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Trade List */}
        <div className={`${mobileView === "list" ? "flex" : "hidden md:flex"} w-full md:w-80 lg:w-96 flex-col flex-shrink-0 border-r border-border bg-card/50`}>
          {/* Search & Filter */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              {[
                { value: "all", label: "All" },
                { value: "winners", label: "Winners", count: stats.winners },
                { value: "losers", label: "Losers", count: stats.losers },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value as typeof filter)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    filter === f.value
                      ? f.value === "winners" ? "bg-profit/10 text-profit border border-profit/20" 
                        : f.value === "losers" ? "bg-loss/10 text-loss border border-loss/20"
                        : "bg-primary/10 text-primary border border-primary/20"
                      : "bg-card border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.label} {f.count !== undefined && `(${f.count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Trade List */}
          <div className="flex-1 overflow-y-auto">
            {Object.keys(groupedTrades).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No trades found</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              Object.entries(groupedTrades).map(([dateLabel, dateTrades]) => (
                <div key={dateLabel}>
                  <div className="sticky top-0 z-10 px-4 py-2 bg-muted/50 backdrop-blur-sm border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{dateLabel}</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {dateTrades.map((trade, idx) => {
                      const getTradeKey = (t: Trade) => t._id || t.id || `${t.date}-${t.EntryTime || t.time || ''}-${t.Item || t.symbol || ''}-${t.Profit}`;
                      const tradeKey = getTradeKey(trade);
                      const selectedKey = selectedTrade ? getTradeKey(selectedTrade) : null;
                      const isSelected = tradeKey === selectedKey;
                      const isJournaled = Boolean(trade.jrData && (
                        trade.jrData.sentiment ||
                        trade.jrData.templateId ||
                        trade.jrData.tags?.length ||
                        Object.keys(trade.jrData.prompts || {}).some(k => trade.jrData?.prompts?.[k]?.trim())
                      ));
                      const isProfit = trade.Profit >= 0;
                      const entryPrice = trade.entryPrice ? parseFloat(String(trade.entryPrice)) : null;
                      const exitPrice = trade.exitPrice ? parseFloat(String(trade.exitPrice)) : null;

                      return (
                        <motion.button
                          key={tradeKey || `${trade.date}-${idx}`}
                          onClick={() => handleSelectTrade(trade)}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full p-4 text-left transition-all ${
                            isSelected
                              ? "bg-primary/5 border-l-2 border-l-primary"
                              : "hover:bg-muted/50 border-l-2 border-l-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Symbol Badge */}
                            <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold ${
                              isProfit ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                            }`}>
                              {(trade.Item || trade.symbol || "?").slice(0, 3)}
                            </div>

                            {/* Trade Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{trade.Item || trade.symbol}</span>
                                {isJournaled && (
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                )}
                                <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                  {trade.side || trade.Type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(trade.EntryTime || trade.time)}</span>
                                {entryPrice && exitPrice && (
                                  <>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span>${entryPrice.toFixed(2)} → ${exitPrice.toFixed(2)}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* P&L */}
                            <div className="text-right">
                              <span className={`text-lg font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
                                {isProfit ? "+" : ""}{formatCompactCurrency(trade.Profit, currency, exchangeRate)}
                              </span>
                              {trade.strategy && (
                                <p className="text-[10px] text-muted-foreground">{trade.strategy}</p>
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
        </div>

        {/* Center Panel - Journal Content */}
        <div className={`flex-1 min-w-0 overflow-y-auto ${mobileView === "content" ? "block" : "hidden md:block"}`}>
          {selectedTrade ? (
            <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
              {/* Trade Header Card */}
              <div className={`rounded-xl border p-6 ${
                selectedTrade.Profit >= 0 ? "bg-profit/5 border-profit/20" : "bg-loss/5 border-loss/20"
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                      selectedTrade.Profit >= 0 ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"
                    }`}>
                      {(selectedTrade.Item || selectedTrade.symbol || "?").slice(0, 3)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedTrade.Item || selectedTrade.symbol}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-medium">
                          {selectedTrade.side || selectedTrade.Type}
                        </span>
                        {selectedTrade.strategy && (
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-medium">
                            {selectedTrade.strategy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">P&L</p>
                    <span className={`text-3xl font-bold ${selectedTrade.Profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {selectedTrade.Profit >= 0 ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit, currency, exchangeRate)}
                    </span>
                  </div>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Entry Price</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${selectedTrade.entryPrice ? parseFloat(String(selectedTrade.entryPrice)).toFixed(2) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Exit Price</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${selectedTrade.exitPrice ? parseFloat(String(selectedTrade.exitPrice)).toFixed(2) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time</p>
                    <p className="text-lg font-semibold text-foreground">{formatTime(selectedTrade.EntryTime || selectedTrade.time) || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Screenshots - At Top for quick reference */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Trade Screenshots
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {["before", "after"].map((type) => (
                    <div key={type}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                        {type === "before" ? "Entry Setup" : "Exit Result"}
                      </p>
                      {selectedTrade[`${type}URL`] ? (
                        <div
                          className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group border border-border"
                          onClick={() => setLightboxImage(selectedTrade[`${type}URL`])}
                        >
                          <img
                            src={selectedTrade[`${type}URL`]}
                            alt={`${type} screenshot`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-sm font-medium">View</span>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50">
                          <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground font-medium">Upload</span>
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

              {/* Sentiment */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  How was this trade?
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "great", emoji: "🎯", label: "Great", color: "profit" },
                    { id: "okay", emoji: "😐", label: "Okay", color: "yellow" },
                    { id: "poor", emoji: "😔", label: "Poor", color: "loss" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSentimentChange(s.id as "great" | "okay" | "poor")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        journalData.sentiment === s.id
                          ? s.color === "profit" ? "border-profit bg-profit/10"
                            : s.color === "yellow" ? "border-yellow-500 bg-yellow-500/10"
                            : "border-loss bg-loss/10"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="text-3xl mb-2">{s.emoji}</div>
                      <div className={`text-sm font-medium ${
                        journalData.sentiment === s.id 
                          ? s.color === "profit" ? "text-profit" : s.color === "yellow" ? "text-yellow-600 dark:text-yellow-400" : "text-loss"
                          : "text-muted-foreground"
                      }`}>
                        {s.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selection */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Journal Template
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {templates.map((template, idx) => {
                    const Icon = getTemplateIcon(template.icon);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedTemplateIdx(idx)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-lg border transition-all ${
                          selectedTemplateIdx === idx
                            ? getTemplateColor(template.color)
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium whitespace-nowrap">{template.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Journal Prompts */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {templates[selectedTemplateIdx]?.name || "Notes"}
                </h3>
                <div className="space-y-4">
                  {templates[selectedTemplateIdx]?.prompts.map((prompt) => (
                    <div key={prompt.id}>
                      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        {prompt.label}
                      </label>
                      {prompt.type === "textarea" ? (
                        <textarea
                          value={journalData.prompts?.[prompt.id] || ""}
                          onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                          placeholder={prompt.placeholder}
                          rows={3}
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                        />
                      ) : (
                        <input
                          type="text"
                          value={journalData.prompts?.[prompt.id] || ""}
                          onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                          placeholder={prompt.placeholder}
                          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Tags
                </h3>
                
                {journalData.tags && journalData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {journalData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20"
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
                  {commonTags.filter(t => !journalData.tags?.includes(t)).slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Journal Entry
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Select a Trade</h3>
              <p className="text-muted-foreground text-center max-w-xs">Choose a trade from the list to start journaling your thoughts and analysis</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Analytics */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 320 }}
              exit={{ opacity: 0, width: 0 }}
              className="hidden lg:block flex-shrink-0 border-l border-border bg-card/50 overflow-hidden"
            >
              <div className="w-80 p-4 space-y-4 overflow-y-auto h-full">
                {/* Calendar */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Calendar
                    </h4>
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
                      <div key={i} className="h-9 flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                  
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-profit/30" />
                      <span className="text-[10px] text-muted-foreground">Profit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-loss/30" />
                      <span className="text-[10px] text-muted-foreground">Loss</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Performance
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Win Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">Win Rate</span>
                        <span className="text-sm font-bold text-foreground">{stats.winRate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.winRate}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Profit Factor</p>
                        <p className="text-lg font-bold text-foreground">{stats.profitFactor}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Trades</p>
                        <p className="text-lg font-bold text-foreground">{stats.totalTrades}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-profit/10 border border-profit/20">
                        <div className="flex items-center gap-1 mb-0.5">
                          <TrendingUp className="w-3 h-3 text-profit" />
                          <span className="text-[10px] text-profit uppercase tracking-wider">Avg Win</span>
                        </div>
                        <p className="text-base font-bold text-profit">{formatCompactCurrency(stats.avgWin, currency, exchangeRate)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-loss/10 border border-loss/20">
                        <div className="flex items-center gap-1 mb-0.5">
                          <TrendingDown className="w-3 h-3 text-loss" />
                          <span className="text-[10px] text-loss uppercase tracking-wider">Avg Loss</span>
                        </div>
                        <p className="text-base font-bold text-loss">{formatCompactCurrency(stats.avgLoss, currency, exchangeRate)}</p>
                      </div>
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
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          >
            <button className="absolute top-4 right-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
            <img src={lightboxImage} alt="Trade screenshot" className="max-w-full max-h-full rounded-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 z-50">
        <div className="flex gap-2">
          <button
            onClick={() => setMobileView("list")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              mobileView === "list" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            Trades
          </button>
          <button
            onClick={() => setMobileView("content")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              mobileView === "content" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            Journal
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyJournal;
