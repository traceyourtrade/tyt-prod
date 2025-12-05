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
  DollarSign,
  BarChart2,
  MessageSquare
} from "lucide-react";

import useAccountDetails from "@/store/accountdetails";
import { useDataStore } from "@/store/store";
import notebookStore from "@/store/notebookStore";
import notifications from "@/store/notifications";

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

  const itemsPerPage = 5;
  const totalPages = Math.ceil((dailyData?.length || 0) / itemsPerPage);
  const currentItems = dailyData?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);

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
    <div className="space-y-4">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 transition-colors"
          >
            {/* Card Header */}
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left: Symbol & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isProfitable ? 'bg-profit/10' : 'bg-loss/10'
                    }`}>
                      {isProfitable ? (
                        <TrendingUp className="w-5 h-5 text-profit" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-loss" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {trade.Item}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-1.5 py-0.5 bg-muted rounded font-medium uppercase">{trade.Type}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {trade.strategy && trade.strategy !== "Select" && (
                      <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/20">
                        {trade.strategy}
                      </span>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === `quality-${trade.id}` ? null : `quality-${trade.id}`)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${quality.style}`}
                      >
                        {quality.label}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === `quality-${trade.id}` && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-1 min-w-[100px]"
                          >
                            {[
                              { value: "high", label: "⭐ High" },
                              { value: "medium", label: "⚡ Medium" },
                              { value: "low", label: "📉 Low" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => postSelect(trade.id, opt.value, trade.accountType)}
                                className="w-full px-3 py-2 text-sm text-left rounded-md hover:bg-muted"
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
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isProfitable ? 'text-profit' : 'text-loss'}`}>
                      {isProfitable ? '+' : ''}{trade.Profit?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground">P&L</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShare(index)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => toggleExpand(trade.id, trade)}
                      className={`p-2 rounded-lg transition-colors ${
                        isExpanded ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
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
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-0 border-t border-border">
                    {/* Trade Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
                      {[
                        { label: "Size", value: trade.Size },
                        { label: "Open Time", value: trade.OpenTime },
                        { label: "Commission", value: trade.Commission },
                        { label: "Account", value: trade.accountType },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-3 rounded-lg bg-muted/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                          <p className="text-sm font-medium text-foreground truncate">{value || '-'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mood Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-t border-border">
                      {[
                        { key: "btm", label: "Before Trade", emoji: "🧘", value: trade.btm },
                        { key: "dtm", label: "During Trade", emoji: "⚡", value: trade.dtm },
                        { key: "atm", label: "After Trade", emoji: "🎯", value: trade.atm },
                      ].map(({ key, label, emoji, value }) => (
                        <div key={key} className="relative">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                            <span>{emoji}</span>
                            {label}
                          </p>
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === `${key}-${trade.id}` ? null : `${key}-${trade.id}`)}
                            className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                          >
                            <span className={value && value !== "Select" ? "text-foreground" : "text-muted-foreground"}>
                              {value && value !== "Select" ? value : "Select..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <AnimatePresence>
                            {activeDropdown === `${key}-${trade.id}` && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                              >
                                {(profileData?.otherData?.[key] || []).filter((o: string) => o !== "Select").map((option: string) => (
                                  <button
                                    key={option}
                                    onClick={() => postDropOptions(trade.id, option, key, trade.accountType)}
                                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-muted flex items-center justify-between"
                                  >
                                    {option}
                                    {value === option && <Check className="w-4 h-4 text-primary" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Images Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-t border-border">
                      {["before", "after"].map((type) => (
                        <div key={type}>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                            {type === "before" ? "📸" : "📊"}
                            <span className="capitalize">{type} Chart</span>
                          </p>
                          {trade[`${type}URL`] ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                              <Image
                                src={trade[`${type}URL`]}
                                alt={`${type} chart`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 hover:border-muted-foreground/30 transition-colors">
                              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                              <span className="text-xs text-muted-foreground">
                                Upload {type} chart
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

                    {/* Journal Notes */}
                    <div className="py-4 border-t border-border space-y-3">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        Journal Notes
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: "rfe", label: "Reason for Entry", placeholder: "Why did you enter?", emoji: "🎯" },
                          { key: "widw", label: "What I Did Well", placeholder: "What went right?", emoji: "✨" },
                          { key: "wni", label: "Needs Improvement", placeholder: "What could be better?", emoji: "🔧" },
                          { key: "lfnt", label: "Lessons Learned", placeholder: "Key takeaways", emoji: "📝" },
                        ].map(({ key, label, placeholder, emoji }) => (
                          <div key={key}>
                            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                              <span>{emoji}</span>
                              {label}
                            </label>
                            <input
                              type="text"
                              value={jrData[key as keyof typeof jrData]}
                              onChange={(e) => setJrData({ ...jrData, [key]: e.target.value })}
                              placeholder={placeholder}
                              className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t border-border">
                      {trade.noteName ? (
                        <button
                          onClick={() => {
                            setCurrentUrl("Notebook");
                            setFolder("Daily Journal");
                            setFile(trade.noteName!);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          View Notes
                        </button>
                      ) : (
                        <button
                          onClick={() => addNotes(trade.id, trade.Item, trade.time, trade.date, trade.accountType)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Add Notes
                        </button>
                      )}
                      <button
                        onClick={() => submitJrData(trade.id, trade.accountType)}
                        disabled={savingId === trade.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {savingId === trade.id ? "Saving..." : "Save Journal"}
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
    </div>
  );
};

export default JRContent;
