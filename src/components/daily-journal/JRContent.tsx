"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import html2canvas from "html2canvas";
import Image from "next/image";
import { 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Save,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  BarChart2,
  MessageSquare,
  Plus,
  Target,
  Search,
  Trash2,
  X
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
        setAlertBoxG(`Strategy "${strategyName}" created! 🎯`, "success");
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
        setAlertBoxG("Journal saved! 🎉", "success");
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
      const canvas = await html2canvas(element, { backgroundColor: "#1e1e1e", useCORS: true, scale: 2 });
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
    if (quality?.high) return { label: "⭐ High", style: "bg-profit/10 text-profit border-profit/20" };
    if (quality?.medium) return { label: "⚡ Medium", style: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20" };
    if (quality?.low) return { label: "📉 Low", style: "bg-loss/10 text-loss border-loss/20" };
    return { label: "Rate", style: "bg-muted text-muted-foreground border-border" };
  };

  if (!dailyData?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No trades yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
          Start adding trades to build your journal and track your progress
        </p>
        <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
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
            className={`group relative bg-card rounded-xl overflow-hidden transition-all duration-200 ${
              isExpanded 
                ? 'ring-1 ring-primary/20 shadow-lg shadow-primary/5' 
                : 'border border-border hover:border-primary/20 hover:shadow-md hover:shadow-black/5'
            }`}
          >
            {/* Profit/Loss Indicator Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isProfitable ? 'bg-profit' : 'bg-loss'}`} />
            
            {/* Card Header - Clean Modern Layout */}
            <div className="pl-5 pr-4 py-4">
              <div className="flex items-center justify-between">
                {/* Left: Symbol & Meta */}
                <div className="flex-1 min-w-0">
                  {/* Top Row: Symbol & Type */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight">
                      {trade.Item}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${
                      trade.Type?.toLowerCase() === 'buy' 
                        ? 'bg-profit/10 text-profit' 
                        : 'bg-loss/10 text-loss'
                    }`}>
                      {trade.Type}
                    </span>
                  </div>
                  
                  {/* Bottom Row: Date, Strategy, Quality */}
                  <div className="flex items-center gap-4 mt-2">
                    {/* Date */}
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                    
                    {/* Strategy Tag */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setActiveDropdown(activeDropdown === `strategy-${trade.id}` ? null : `strategy-${trade.id}`);
                          setStrategySearch("");
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-lg transition-all ${
                          trade.strategy && trade.strategy !== "Select"
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>{trade.strategy && trade.strategy !== "Select" ? trade.strategy : "Strategy"}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === `strategy-${trade.id}` && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-xl shadow-black/20 w-64 overflow-hidden"
                          >
                            <div className="p-2 border-b border-border">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                  type="text"
                                  placeholder="Search or create..."
                                  value={strategySearch}
                                  onChange={(e) => setStrategySearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto py-1">
                              {existingStrategies
                                .filter((s: string) => s.toLowerCase().includes(strategySearch.toLowerCase()))
                                .map((strategy: string) => (
                                  <button
                                    key={strategy}
                                    onClick={() => updateTradeStrategy(trade.id, strategy, trade.accountType)}
                                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center justify-between"
                                  >
                                    <span className="flex items-center gap-2">
                                      <Target className="w-3.5 h-3.5 text-primary" />
                                      {strategy}
                                    </span>
                                    {trade.strategy === strategy && (
                                      <Check className="w-4 h-4 text-primary" />
                                    )}
                                  </button>
                                ))}
                              {existingStrategies.filter((s: string) => 
                                s.toLowerCase().includes(strategySearch.toLowerCase())
                              ).length === 0 && strategySearch && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                  No strategies found
                                </div>
                              )}
                            </div>
                            {strategySearch && !existingStrategies.some(
                              (s: string) => s.toLowerCase() === strategySearch.toLowerCase()
                            ) && (
                              <div className="p-2 border-t border-border">
                                <button
                                  onClick={() => createAndApplyStrategy(trade.id, strategySearch, trade.accountType)}
                                  disabled={creatingStrategy}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4" />
                                  {creatingStrategy ? "Creating..." : `Create "${strategySearch}"`}
                                </button>
                              </div>
                            )}
                            {!strategySearch && existingStrategies.length === 0 && (
                              <div className="p-3 text-center text-xs text-muted-foreground">
                                Type to create your first strategy
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Quality Badge */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === `quality-${trade.id}` ? null : `quality-${trade.id}`)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg transition-all ${quality.style.split(' ').filter(c => !c.startsWith('border')).join(' ')}`}
                      >
                        {quality.label}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === `quality-${trade.id}` && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-xl shadow-black/20 p-1 min-w-[120px]"
                          >
                            {[
                              { value: "high", label: "⭐ High", style: "text-profit" },
                              { value: "medium", label: "⚡ Medium", style: "text-yellow-500" },
                              { value: "low", label: "📉 Low", style: "text-loss" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => postSelect(trade.id, opt.value, trade.accountType)}
                                className={`w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-muted flex items-center gap-2 ${opt.style}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Right: P&L & Actions */}
                <div className="flex items-center gap-3">
                  {/* P&L Display with Background */}
                  <div className={`px-4 py-2 rounded-xl ${isProfitable ? 'bg-profit/10' : 'bg-loss/10'}`}>
                    <p className={`text-xl font-bold tabular-nums ${isProfitable ? 'text-profit' : 'text-loss'}`}>
                      {formatPnL(trade.Profit || 0)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center">
                    <button
                      onClick={() => handleShare(index)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(trade.id, trade)}
                      className={`p-2 rounded-lg transition-all ${
                        isExpanded 
                          ? 'bg-primary text-primary-foreground rotate-180' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mx-4 mb-4 p-5 bg-muted/20 rounded-xl border border-border/50">
                    {/* Trade Stats Bar - Clean Linear/Notion Style */}
                    <div className="flex items-center gap-6 pb-4 mb-5 border-b border-border/30">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Size</span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">{trade.Size || '-'}</span>
                      </div>
                      <span className="w-px h-3.5 bg-border/60" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Time</span>
                        <span className="text-xs font-semibold text-foreground">{trade.OpenTime || '-'}</span>
                      </div>
                      <span className="w-px h-3.5 bg-border/60" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Commission</span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">{trade.Commission ? `$${trade.Commission}` : '-'}</span>
                      </div>
                      <span className="w-px h-3.5 bg-border/60" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Account</span>
                        <span className="text-xs font-semibold text-foreground">{trade.accountType || '-'}</span>
                      </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column: Charts & Mood */}
                      <div className="space-y-4">
                        {/* Charts Section */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[10px]">📷</span>
                            Trade Screenshots
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {["before", "after"].map((type) => (
                              <div key={type}>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                                  {type === "before" ? "Entry" : "Exit"}
                                </p>
                                {trade[`${type}URL`] ? (
                                  <div 
                                    className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-muted border border-border cursor-pointer"
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
                                      className="object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                      <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-full">
                                        Click to view
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <label className="group flex flex-col items-center justify-center aspect-[4/3] rounded-lg border-2 border-dashed border-border/60 bg-muted/30 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                                      <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                                      Add {type} chart
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

                        {/* Mood Tracking */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[10px]">🧠</span>
                            Mindset Tracker
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: "btm", label: "Before", emoji: "🧘", value: trade.btm },
                              { key: "dtm", label: "During", emoji: "⚡", value: trade.dtm },
                              { key: "atm", label: "After", emoji: "🎯", value: trade.atm },
                            ].map(({ key, label, emoji, value }) => (
                              <div key={key} className="relative">
                                <button
                                  onClick={() => setActiveDropdown(activeDropdown === `${key}-${trade.id}` ? null : `${key}-${trade.id}`)}
                                  className="w-full p-2 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors text-center"
                                >
                                  <span className="text-lg">{emoji}</span>
                                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
                                  <p className={`text-xs font-medium mt-1 truncate ${value && value !== "Select" ? "text-foreground" : "text-muted-foreground"}`}>
                                    {value && value !== "Select" ? value : "Select"}
                                  </p>
                                </button>
                                <AnimatePresence>
                                  {activeDropdown === `${key}-${trade.id}` && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl shadow-black/20 max-h-48 overflow-y-auto"
                                    >
                                      {(profileData?.otherData?.[key] || []).filter((o: string) => o !== "Select").map((option: string) => (
                                        <button
                                          key={option}
                                          onClick={() => postDropOptions(trade.id, option, key, trade.accountType)}
                                          className="w-full px-3 py-2 text-xs text-left hover:bg-muted flex items-center justify-between"
                                        >
                                          {option}
                                          {value === option && <Check className="w-3 h-3 text-primary" />}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Journal */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[10px]">📝</span>
                          Trade Journal
                        </h4>
                        <div className="space-y-3">
                          {[
                            { key: "rfe", label: "Reason for Entry", placeholder: "What setup did you see?", emoji: "🎯" },
                            { key: "widw", label: "What Went Well", placeholder: "What did you do right?", emoji: "✨" },
                            { key: "wni", label: "To Improve", placeholder: "What could be better?", emoji: "🔧" },
                            { key: "lfnt", label: "Key Lesson", placeholder: "Main takeaway from this trade", emoji: "📚" },
                          ].map(({ key, label, placeholder, emoji }) => (
                            <div key={key} className="group">
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 group-focus-within:text-primary transition-colors">
                                <span>{emoji}</span>
                                <span>{label}</span>
                              </label>
                              <textarea
                                value={jrData[key as keyof typeof jrData]}
                                onChange={(e) => setJrData({ ...jrData, [key]: e.target.value })}
                                placeholder={placeholder}
                                rows={2}
                                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        {trade.noteName ? (
                          <button
                            onClick={() => {
                              setCurrentUrl("Notebook");
                              setFolder("Daily Journal");
                              setFile(trade.noteName!);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            View Full Notes
                          </button>
                        ) : (
                          <button
                            onClick={() => addNotes(trade.id, trade.Item, trade.time, trade.date, trade.accountType)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Detailed Notes
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => submitJrData(trade.id, trade.accountType)}
                        disabled={savingId === trade.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                        {savingId === trade.id ? "Saving..." : "Save Changes"}
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
        <div className="flex items-center justify-center gap-1 pt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={closeScreenshotModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeScreenshotModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image Section */}
              <div className="flex-1 relative min-h-[300px] lg:min-h-[500px] bg-black/20">
                <Image
                  src={screenshotModal.url}
                  alt={`${screenshotModal.type} chart`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 70vw"
                />
              </div>

              {/* Action Panel */}
              <div className="w-full lg:w-72 p-6 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${
                      screenshotModal.type === "before" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-profit/10 text-profit"
                    }`}>
                      {screenshotModal.type === "before" ? "Entry Chart" : "Exit Chart"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {screenshotModal.tradeName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {screenshotModal.type === "before" 
                      ? "Screenshot taken before entering the trade" 
                      : "Screenshot taken after exiting the trade"}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3 mt-auto">
                  {/* Replace Button */}
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-medium cursor-pointer transition-colors">
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

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteScreenshot(
                      screenshotModal.tradeId, 
                      `${screenshotModal.type}URL`, 
                      screenshotModal.accountType
                    )}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-loss/10 hover:bg-loss/20 text-loss rounded-xl text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Screenshot
                  </button>
                </div>

                {/* Keyboard Hint */}
                <p className="text-[10px] text-muted-foreground text-center mt-4">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">ESC</kbd> to close
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
