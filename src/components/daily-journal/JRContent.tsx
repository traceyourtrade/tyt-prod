"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import html2canvas from "html2canvas";
import Image from "next/image";
import { 
  ChevronDown, 
  Share2, 
  Upload, 
  FileText,
  Save,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Plus,
  Target,
  Search,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  ImageIcon
} from "lucide-react";

import useAccountDetails from "@/store/accountdetails";
import { useDataStore } from "@/store/store";
import notebookStore from "@/store/notebookStore";
import notifications from "@/store/notifications";
import { formatPnL } from "@/utils/formatNumber";

interface Trade {
  id: string;
  date: string;
  Profit: number;
  noteName?: string;
  Item: string;
  time: string;
  accountType: string;
  strategy: string;
  Quality: Record<string, boolean>;
  beforeURL?: string;
  afterURL?: string;
  OpenTime: string;
  Type: string;
  Size: string;
  Commission?: string;
  rfe: string;
  btm: string;
  dtm: string;
  atm: string;
  jrData?: any;
}

interface JRContentProps {
  dailyData: any[];
}

const JRContent = ({ dailyData }: JRContentProps) => {
  const userId = Cookies.get("userId") || "";
  const tokenn = Cookies.get("Trace Your Trades") || "";

  const { setAccounts, profileData } = useAccountDetails();
  const { setCurrentUrl } = useDataStore();
  const { setFolder, setFile, setNotes } = notebookStore();
  const { setAlertBoxG } = notifications();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [jrData, setJrData] = useState({ rfe: "", widw: "", wni: "", lfnt: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [strategySearch, setStrategySearch] = useState("");
  const [creatingStrategy, setCreatingStrategy] = useState(false);
  const [screenshotModal, setScreenshotModal] = useState<{
    isOpen: boolean;
    url: string;
    type: "before" | "after";
    tradeId: string;
    accountType: string;
    tradeName: string;
  } | null>(null);

  const itemsPerPage = 5;
  const totalPages = Math.ceil((dailyData?.length || 0) / itemsPerPage);
  const currentItems = dailyData?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  const existingStrategies: string[] = (profileData?.otherData?.strategy || []).filter((s: string) => s && s !== "Select");

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && screenshotModal) {
        closeScreenshotModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screenshotModal]);

  const updateTradeStrategy = async (tradeId: string, strategy: string, accountType: string) => {
    try {
      const res = await fetch(`/api/daily-journal/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: tradeId, 
          type: "strategy", 
          value: strategy, 
          tokenn, 
          accountType, 
          apiName: "editDropdowns" 
        }),
      });
      if (res.ok) {
        setActiveDropdown(null);
        setAccounts();
        setAlertBoxG(`Strategy set to "${strategy}"`, "success");
      }
    } catch (error) {
      console.error(error);
      setAlertBoxG("Failed to update strategy", "error");
    }
  };

  const createAndApplyStrategy = async (tradeId: string, strategyName: string, accountType: string) => {
    if (!strategyName.trim()) return;
    
    setCreatingStrategy(true);
    try {
      const res = await fetch(`/api/strategy/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          strategy: strategyName.trim(),
          tokenn,
          apiName: "addStrategy" 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await updateTradeStrategy(tradeId, strategyName.trim(), accountType);
        setStrategySearch("");
        setAlertBoxG(`Strategy "${strategyName}" created!`, "success");
      } else if (res.status === 409) {
        await updateTradeStrategy(tradeId, strategyName.trim(), accountType);
      } else {
        setAlertBoxG(data.error || "Failed to create strategy", "error");
      }
    } catch (error) {
      console.error(error);
      setAlertBoxG("Failed to create strategy", "error");
    } finally {
      setCreatingStrategy(false);
    }
  };

  const toggleExpand = (id: string, trade: Trade) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setJrData(trade.jrData || { rfe: "", widw: "", wni: "", lfnt: "" });
    }
    setActiveDropdown(null);
  };

  const compressAndUploadImage = (file: File, id: string, imgType: string, accountType: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
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

        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const formData = new FormData();
            formData.append("image", blob, file.name);
            formData.append("id", id);
            formData.append("imgType", imgType);
            formData.append("tokenn", tokenn);
            formData.append("accountType", accountType);
            formData.append("apiName", "uploadImage");

            fetch(`/api/daily-journal/post`, { method: "POST", body: formData })
              .then((response) => {
                if (response.ok) setAccounts();
              })
              .catch(console.error);
          });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (file: File, id: string, imgType: string, accountType: string) => {
    if (!file?.type.startsWith("image/")) return;
    compressAndUploadImage(file, id, imgType, accountType);
  };

  const deleteScreenshot = async (id: string, imgType: string, accountType: string) => {
    try {
      const res = await fetch(`/api/daily-journal/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          type: imgType, 
          value: "", 
          tokenn, 
          accountType, 
          apiName: "editDropdowns" 
        }),
      });
      if (res.ok) {
        setAccounts();
        setScreenshotModal(null);
        setAlertBoxG("Screenshot deleted", "success");
      }
    } catch (error) {
      console.error(error);
      setAlertBoxG("Failed to delete screenshot", "error");
    }
  };

  const openScreenshotModal = (url: string, type: "before" | "after", tradeId: string, accountType: string, tradeName: string) => {
    setScreenshotModal({ isOpen: true, url, type, tradeId, accountType, tradeName });
  };

  const closeScreenshotModal = () => {
    setScreenshotModal(null);
  };

  const postDropOptions = async (id: string, value: string, type: string, accountType: string) => {
    try {
      const res = await fetch(`/api/daily-journal/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, value, tokenn, accountType, apiName: "editDropdowns" }),
      });
      if (res.ok) {
        setActiveDropdown(null);
        setAccounts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const postSelect = async (id: string, option: string, accountType: string) => {
    try {
      const res = await fetch(`/api/daily-journal/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, option, tokenn, accountType, apiName: "changeSelectQuality" }),
      });
      if (res.ok) {
        setActiveDropdown(null);
        setAccounts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const submitJrData = async (id: string, accountType: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/daily-journal/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, tokenn, jrData, accountType, apiName: "uploadJournalData" }),
      });
      if (res.ok) {
        setExpandedId(null);
        setAccounts();
        setAlertBoxG("Journal saved!", "success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  const addNotes = async (tradeId: string, symbol: string, time: string, date: string, accountType: string) => {
    try {
      const res = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, tokenn, userId, symbol, time, date, accountType, apiName: "addNotesFromDailyJournal" }),
      });
      const data = await res.json();
      if (res.ok) {
        setAccounts();
        setNotes();
        setCurrentUrl("Notebook");
        setFolder("Daily Journal");
        setFile(data.data.finalFileName);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async (index: number) => {
    const element = document.getElementById(`trade-card-${index}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { backgroundColor: "#0a0a0a", useCORS: true, scale: 2 });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      const file = new File([blob], `trade-${index}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Trade ${index + 1}` });
      } else {
        setAlertBoxG("Sharing not supported on this device.", "error");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getQualityLabel = (quality: Record<string, boolean>) => {
    if (quality?.high) return { label: "High", icon: "star", style: "bg-profit/15 text-profit border-profit/20" };
    if (quality?.medium) return { label: "Medium", icon: "zap", style: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20" };
    if (quality?.low) return { label: "Low", icon: "down", style: "bg-loss/15 text-loss border-loss/20" };
    return { label: "Rate", icon: "none", style: "bg-muted/50 text-muted-foreground border-border" };
  };

  if (!dailyData?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-muted-foreground/60" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No trades yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
          Start adding trades to build your journal and track your progress
        </p>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20">
          Add Your First Trade
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {currentItems.map((trade, index) => {
        const isExpanded = expandedId === trade.id;
        const quality = getQualityLabel(trade.Quality);
        const isProfitable = trade.Profit >= 0;
        const formattedDate = new Date(trade.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        return (
          <motion.div
            key={trade.id || index}
            id={`trade-card-${index}`}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className={`group relative bg-card rounded-2xl overflow-hidden transition-all duration-300 ${
              isExpanded 
                ? 'ring-1 ring-primary/30 shadow-xl shadow-primary/5' 
                : 'border border-border/60 hover:border-border hover:shadow-lg hover:shadow-black/5'
            }`}
          >
            {/* Collapsed Card Header */}
            <div 
              className="px-5 py-4 cursor-pointer"
              onClick={() => toggleExpand(trade.id, trade)}
            >
              <div className="flex items-center justify-between">
                {/* Left: Symbol Stack */}
                <div className="flex items-center gap-4">
                  {/* P&L Indicator */}
                  <div className={`w-1 h-12 rounded-full ${isProfitable ? 'bg-profit' : 'bg-loss'}`} />
                  
                  <div>
                    {/* Symbol & Type */}
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-bold text-foreground tracking-tight">
                        {trade.Item}
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                        trade.Type?.toLowerCase() === 'buy' 
                          ? 'bg-profit/10 text-profit' 
                          : 'bg-loss/10 text-loss'
                      }`}>
                        {trade.Type}
                      </span>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Tags (Strategy & Quality) */}
                <div className="hidden md:flex items-center gap-2">
                  {/* Strategy Tag */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setActiveDropdown(activeDropdown === `strategy-${trade.id}` ? null : `strategy-${trade.id}`);
                        setStrategySearch("");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        trade.strategy && trade.strategy !== "Select"
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Target className="w-3 h-3" />
                      <span>{trade.strategy && trade.strategy !== "Select" ? trade.strategy : "Strategy"}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    <AnimatePresence>
                      {activeDropdown === `strategy-${trade.id}` && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 z-50 bg-card/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl shadow-black/30 w-56 overflow-hidden"
                        >
                          <div className="p-2.5 border-b border-border/50">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                              <input
                                type="text"
                                placeholder="Search or create..."
                                value={strategySearch}
                                onChange={(e) => setStrategySearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-44 overflow-y-auto py-1">
                            {existingStrategies
                              .filter((s: string) => s.toLowerCase().includes(strategySearch.toLowerCase()))
                              .map((strategy: string) => (
                                <button
                                  key={strategy}
                                  onClick={() => updateTradeStrategy(trade.id, strategy, trade.accountType)}
                                  className="w-full px-3 py-2 text-xs text-left hover:bg-muted/50 flex items-center justify-between transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <Target className="w-3 h-3 text-primary/70" />
                                    {strategy}
                                  </span>
                                  {trade.strategy === strategy && (
                                    <Check className="w-3.5 h-3.5 text-primary" />
                                  )}
                                </button>
                              ))}
                            {existingStrategies.filter((s: string) => 
                              s.toLowerCase().includes(strategySearch.toLowerCase())
                            ).length === 0 && strategySearch && (
                              <div className="px-3 py-2 text-[10px] text-muted-foreground/60">
                                No strategies found
                              </div>
                            )}
                          </div>
                          {strategySearch && !existingStrategies.some(
                            (s: string) => s.toLowerCase() === strategySearch.toLowerCase()
                          ) && (
                            <div className="p-2 border-t border-border/50">
                              <button
                                onClick={() => createAndApplyStrategy(trade.id, strategySearch, trade.accountType)}
                                disabled={creatingStrategy}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {creatingStrategy ? "Creating..." : `Create "${strategySearch}"`}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Quality Badge */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === `quality-${trade.id}` ? null : `quality-${trade.id}`)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${quality.style}`}
                    >
                      {quality.icon === "star" && <span>⭐</span>}
                      {quality.icon === "zap" && <Zap className="w-3 h-3" />}
                      {quality.icon === "down" && <TrendingDown className="w-3 h-3" />}
                      {quality.label}
                    </button>
                    <AnimatePresence>
                      {activeDropdown === `quality-${trade.id}` && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          className="absolute right-0 top-full mt-2 z-50 bg-card/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl shadow-black/30 p-1.5 min-w-[130px]"
                        >
                          {[
                            { value: "high", label: "High", icon: "⭐", style: "text-profit" },
                            { value: "medium", label: "Medium", icon: "⚡", style: "text-yellow-500" },
                            { value: "low", label: "Low", icon: "📉", style: "text-loss" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => postSelect(trade.id, opt.value, trade.accountType)}
                              className={`w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-muted/50 flex items-center gap-2 transition-colors ${opt.style}`}
                            >
                              <span>{opt.icon}</span>
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right: P&L & Expand */}
                <div className="flex items-center gap-3">
                  {/* P&L Chip */}
                  <div className={`px-4 py-2 rounded-xl font-bold text-lg tabular-nums ${
                    isProfitable 
                      ? 'bg-profit/10 text-profit' 
                      : 'bg-loss/10 text-loss'
                  }`}>
                    {formatPnL(trade.Profit || 0)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(index);
                      }}
                      className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(trade.id, trade);
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        isExpanded 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content - Modern Redesign */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">
                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-5" />

                    {/* Stats Row - Pill Style */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      {[
                        { label: "Size", value: trade.Size || '-' },
                        { label: "Time", value: trade.OpenTime?.split('T')[1]?.slice(0, 5) || trade.OpenTime || '-' },
                        { label: "Commission", value: trade.Commission ? `$${trade.Commission}` : '-' },
                        { label: "Account", value: trade.accountType || '-' },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{stat.label}</span>
                          <span className="text-xs font-semibold text-foreground tabular-nums">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left Column: Journal Notes (spans 7 cols) */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">Trade Journal</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { key: "rfe", label: "Setup & Entry", placeholder: "What setup did you see? Why did you enter?", icon: Target },
                            { key: "widw", label: "What Went Well", placeholder: "What did you execute correctly?", icon: TrendingUp },
                            { key: "wni", label: "Areas to Improve", placeholder: "What could be better next time?", icon: Zap },
                            { key: "lfnt", label: "Key Takeaway", placeholder: "Main lesson from this trade", icon: FileText },
                          ].map(({ key, label, placeholder, icon: Icon }) => (
                            <div key={key} className="group">
                              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 group-focus-within:text-primary transition-colors">
                                <Icon className="w-3 h-3" />
                                {label}
                              </label>
                              <textarea
                                value={jrData[key as keyof typeof jrData]}
                                onChange={(e) => setJrData({ ...jrData, [key]: e.target.value })}
                                placeholder={placeholder}
                                rows={3}
                                className="w-full px-3.5 py-3 bg-muted/20 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-muted/30 resize-none transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Column: Screenshots & Mindset (spans 5 cols) */}
                      <div className="lg:col-span-5 space-y-5">
                        
                        {/* Screenshots */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                              <ImageIcon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">Screenshots</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {["before", "after"].map((type) => (
                              <div key={type} className="relative">
                                <span className="absolute -top-2 left-2 z-10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-card text-muted-foreground rounded">
                                  {type === "before" ? "Entry" : "Exit"}
                                </span>
                                {trade[`${type}URL`] ? (
                                  <div 
                                    className="group relative aspect-video rounded-xl overflow-hidden bg-muted/30 border border-border/50 cursor-pointer hover:border-primary/30 transition-all"
                                    onClick={() => openScreenshotModal(
                                      trade[`${type}URL`], 
                                      type as "before" | "after", 
                                      trade.id, 
                                      trade.accountType,
                                      trade.Item
                                    )}
                                  >
                                    <Image
                                      src={trade[`${type}URL`]}
                                      alt={`${type} chart`}
                                      fill
                                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                      <span className="flex items-center gap-1.5 text-white text-xs font-medium">
                                        <Eye className="w-3.5 h-3.5" />
                                        View
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <label className="group flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border/40 bg-muted/10 cursor-pointer hover:bg-muted/20 hover:border-primary/30 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                                      <Upload className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                                      Add chart
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleFileSelect(e.target.files[0], trade.id, `${type}URL`, trade.accountType);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mindset Timeline */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Zap className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">Mindset</h4>
                          </div>
                          
                          {/* Horizontal Timeline */}
                          <div className="relative bg-muted/20 rounded-xl p-3 border border-border/30">
                            {/* Progress Line */}
                            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border/40 -translate-y-1/2" />
                            <div className="absolute top-1/2 left-8 w-1/3 h-0.5 bg-gradient-to-r from-primary/60 to-primary/20 -translate-y-1/2" />
                            
                            <div className="relative flex justify-between">
                              {[
                                { key: "btm", label: "Before", value: trade.btm },
                                { key: "dtm", label: "During", value: trade.dtm },
                                { key: "atm", label: "After", value: trade.atm },
                              ].map(({ key, label, value }, i) => (
                                <div key={key} className="relative flex flex-col items-center flex-1">
                                  <button
                                    onClick={() => setActiveDropdown(activeDropdown === `${key}-${trade.id}` ? null : `${key}-${trade.id}`)}
                                    className="relative z-10 w-10 h-10 rounded-full bg-card border-2 border-border/60 flex items-center justify-center hover:border-primary/50 transition-all group"
                                  >
                                    <span className="text-base group-hover:scale-110 transition-transform">
                                      {i === 0 ? '🧘' : i === 1 ? '⚡' : '🎯'}
                                    </span>
                                  </button>
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mt-2">{label}</span>
                                  <span className={`text-[11px] font-medium mt-0.5 ${value && value !== "Select" ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                                    {value && value !== "Select" ? value : "Select"}
                                  </span>
                                  
                                  <AnimatePresence>
                                    {activeDropdown === `${key}-${trade.id}` && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                        className="absolute top-full mt-2 z-50 bg-card/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl shadow-black/30 w-36 overflow-hidden"
                                      >
                                        <div className="max-h-40 overflow-y-auto py-1">
                                          {(profileData?.otherData?.[key] || []).filter((o: string) => o !== "Select").map((option: string) => (
                                            <button
                                              key={option}
                                              onClick={() => postDropOptions(trade.id, option, key, trade.accountType)}
                                              className="w-full px-3 py-2 text-xs text-left hover:bg-muted/50 flex items-center justify-between transition-colors"
                                            >
                                              {option}
                                              {value === option && <Check className="w-3 h-3 text-primary" />}
                                            </button>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action Bar - Glassmorphism */}
                    <div className="flex items-center justify-between gap-4 mt-6 pt-5 border-t border-border/30">
                      <div className="flex items-center">
                        {trade.noteName ? (
                          <button
                            onClick={() => {
                              setCurrentUrl("Notebook");
                              setFolder("Daily Journal");
                              setFile(trade.noteName!);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            View Full Notes
                          </button>
                        ) : (
                          <button
                            onClick={() => addNotes(trade.id, trade.Item, trade.time, trade.date, trade.accountType)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Add Detailed Notes
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={() => submitJrData(trade.id, trade.accountType)}
                        disabled={savingId === trade.id}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                      >
                        {savingId === trade.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Screenshot Modal */}
      <AnimatePresence>
        {screenshotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={closeScreenshotModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeScreenshotModal}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image Section */}
              <div className="flex-1 relative min-h-[300px] lg:min-h-[500px] bg-black/40">
                <Image
                  src={screenshotModal.url}
                  alt={`${screenshotModal.type} chart`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 70vw"
                />
              </div>

              {/* Action Panel */}
              <div className="w-full lg:w-72 p-6 bg-card border-t lg:border-t-0 lg:border-l border-border/50 flex flex-col">
                {/* Header */}
                <div className="mb-8">
                  <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-3 ${
                    screenshotModal.type === "before" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-profit/10 text-profit"
                  }`}>
                    {screenshotModal.type === "before" ? "Entry Chart" : "Exit Chart"}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">
                    {screenshotModal.tradeName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {screenshotModal.type === "before" 
                      ? "Screenshot before entering the trade" 
                      : "Screenshot after exiting the trade"}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3 mt-auto">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-muted/50 hover:bg-muted text-foreground rounded-xl text-sm font-semibold cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    Replace Screenshot
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileSelect(
                            e.target.files[0], 
                            screenshotModal.tradeId, 
                            `${screenshotModal.type}URL`, 
                            screenshotModal.accountType
                          );
                          closeScreenshotModal();
                        }
                      }}
                    />
                  </label>

                  <button
                    onClick={() => deleteScreenshot(
                      screenshotModal.tradeId, 
                      `${screenshotModal.type}URL`, 
                      screenshotModal.accountType
                    )}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-loss/10 hover:bg-loss/20 text-loss rounded-xl text-sm font-semibold transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Screenshot
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground/60 text-center mt-6">
                  Press <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-mono">ESC</kbd> to close
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JRContent;
