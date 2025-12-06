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
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  Sparkles,
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
    case "blue": return "text-blue-400 bg-blue-500/20 border-blue-500/30";
    case "yellow": return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    case "green": return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
    case "pink": return "text-pink-400 bg-pink-500/20 border-pink-500/30";
    case "purple": return "text-purple-400 bg-purple-500/20 border-purple-500/30";
    default: return "text-primary bg-primary/20 border-primary/30";
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
    
    // Calculate streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let tempStreak = 0;
    const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const trade of sortedTrades) {
      if (trade.Profit > 0) {
        tempStreak++;
        maxWinStreak = Math.max(maxWinStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    // Current streak
    for (const trade of sortedTrades) {
      if (trade.Profit > 0) currentStreak++;
      else break;
    }
    
    return { winners, losers, totalPnL, winRate, profitFactor, avgWin, avgLoss, totalTrades: trades.length, currentStreak, maxWinStreak };
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

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="h-8" />);

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const pnl = calendarData[dateStr] || 0;
      const isToday = new Date(selectedYear, selectedMonth, day).toDateString() === today.toDateString();

      let cellClass = "bg-transparent text-muted-foreground/60 hover:bg-white/5";
      if (pnl > 1000) cellClass = "bg-gradient-to-br from-profit to-profit/70 text-white shadow-lg shadow-profit/25";
      else if (pnl > 0) cellClass = "bg-profit/30 text-profit";
      else if (pnl < -1000) cellClass = "bg-gradient-to-br from-loss to-loss/70 text-white shadow-lg shadow-loss/25";
      else if (pnl < 0) cellClass = "bg-loss/30 text-loss";

      cells.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.1 }}
          className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer transition-all ${cellClass} ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-[#0D0F12]" : ""}`}
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

  // Calculate max P&L for bar scaling
  const maxAbsPnL = useMemo(() => {
    return Math.max(...trades.map(t => Math.abs(t.Profit)), 1);
  }, [trades]);

  return (
    <div className="min-h-screen bg-[#0A0B0E]">
      {/* Premium Header - Command Center */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0B0E]/80 border-b border-white/5">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6">
          {/* Top Bar */}
          <div className="h-16 flex items-center justify-between">
            {/* Left - Branding */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/50 flex items-center justify-center shadow-lg shadow-primary/25">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Trading Journal</h1>
                  <p className="text-xs text-white/40">Command Center</p>
                </div>
              </div>
            </div>

            {/* Right - Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors hidden md:flex"
              >
                {isSidebarOpen ? <PanelRightClose className="w-5 h-5 text-white/60" /> : <PanelRight className="w-5 h-5 text-white/60" />}
              </button>
            </div>
          </div>

          {/* Stats Strip - Premium Metrics Bar */}
          <div className="py-4 flex items-center gap-4 overflow-x-auto scrollbar-none">
            {/* Total P&L - Hero Stat */}
            <div className="flex-shrink-0 relative">
              <div className={`px-6 py-4 rounded-2xl ${stats.totalPnL >= 0 ? "bg-gradient-to-br from-profit/20 via-profit/10 to-transparent border border-profit/20" : "bg-gradient-to-br from-loss/20 via-loss/10 to-transparent border border-loss/20"}`}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/[0.03] to-transparent" />
                <div className="relative">
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-1">Total P&L</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black tracking-tight ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatCompactCurrency(stats.totalPnL, currency, exchangeRate)}
                    </span>
                    {stats.totalPnL >= 0 ? (
                      <ArrowUpRight className="w-6 h-6 text-profit" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6 text-loss" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Win Rate */}
              <div className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-0.5">Win Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">{stats.winRate}%</span>
                  <div className="flex-1 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.winRate}%` }}
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Win/Loss Count */}
              <div className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-0.5">Record</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-profit">{stats.winners}</span>
                  <span className="text-white/20">/</span>
                  <span className="text-xl font-bold text-loss">{stats.losers}</span>
                </div>
              </div>

              {/* Profit Factor */}
              <div className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-0.5">Profit Factor</p>
                <span className="text-xl font-bold text-white">{stats.profitFactor}</span>
              </div>

              {/* Streak */}
              <div className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-0.5">Streak</p>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xl font-bold text-white">{stats.currentStreak}</span>
                </div>
              </div>

              {/* Avg Win */}
              <div className="px-5 py-3 rounded-xl bg-profit/5 border border-profit/10">
                <p className="text-[10px] font-medium text-profit/60 uppercase tracking-wider mb-0.5">Avg Win</p>
                <span className="text-lg font-bold text-profit">{formatCompactCurrency(stats.avgWin, currency, exchangeRate)}</span>
              </div>

              {/* Avg Loss */}
              <div className="px-5 py-3 rounded-xl bg-loss/5 border border-loss/10">
                <p className="text-[10px] font-medium text-loss/60 uppercase tracking-wider mb-0.5">Avg Loss</p>
                <span className="text-lg font-bold text-loss">{formatCompactCurrency(stats.avgLoss, currency, exchangeRate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-6">
        <div className="flex gap-6">
          {/* Left Panel - Trade List with P&L Bars */}
          <div className={`${mobileView === "list" || window.innerWidth >= 768 ? "flex" : "hidden"} w-full md:w-[380px] flex-col flex-shrink-0`}>
            {/* Search & Filter */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search symbols..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                />
              </div>
              
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                {["all", "winners", "losers"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as typeof filter)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      filter === f
                        ? f === "winners" ? "bg-profit/20 text-profit border border-profit/30" 
                          : f === "losers" ? "bg-loss/20 text-loss border border-loss/30"
                          : "bg-white/10 text-white border border-white/20"
                        : "bg-white/[0.03] text-white/50 border border-white/5 hover:bg-white/[0.06]"
                    }`}
                  >
                    {f === "all" ? "All Trades" : f === "winners" ? `Winners (${stats.winners})` : `Losers (${stats.losers})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Trade List with Visual P&L Bars */}
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-sleek pr-2">
              {Object.keys(groupedTrades).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 font-medium">No trades found</p>
                </div>
              ) : (
                Object.entries(groupedTrades).map(([dateLabel, dateTrades]) => (
                  <div key={dateLabel}>
                    <div className="sticky top-0 z-10 py-2 px-1">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{dateLabel}</span>
                    </div>
                    <div className="space-y-1.5">
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
                        const pnlBarWidth = Math.min((Math.abs(trade.Profit) / maxAbsPnL) * 100, 100);
                        const entryPrice = trade.entryPrice ? parseFloat(String(trade.entryPrice)) : null;
                        const exitPrice = trade.exitPrice ? parseFloat(String(trade.exitPrice)) : null;

                        return (
                          <motion.button
                            key={tradeKey || `${trade.date}-${idx}`}
                            onClick={() => handleSelectTrade(trade)}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.99 }}
                            className={`group relative w-full overflow-hidden rounded-xl transition-all ${
                              isSelected
                                ? "bg-white/[0.08] ring-1 ring-white/20"
                                : "bg-white/[0.02] hover:bg-white/[0.05] border border-white/5"
                            }`}
                          >
                            {/* P&L Background Bar */}
                            <div
                              className={`absolute inset-y-0 left-0 transition-all ${isProfit ? "bg-profit/10" : "bg-loss/10"}`}
                              style={{ width: `${pnlBarWidth}%` }}
                            />
                            
                            <div className="relative flex items-center p-3 gap-3">
                              {/* Symbol Badge */}
                              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                                isProfit 
                                  ? "bg-gradient-to-br from-profit/30 to-profit/10 border border-profit/20" 
                                  : "bg-gradient-to-br from-loss/30 to-loss/10 border border-loss/20"
                              }`}>
                                <span className={`text-sm font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
                                  {(trade.Item || trade.symbol || "?").slice(0, 3)}
                                </span>
                                <span className="text-[8px] text-white/40 font-medium">{trade.side || trade.Type}</span>
                              </div>

                              {/* Trade Info */}
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-white">{trade.Item || trade.symbol}</span>
                                  {isJournaled && (
                                    <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                                      <CheckCircle2 className="w-3 h-3 text-primary" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Entry/Exit with Mini Chart */}
                                <div className="flex items-center gap-2">
                                  {entryPrice && exitPrice ? (
                                    <>
                                      <span className="text-xs text-white/50 font-medium">${entryPrice.toFixed(2)}</span>
                                      <svg width="24" height="12" className="shrink-0">
                                        <path
                                          d={isProfit ? "M2 10 L12 2 L22 10" : "M2 2 L12 10 L22 2"}
                                          stroke={isProfit ? "#4EBF94" : "#EF4444"}
                                          strokeWidth="2"
                                          fill="none"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                      <span className="text-xs text-white/50 font-medium">${exitPrice.toFixed(2)}</span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-white/30">{formatTime(trade.EntryTime || trade.time)}</span>
                                  )}
                                </div>
                              </div>

                              {/* P&L */}
                              <div className="text-right">
                                <span className={`text-lg font-black ${isProfit ? "text-profit" : "text-loss"}`}>
                                  {isProfit ? "+" : ""}{formatCompactCurrency(trade.Profit, currency, exchangeRate)}
                                </span>
                                {trade.strategy && (
                                  <p className="text-[10px] text-white/30 font-medium">{trade.strategy}</p>
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
          <div className={`flex-1 min-w-0 ${mobileView === "content" || window.innerWidth >= 768 ? "block" : "hidden"}`}>
            {selectedTrade ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Trade Header Card */}
                <div className={`relative overflow-hidden rounded-2xl p-6 ${
                  selectedTrade.Profit >= 0 
                    ? "bg-gradient-to-br from-profit/20 via-profit/5 to-transparent border border-profit/20" 
                    : "bg-gradient-to-br from-loss/20 via-loss/5 to-transparent border border-loss/20"
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent" />
                  
                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl ${
                          selectedTrade.Profit >= 0 
                            ? "bg-profit/30 text-profit border border-profit/30" 
                            : "bg-loss/30 text-loss border border-loss/30"
                        }`}>
                          {(selectedTrade.Item || selectedTrade.symbol || "?").slice(0, 3)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">{selectedTrade.Item || selectedTrade.symbol}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white/60 text-xs font-medium">
                              {selectedTrade.side || selectedTrade.Type}
                            </span>
                            {selectedTrade.strategy && (
                              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white/60 text-xs font-medium">
                                {selectedTrade.strategy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price Details */}
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-1">Entry Price</p>
                          <p className="text-lg font-bold text-white">
                            ${selectedTrade.entryPrice ? parseFloat(String(selectedTrade.entryPrice)).toFixed(2) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-1">Exit Price</p>
                          <p className="text-lg font-bold text-white">
                            ${selectedTrade.exitPrice ? parseFloat(String(selectedTrade.exitPrice)).toFixed(2) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-1">Time</p>
                          <p className="text-lg font-bold text-white">{formatTime(selectedTrade.EntryTime || selectedTrade.time) || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* P&L Display */}
                    <div className="text-right">
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-1">P&L</p>
                      <span className={`text-4xl font-black tracking-tight ${selectedTrade.Profit >= 0 ? "text-profit" : "text-loss"}`}>
                        {selectedTrade.Profit >= 0 ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit, currency, exchangeRate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sentiment Selection */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
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
                        className={`relative p-4 rounded-xl transition-all ${
                          journalData.sentiment === s.id
                            ? s.color === "profit" ? "bg-profit/20 border-2 border-profit ring-4 ring-profit/20"
                              : s.color === "yellow" ? "bg-yellow-500/20 border-2 border-yellow-500 ring-4 ring-yellow-500/20"
                              : "bg-loss/20 border-2 border-loss ring-4 ring-loss/20"
                            : "bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                        }`}
                      >
                        <div className="text-3xl mb-2">{s.emoji}</div>
                        <div className={`text-sm font-semibold ${
                          journalData.sentiment === s.id 
                            ? s.color === "profit" ? "text-profit" : s.color === "yellow" ? "text-yellow-400" : "text-loss"
                            : "text-white/60"
                        }`}>
                          {s.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Selection */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    Journal Template
                  </h3>
                  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
                    {templates.map((template, idx) => {
                      const Icon = getTemplateIcon(template.icon);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedTemplateIdx(idx)}
                          className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                            selectedTemplateIdx === idx
                              ? getTemplateColor(template.color) + " ring-1 ring-current"
                              : "bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white/60"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-semibold whitespace-nowrap">{template.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Journal Prompts */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {templates[selectedTemplateIdx]?.name || "Notes"}
                  </h3>
                  <div className="space-y-4">
                    {templates[selectedTemplateIdx]?.prompts.map((prompt) => (
                      <div key={prompt.id} className="group">
                        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                          {prompt.label}
                        </label>
                        {prompt.type === "textarea" ? (
                          <textarea
                            value={journalData.prompts?.[prompt.id] || ""}
                            onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                            placeholder={prompt.placeholder}
                            rows={3}
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-primary/10 resize-none transition-all"
                          />
                        ) : (
                          <input
                            type="text"
                            value={journalData.prompts?.[prompt.id] || ""}
                            onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                            placeholder={prompt.placeholder}
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-primary/10 transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Tags
                  </h3>
                  
                  {/* Selected Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {journalData.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm font-medium border border-primary/30"
                      >
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Common Tags */}
                  <div className="flex flex-wrap gap-2">
                    {commonTags.filter(t => !journalData.tags?.includes(t)).slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-xs font-medium transition-colors border border-white/5"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screenshots */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Trade Screenshots
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["before", "after"].map((type) => (
                      <div key={type}>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-2">
                          {type === "before" ? "Entry Setup" : "Exit Result"}
                        </p>
                        {selectedTrade[`${type}URL`] ? (
                          <div
                            className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group"
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
                          <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-primary/40 cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]">
                            <Upload className="w-6 h-6 text-white/30 mb-2" />
                            <span className="text-xs text-white/30 font-medium">Upload</span>
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

                {/* Save Button */}
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Journal Entry
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              /* Empty State */
              <div className="h-full flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
                  <BookOpen className="w-12 h-12 text-primary/60" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Select a Trade</h3>
                <p className="text-white/40 text-center max-w-xs">Choose a trade from the list to start journaling your thoughts and analysis</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Analytics */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="hidden lg:block w-[320px] flex-shrink-0 space-y-4"
              >
                {/* Calendar Card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Performance Calendar
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedMonth((m) => (m === 0 ? (setSelectedYear((y) => y - 1), 11) : m - 1))}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white/60" />
                      </button>
                      <span className="text-xs font-bold text-white px-2 min-w-[80px] text-center">
                        {new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short", year: "numeric" })}
                      </span>
                      <button
                        onClick={() => setSelectedMonth((m) => (m === 11 ? (setSelectedYear((y) => y + 1), 0) : m + 1))}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="h-8 flex items-center justify-center text-[10px] font-bold text-white/30 uppercase">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-profit" />
                      <span className="text-[10px] text-white/40">Profit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-loss" />
                      <span className="text-[10px] text-white/40">Loss</span>
                    </div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Performance Breakdown
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Best Trade */}
                    <div className="p-3 rounded-xl bg-profit/5 border border-profit/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-profit" />
                        <span className="text-[10px] text-profit/60 uppercase tracking-wider font-bold">Best Trade</span>
                      </div>
                      <span className="text-xl font-black text-profit">
                        +{formatCompactCurrency(Math.max(...trades.map(t => t.Profit), 0), currency, exchangeRate)}
                      </span>
                    </div>

                    {/* Worst Trade */}
                    <div className="p-3 rounded-xl bg-loss/5 border border-loss/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-loss" />
                        <span className="text-[10px] text-loss/60 uppercase tracking-wider font-bold">Worst Trade</span>
                      </div>
                      <span className="text-xl font-black text-loss">
                        {formatCompactCurrency(Math.min(...trades.map(t => t.Profit), 0), currency, exchangeRate)}
                      </span>
                    </div>

                    {/* Total Trades */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-white/40" />
                        <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Total Trades</span>
                      </div>
                      <span className="text-xl font-black text-white">{stats.totalTrades}</span>
                    </div>

                    {/* Max Streak */}
                    <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] text-orange-500/60 uppercase tracking-wider font-bold">Best Streak</span>
                      </div>
                      <span className="text-xl font-black text-orange-400">{stats.maxWinStreak} wins</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0B0E]/95 backdrop-blur-xl border-t border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileView("list")}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              mobileView === "list" 
                ? "bg-primary text-white" 
                : "bg-white/5 text-white/50"
            }`}
          >
            Trades
          </button>
          <button
            onClick={() => setMobileView("content")}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              mobileView === "content" 
                ? "bg-primary text-white" 
                : "bg-white/5 text-white/50"
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
