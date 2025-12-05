"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
  Sparkles,
  Zap,
  Star,
  Award,
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
  onCelebrate?: () => void;
}

const TiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const ConfettiPiece = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-sm"
    style={{
      background: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
      left: `${Math.random() * 100}%`,
    }}
    initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
    animate={{
      y: 200,
      opacity: 0,
      rotate: Math.random() * 720 - 360,
      scale: 0,
    }}
    transition={{ duration: 1.5, delay, ease: "easeOut" }}
  />
);

const JRContent = ({ dailyData, onCelebrate }: JRContentProps) => {
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
  const [showConfetti, setShowConfetti] = useState<string | null>(null);
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
        setShowConfetti(id);
        setTimeout(() => setShowConfetti(null), 2000);
        setExpandedId(null);
        setAccounts();
        setAlertBoxG("Journal saved! 🎉", "success");
        onCelebrate?.();
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

  const getQualityConfig = (quality: Record<string, boolean>) => {
    if (quality?.high) return { label: "High", color: "from-profit to-emerald-400", bg: "bg-profit/20", border: "border-profit/30", icon: Star };
    if (quality?.medium) return { label: "Medium", color: "from-yellow-500 to-orange-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", icon: Zap };
    if (quality?.low) return { label: "Low", color: "from-loss to-red-400", bg: "bg-loss/20", border: "border-loss/30", icon: BarChart2 };
    return { label: "Rate", color: "from-muted to-muted", bg: "bg-muted", border: "border-border", icon: Star };
  };

  if (!dailyData?.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6"
        >
          <FileText className="w-10 h-10 text-primary" />
        </motion.div>
        <h3 className="text-xl font-bold text-foreground mb-2">No trades yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
          Start adding trades to build your journal and track your progress
        </p>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-6 py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl font-medium text-sm"
        >
          Add Your First Trade
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {currentItems.map((trade, index) => {
        const isExpanded = expandedId === trade.id;
        const quality = getQualityConfig(trade.Quality);
        const QualityIcon = quality.icon;
        const isProfitable = trade.Profit >= 0;
        const formattedDate = new Date(trade.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        return (
          <TiltCard key={trade.id || index} className="perspective-1000">
            <motion.div
              id={`trade-card-${index}`}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
              className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                isProfitable 
                  ? 'bg-gradient-to-br from-card via-card to-profit/5 border-profit/20 hover:border-profit/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
                  : 'bg-gradient-to-br from-card via-card to-loss/5 border-loss/20 hover:border-loss/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]'
              }`}
            >
              {/* Confetti Effect */}
              <AnimatePresence>
                {showConfetti === trade.id && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <ConfettiPiece key={i} delay={i * 0.05} />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Glow Effect */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${
                isProfitable ? 'bg-profit' : 'bg-loss'
              }`} />

              {/* Card Header */}
              <div className="relative p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: Symbol & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isProfitable 
                            ? 'bg-gradient-to-br from-profit/20 to-emerald-500/20 shadow-lg shadow-profit/10' 
                            : 'bg-gradient-to-br from-loss/20 to-red-500/20 shadow-lg shadow-loss/10'
                        }`}
                      >
                        {isProfitable ? (
                          <TrendingUp className="w-6 h-6 text-profit" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-loss" />
                        )}
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg sm:text-xl tracking-tight">
                          {trade.Item}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="px-1.5 py-0.5 bg-muted/50 rounded font-medium uppercase">{trade.Type}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {trade.strategy && trade.strategy !== "Select" && (
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary text-xs font-semibold rounded-xl border border-primary/20"
                        >
                          {trade.strategy}
                        </motion.span>
                      )}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveDropdown(activeDropdown === `quality-${trade.id}` ? null : `quality-${trade.id}`)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${quality.bg} ${quality.border}`}
                        >
                          <QualityIcon className="w-3 h-3" />
                          {quality.label}
                        </motion.button>
                        <AnimatePresence>
                          {activeDropdown === `quality-${trade.id}` && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute left-0 top-full mt-2 z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-1.5 min-w-[120px]"
                            >
                              {["high", "medium", "low"].map((opt) => (
                                <motion.button
                                  key={opt}
                                  whileHover={{ x: 3 }}
                                  onClick={() => postSelect(trade.id, opt, trade.accountType)}
                                  className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-muted capitalize flex items-center gap-2"
                                >
                                  {opt === "high" && <Star className="w-3 h-3 text-profit" />}
                                  {opt === "medium" && <Zap className="w-3 h-3 text-yellow-500" />}
                                  {opt === "low" && <BarChart2 className="w-3 h-3 text-loss" />}
                                  {opt}
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Right: P&L & Actions */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <motion.p 
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                          isProfitable ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {isProfitable ? '+' : ''}{trade.Profit?.toFixed(2) || '0.00'}
                      </motion.p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium">P&L</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleShare(index)}
                        className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleExpand(trade.id, trade)}
                        className={`p-2.5 rounded-xl transition-colors ${
                          isExpanded ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </motion.button>
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
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-border/50">
                      {/* Trade Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
                        {[
                          { label: "Size", value: trade.Size, icon: BarChart2 },
                          { label: "Open Time", value: trade.OpenTime, icon: Clock },
                          { label: "Commission", value: trade.Commission, icon: DollarSign },
                          { label: "Account", value: trade.accountType, icon: Award },
                        ].map(({ label, value, icon: Icon }) => (
                          <motion.div 
                            key={label}
                            whileHover={{ y: -2 }}
                            className="p-3 rounded-xl bg-muted/30 border border-border/50"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-3 h-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground truncate">{value || '-'}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Mood Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-t border-border/50">
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
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm hover:bg-muted/50 transition-colors"
                            >
                              <span className={value && value !== "Select" ? "text-foreground font-medium" : "text-muted-foreground"}>
                                {value && value !== "Select" ? value : "Select mood..."}
                              </span>
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <AnimatePresence>
                              {activeDropdown === `${key}-${trade.id}` && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  className="absolute z-50 w-full mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
                                >
                                  {(profileData?.otherData?.[key] || []).filter((o: string) => o !== "Select").map((option: string) => (
                                    <motion.button
                                      key={option}
                                      whileHover={{ x: 3 }}
                                      onClick={() => postDropOptions(trade.id, option, key, trade.accountType)}
                                      className="w-full px-3 py-2.5 text-sm text-left hover:bg-muted flex items-center justify-between"
                                    >
                                      {option}
                                      {value === option && <Check className="w-4 h-4 text-primary" />}
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>

                      {/* Images Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-t border-border/50">
                        {["before", "after"].map((type) => (
                          <div key={type}>
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                              {type === "before" ? "📸" : "📊"}
                              <span className="capitalize">{type} Chart</span>
                            </p>
                            {trade[`${type}URL`] ? (
                              <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border/50"
                              >
                                <Image
                                  src={trade[`${type}URL`]}
                                  alt={`${type} chart`}
                                  fill
                                  className="object-cover"
                                />
                              </motion.div>
                            ) : (
                              <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 hover:border-primary/50 transition-all group">
                                <motion.div
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                                </motion.div>
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
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
                      <div className="py-4 border-t border-border/50 space-y-4">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          Journal Notes
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { key: "rfe", label: "Reason for Entry", placeholder: "Why did you enter?", emoji: "🎯" },
                            { key: "widw", label: "What I Did Well", placeholder: "What went right?", emoji: "✨" },
                            { key: "wni", label: "Needs Improvement", placeholder: "What could be better?", emoji: "🔧" },
                            { key: "lfnt", label: "Lessons Learned", placeholder: "Key takeaways", emoji: "📝" },
                          ].map(({ key, label, placeholder, emoji }) => (
                            <div key={key}>
                              <label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                                <span>{emoji}</span>
                                {label}
                              </label>
                              <input
                                type="text"
                                value={jrData[key as keyof typeof jrData]}
                                onChange={(e) => setJrData({ ...jrData, [key]: e.target.value })}
                                placeholder={placeholder}
                                className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border/50">
                        {trade.noteName ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setCurrentUrl("Notebook");
                              setFolder("Daily Journal");
                              setFile(trade.noteName!);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            View Notes
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addNotes(trade.id, trade.Item, trade.time, trade.date, trade.accountType)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted text-foreground rounded-xl text-sm font-semibold transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Add Notes
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => submitJrData(trade.id, trade.accountType)}
                          disabled={savingId === trade.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {savingId === trade.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {savingId === trade.id ? "Saving..." : "Save Journal"}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TiltCard>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 pt-8"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/20'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {page}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default JRContent;
