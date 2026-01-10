"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  BookOpen,
  Upload,
  Image as ImageIcon,
  X,
  Save,
  FileText,
  ClipboardCheck,
  Heart,
  Shield,
  BarChart3,
  Clock,
  CheckCircle2,
  Activity,
  Star,
  Percent,
  Scale,
  ListChecks,
  Check,
  DollarSign,
  ArrowUpDown,
  PanelLeft,
  Eye,
  Share2,
  Layers,
  FileImage,
  MessageSquare,
  Play,
  ChevronUp,
  Crosshair,
  AlertTriangle,
  BarChart2,
  LineChart,
  Maximize2,
  ArrowRight,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
  Plus,
  Trash2,
  Palette,
} from "lucide-react";
import useAccountDetails from "@/store/accountdetails";
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts";
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
  ExitTime?: string;
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
  stopLoss?: number | string;
  takeProfit?: number | string;
  fees?: number;
  swap?: number;
  [key: string]: any;
}

interface JournalData {
  templateId?: string;
  prompts?: Record<string, string>;
  sentiment?: "great" | "okay" | "poor";
  tags?: string[];
  rulesCompliance?: Record<string, boolean>;
  tradeRating?: number;
  tradeNotes?: string;
  dailyNotes?: string;
  reasonForEntry?: string;
  setupValidation?: string;
  exitRationale?: string;
  emotionalState?: string;
  mistakes?: string;
  whatWentWell?: string;
  improvements?: string;
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

interface CustomJournalTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  content: {
    reasonForEntry: string;
    exitRationale: string;
    lessonsLearned: string;
    emotionalState: string;
    dailyNotes: string;
  };
  isCustom: true;
}

type JournalTemplateType = typeof journalTemplates[0] | CustomJournalTemplate;

const TEMPLATE_ICONS = [
  { id: "Zap", icon: Zap },
  { id: "Target", icon: Target },
  { id: "ClipboardCheck", icon: ClipboardCheck },
  { id: "LineChart", icon: LineChart },
  { id: "AlertTriangle", icon: AlertTriangle },
  { id: "Heart", icon: Heart },
  { id: "Shield", icon: Shield },
  { id: "FileText", icon: FileText },
  { id: "Star", icon: Star },
  { id: "BookOpen", icon: BookOpen },
];

const TEMPLATE_COLORS = [
  { id: "amber", label: "Amber", class: "bg-amber-500" },
  { id: "blue", label: "Blue", class: "bg-blue-500" },
  { id: "green", label: "Green", class: "bg-emerald-500" },
  { id: "purple", label: "Purple", class: "bg-purple-500" },
  { id: "red", label: "Red", class: "bg-red-500" },
  { id: "pink", label: "Pink", class: "bg-pink-500" },
  { id: "cyan", label: "Cyan", class: "bg-cyan-500" },
];

const commonTags = ["FOMO", "Perfect Setup", "Revenge Trade", "Followed Plan", "Overtraded", "Early Exit", "Late Entry", "News Play", "Gap Fill", "Trend Follow"];

const journalTemplates = [
  {
    id: "quick",
    name: "Quick Entry",
    icon: "Zap",
    color: "amber",
    description: "Fast journal for simple trades",
    content: {
      reasonForEntry: "Setup: \nSignal: \nConfirmation: ",
      exitRationale: "Exit reason: \nResult: ",
      lessonsLearned: "",
      emotionalState: "",
      dailyNotes: ""
    }
  },
  {
    id: "full-analysis",
    name: "Full Analysis",
    icon: "ClipboardCheck",
    color: "blue",
    description: "Comprehensive trade breakdown",
    content: {
      reasonForEntry: "Market Context:\n- Trend direction:\n- Key levels:\n- Time of day:\n\nSetup:\n- Pattern identified:\n- Entry trigger:\n- Confirmation signals:\n\nRisk Management:\n- Position size rationale:\n- Stop loss placement:\n- Target levels:",
      exitRationale: "Exit Execution:\n- How I exited:\n- Slippage/fills:\n\nTrade Management:\n- Did I move stops?\n- Partials taken?\n- Held to plan?",
      lessonsLearned: "What Worked:\n-\n\nWhat Could Improve:\n-\n\nKey Insight:\n-",
      emotionalState: "Before trade:\nDuring trade:\nAfter trade:",
      dailyNotes: ""
    }
  },
  {
    id: "scalp",
    name: "Scalp Trade",
    icon: "Target",
    color: "green",
    description: "Quick in-and-out trades",
    content: {
      reasonForEntry: "Scalp Setup:\n- Momentum direction:\n- Entry level:\n- Quick target:",
      exitRationale: "Execution speed:\nFill quality:\nHeld time:",
      lessonsLearned: "Timing:\nSpeed of decision:",
      emotionalState: "Focus level:",
      dailyNotes: ""
    }
  },
  {
    id: "swing",
    name: "Swing Trade",
    icon: "LineChart",
    color: "purple",
    description: "Multi-day position analysis",
    content: {
      reasonForEntry: "Swing Setup:\n- Higher timeframe trend:\n- Entry zone:\n- Catalyst/reason:\n\nPosition Plan:\n- Expected hold time:\n- Key levels to watch:\n- News/events ahead:",
      exitRationale: "Holding Period:\n- Days held:\n- Price action during hold:\n- Exit decision:",
      lessonsLearned: "Patience:\nTrend reading:\nPosition sizing:",
      emotionalState: "Overnight concerns:\nConfidence in thesis:",
      dailyNotes: ""
    }
  },
  {
    id: "loss-review",
    name: "Loss Review",
    icon: "AlertTriangle",
    color: "red",
    description: "Deep dive into losing trades",
    content: {
      reasonForEntry: "Entry Analysis:\n- Was the setup valid?\n- Did I follow my rules?\n- Was timing correct?\n- Red flags I ignored:",
      exitRationale: "Exit Analysis:\n- Did I honor my stop?\n- Held too long?\n- Cut too early?\n- Emotional decision?",
      lessonsLearned: "Root Cause:\n-\n\nPrevention Plan:\n-\n\nRule to Add/Modify:\n-",
      emotionalState: "Pre-trade state:\nDuring loss:\nPost-loss reaction:",
      dailyNotes: "What I'll do differently next time:"
    }
  }
];

const getTemplateIcon = (iconName: string) => {
  switch (iconName) {
    case "ClipboardCheck": return ClipboardCheck;
    case "Zap": return Zap;
    case "Target": return Target;
    case "Heart": return Heart;
    case "Shield": return Shield;
    case "LineChart": return LineChart;
    case "AlertTriangle": return AlertTriangle;
    default: return FileText;
  }
};

const getJournalTemplateColor = (color: string) => {
  switch (color) {
    case "amber": return { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    case "blue": return { text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" };
    case "green": return { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    case "purple": return { text: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" };
    case "red": return { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" };
    default: return { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30" };
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
  const searchParams = useSearchParams();
  const urlTradeId = searchParams.get("tradeId");
  const { setAccounts, profileData } = useAccountDetails();
  const { selectedAccounts } = useModeFilteredAccounts();
  const { currency, exchangeRate } = useCurrencyStore();
  const tokenn = Cookies.get("ProJournX") || "";

  const [trades, setTrades] = useState<Trade[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState(0);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
  const [journalData, setJournalData] = useState<JournalData>({ prompts: {}, tags: [], tradeRating: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<"before" | "after" | null>(null);
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    tradeId: string;
    accountId: string;
    tradeSummary: { symbol?: string; pnl?: number; date?: string };
  } | null>(null);
  const [strategyRules, setStrategyRules] = useState<{id: string; text: string}[]>([]);
  const [rulesCompliance, setRulesCompliance] = useState<Record<string, boolean>>({});
  const [loadingRules, setLoadingRules] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isMobileTradeListOpen, setIsMobileTradeListOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const [tradeFilter, setTradeFilter] = useState<"all" | "winners" | "losers">("all");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  const [customTemplates, setCustomTemplates] = useState<CustomJournalTemplate[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>([]);
  const [pendingTemplate, setPendingTemplate] = useState<JournalTemplateType | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateIcon, setNewTemplateIcon] = useState("Zap");
  const [newTemplateColor, setNewTemplateColor] = useState("blue");
  const confirmModalRef = useRef<HTMLDivElement>(null);
  const saveTemplateModalRef = useRef<HTMLDivElement>(null);

  // Draft buffer to preserve unsaved journal content across account refreshes
  const draftJournalRef = useRef<Record<string, JournalData>>({});

  // Helper to get stable trade ID (normalized to string for consistent lookups)
  const getTradeId = (trade: Trade | null): string => {
    if (!trade) return "";
    // Normalize all ID types to string for consistent draft buffer keys
    const id = trade._id || trade.id || (trade as any).Ticket;
    return id !== undefined && id !== null ? String(id) : "";
  };

  // Removed tab states - now using single scrollable view for center content and right panel

  const existingStrategies: string[] = (profileData?.otherData?.strategy || []).filter((s: string) => s && s !== "Select");

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCustomTemplates = localStorage.getItem("projournx_custom_templates");
        if (savedCustomTemplates) {
          setCustomTemplates(JSON.parse(savedCustomTemplates));
        }
        const savedFavorites = localStorage.getItem("projournx_favorite_templates");
        if (savedFavorites) {
          setFavoriteTemplates(JSON.parse(savedFavorites));
        }
      } catch (error) {
        console.error("Error loading templates from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    const allTrades = (selectedAccounts as Account[]).flatMap((account) => 
      (account.tradeData || []).map(trade => ({
        ...trade,
        accountType: trade.accountType || account.accountType || ""
      }))
    );
    if (allTrades.length > 0) {
      const sorted = allTrades.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.EntryTime || a.time || "00:00:00"}`);
        const dateB = new Date(`${b.date}T${b.EntryTime || b.time || "00:00:00"}`);
        return dateB.getTime() - dateA.getTime();
      });
      setTrades(sorted);
      setIsDemo(false);
      
      // Default: select first trade if none selected and no URL param
      if (sorted.length > 0 && !selectedTrade && !urlTradeId) {
        setSelectedTrade(sorted[0]);
        setSelectedTradeIndex(0);
      }
    }
  }, [selectedAccounts]);

  // Separate useEffect to handle URL-based trade selection after trades are loaded
  useEffect(() => {
    if (!urlTradeId || trades.length === 0) return;
    
    const tradeFromUrl = trades.find(t => 
      t._id === urlTradeId || 
      t.id === urlTradeId || 
      (t as any).tradeId === urlTradeId || 
      String((t as any).Ticket) === urlTradeId
    );
    
    if (tradeFromUrl) {
      const idx = trades.indexOf(tradeFromUrl);
      setSelectedTrade(tradeFromUrl);
      setSelectedTradeIndex(idx >= 0 ? idx : 0);
    }
  }, [urlTradeId, trades]);

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
        setTemplates([]);
      }
    };
    fetchTemplates();
  }, []);

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
    const tradeId = getTradeId(selectedTrade);
    
    // Check if we have a draft for this trade (unsaved content)
    const draftData = tradeId ? draftJournalRef.current[tradeId] : null;
    
    if (draftData) {
      // Restore draft data
      setJournalData(draftData);
      const templateName = draftData.templateId;
      const idx = templates.findIndex((t) => t.name === templateName);
      if (idx >= 0) setSelectedTemplateIdx(idx);
    } else if (selectedTrade?.jrData) {
      setJournalData(selectedTrade.jrData);
      const templateName = selectedTrade.jrData.templateId;
      const idx = templates.findIndex((t) => t.name === templateName);
      if (idx >= 0) setSelectedTemplateIdx(idx);
    } else {
      setJournalData({ prompts: {}, tags: [], tradeRating: 0 });
      setSelectedTemplateIdx(0);
    }
  }, [selectedTrade, templates]);

  const filteredTrades = useMemo(() => {
    let data = trades;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((t) => (t.Item || t.symbol || "").toLowerCase().includes(q));
    }
    return data;
  }, [trades, searchQuery]);

  // Keyboard navigation for trades
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focused on an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") return;
      
      const finalFilteredTrades = filteredTrades.filter(t => {
        if (tradeFilter === "winners") return t.Profit >= 0;
        if (tradeFilter === "losers") return t.Profit < 0;
        return true;
      });
      
      if (finalFilteredTrades.length === 0) return;
      
      const currentIdx = finalFilteredTrades.findIndex(t => (t.id || t._id) === (selectedTrade?.id || selectedTrade?._id));
      
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const newIdx = currentIdx <= 0 ? finalFilteredTrades.length - 1 : currentIdx - 1;
        setSelectedTrade(finalFilteredTrades[newIdx]);
        setSelectedTradeIndex(newIdx);
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const newIdx = currentIdx >= finalFilteredTrades.length - 1 ? 0 : currentIdx + 1;
        setSelectedTrade(finalFilteredTrades[newIdx]);
        setSelectedTradeIndex(newIdx);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!isDemo && !isSaving) handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredTrades, tradeFilter, selectedTrade, isDemo, isSaving]);

  // Track unsaved changes and save to draft buffer
  useEffect(() => {
    if (selectedTrade) {
      const tradeId = getTradeId(selectedTrade);
      const originalData = selectedTrade.jrData || {};
      const hasChanges = JSON.stringify(journalData) !== JSON.stringify(originalData);
      setHasUnsavedChanges(hasChanges);
      
      // Save to draft if there are unsaved changes
      if (hasChanges && tradeId) {
        draftJournalRef.current[tradeId] = journalData;
      } else if (!hasChanges && tradeId) {
        // Clear draft if no changes
        delete draftJournalRef.current[tradeId];
      }
    }
  }, [journalData, selectedTrade]);

  // Close template dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
        setShowTemplateDropdown(false);
      }
    };
    if (showTemplateDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTemplateDropdown]);

  const hasExistingContent = () => {
    return !!(
      journalData.reasonForEntry ||
      journalData.exitRationale ||
      journalData.lessonsLearned ||
      journalData.emotionalState
    );
  };

  const getFieldsToOverwrite = () => {
    const fields: string[] = [];
    if (journalData.reasonForEntry) fields.push("Entry Reasoning");
    if (journalData.exitRationale) fields.push("Exit/Management");
    if (journalData.lessonsLearned) fields.push("Lessons Learned");
    if (journalData.emotionalState) fields.push("Emotional State");
    return fields;
  };

  const handleTemplateClick = (template: JournalTemplateType) => {
    if (hasExistingContent()) {
      setPendingTemplate(template);
      setShowConfirmModal(true);
    } else {
      applyJournalTemplate(template);
    }
  };

  const confirmApplyTemplate = () => {
    if (pendingTemplate) {
      applyJournalTemplate(pendingTemplate);
      setPendingTemplate(null);
      setShowConfirmModal(false);
    }
  };

  const applyJournalTemplate = (template: JournalTemplateType) => {
    setJournalData((prev) => ({
      ...prev,
      templateId: template.id,
      reasonForEntry: template.content.reasonForEntry,
      exitRationale: template.content.exitRationale,
      lessonsLearned: template.content.lessonsLearned,
      emotionalState: template.content.emotionalState,
      dailyNotes: template.content.dailyNotes || prev.dailyNotes || "",
    }));
    setShowTemplateDropdown(false);
  };

  const toggleFavorite = (templateId: string) => {
    setFavoriteTemplates((prev) => {
      const newFavorites = prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId];
      localStorage.setItem("projournx_favorite_templates", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const saveCustomTemplate = () => {
    if (!newTemplateName.trim()) return;
    
    const newTemplate: CustomJournalTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      icon: newTemplateIcon,
      color: newTemplateColor,
      description: "Custom template",
      content: {
        reasonForEntry: journalData.reasonForEntry || "",
        exitRationale: journalData.exitRationale || "",
        lessonsLearned: journalData.lessonsLearned || "",
        emotionalState: journalData.emotionalState || "",
        dailyNotes: journalData.dailyNotes || "",
      },
      isCustom: true,
    };

    const updatedTemplates = [...customTemplates, newTemplate];
    setCustomTemplates(updatedTemplates);
    localStorage.setItem("projournx_custom_templates", JSON.stringify(updatedTemplates));
    setShowSaveTemplateModal(false);
    setNewTemplateName("");
    setNewTemplateIcon("Zap");
    setNewTemplateColor("blue");
  };

  const deleteCustomTemplate = (templateId: string) => {
    const updatedTemplates = customTemplates.filter((t) => t.id !== templateId);
    setCustomTemplates(updatedTemplates);
    localStorage.setItem("projournx_custom_templates", JSON.stringify(updatedTemplates));
    setFavoriteTemplates((prev) => {
      const newFavorites = prev.filter((id) => id !== templateId);
      localStorage.setItem("projournx_favorite_templates", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const getAllTemplates = (): JournalTemplateType[] => {
    const all = [...journalTemplates, ...customTemplates];
    return all.sort((a, b) => {
      const aFav = favoriteTemplates.includes(a.id);
      const bFav = favoriteTemplates.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  };

  const getActiveTemplate = (): JournalTemplateType | null => {
    if (!journalData.templateId) return null;
    const all = [...journalTemplates, ...customTemplates];
    return all.find((t) => t.id === journalData.templateId) || null;
  };

  const navigateTrade = (direction: "prev" | "next") => {
    const currentIdx = filteredTrades.findIndex(t => (t.id || t._id) === (selectedTrade?.id || selectedTrade?._id));
    let newIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
    if (newIdx < 0) newIdx = filteredTrades.length - 1;
    if (newIdx >= filteredTrades.length) newIdx = 0;
    setSelectedTrade(filteredTrades[newIdx]);
    setSelectedTradeIndex(newIdx);
  };

  const calculateTradeMetrics = (trade: Trade) => {
    const entry = parseFloat(String(trade.entryPrice || 0));
    const exit = parseFloat(String(trade.exitPrice || 0));
    const qty = trade.quantity || 1;
    const isLong = trade.Type?.toLowerCase() === "long" || trade.side?.toLowerCase() === "long" || trade.Type?.toLowerCase() === "buy";
    const pips = isLong ? ((exit - entry) * 10000) : ((entry - exit) * 10000);
    const returnPerPip = trade.Profit / (pips || 1);
    const roi = ((trade.Profit) / (entry * qty) * 100);
    const grossPnL = trade.Profit + (trade.fees || 0);
    const adjustedCost = entry * qty;
    const sl = parseFloat(String(trade.stopLoss || 0));
    const tp = parseFloat(String(trade.takeProfit || 0));
    const risk = sl ? Math.abs(entry - sl) * qty : 0;
    const rMultiple = risk > 0 ? trade.Profit / risk : 0;
    const mae = sl ? Math.abs(entry - sl) : 0;
    const mfe = tp ? Math.abs(tp - entry) : 0;
    
    return {
      pips: Math.round(pips * 10) / 10,
      returnPerPip: Math.round(returnPerPip * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      grossPnL,
      adjustedCost,
      netROI: roi,
      mae: entry - mae,
      mfe: entry + mfe,
      rMultiple: Math.round(rMultiple * 100) / 100,
      initialTarget: trade.Profit,
      tradeRisk: risk,
      plannedRMultiple: tp && sl ? Math.abs(tp - entry) / Math.abs(entry - sl) : 0,
      realizedRMultiple: rMultiple
    };
  };

  const handlePromptChange = (promptId: string, value: string) => {
    setJournalData((prev) => ({
      ...prev,
      prompts: { ...prev.prompts, [promptId]: value },
    }));
  };

  const handleTradeNotesChange = (value: string) => {
    setJournalData((prev) => ({ ...prev, tradeNotes: value }));
  };

  const handleDailyNotesChange = (value: string) => {
    setJournalData((prev) => ({ ...prev, dailyNotes: value }));
  };

  const handleRatingChange = (rating: number) => {
    setJournalData((prev) => ({ ...prev, tradeRating: rating }));
  };

  const handleSentimentChange = (sentiment: "great" | "okay" | "poor") => {
    setJournalData((prev) => ({ ...prev, sentiment }));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !journalData.tags?.includes(tag)) {
      setJournalData((prev) => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setJournalData((prev) => ({ ...prev, tags: prev.tags?.filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    if (!selectedTrade || isDemo) return;
    setIsSaving(true);

    try {
      const tradeId = selectedTrade._id || selectedTrade.id || (selectedTrade as any).Ticket?.toString() || "";
      const existingRulesCompliance = selectedTrade.jrData?.rulesCompliance;
      const jrDataWithRules = {
        ...journalData,
        rulesCompliance: strategyRules.length > 0 ? rulesCompliance : existingRulesCompliance
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
      
      // Update selectedTrade with the saved jrData to sync state
      setSelectedTrade(prev => prev ? { ...prev, jrData: jrDataWithRules } : null);
      setTrades(prev => prev.map(t => 
        (t.id || t._id) === tradeId ? { ...t, jrData: jrDataWithRules } : t
      ));
      
      // Reset unsaved changes indicator and clear draft
      setHasUnsavedChanges(false);
      delete draftJournalRef.current[tradeId];
      
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
      const tradeId = selectedTrade._id || selectedTrade.id || (selectedTrade as any).Ticket?.toString() || "";
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
        const tradeId = selectedTrade._id || selectedTrade.id || (selectedTrade as any).Ticket?.toString() || "";
        formData.append("image", blob, file.name);
        formData.append("id", tradeId);
        formData.append("imgType", type === "before" ? "beforeURL" : "afterURL");
        formData.append("tokenn", tokenn);
        formData.append("accountType", selectedTrade.accountType || "");
        formData.append("apiName", "uploadImage");

        try {
          const response = await fetch("/api/daily-journal/post", { method: "POST", body: formData });
          if (response.ok) {
            const result = await response.json();
            if (result.imageUrl) {
              const imgKey = type === "before" ? "beforeURL" : "afterURL";
              setSelectedTrade(prev => prev ? { ...prev, [imgKey]: result.imageUrl } : null);
            }
          }
        } catch (err) {
          console.error("Image upload error:", err);
        } finally {
          setAccounts();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (time?: string) => {
    if (!time) return "--";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const metrics = selectedTrade ? calculateTradeMetrics(selectedTrade) : null;
  const isProfit = (selectedTrade?.Profit || 0) >= 0;
  const currentTradeNumber = filteredTrades.findIndex(t => (t.id || t._id) === (selectedTrade?.id || selectedTrade?._id)) + 1;

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Top Header Bar */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-2xl">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <div className="px-2 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
          {/* Left: Trade Navigation */}
          <div className="flex items-center gap-1 sm:gap-4 min-w-0 flex-shrink overflow-hidden">
            {/* Mobile Trade List Toggle */}
            <button
              onClick={() => setIsMobileTradeListOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border transition-all flex-shrink-0"
              aria-label="Open trade list"
            >
              <Layers className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => navigateTrade("prev")}
                className="p-1 sm:p-2 rounded-lg bg-muted/30 hover:bg-muted border border-border hover:border-primary/40 transition-all duration-200"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </button>
              <div className="px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-muted/40 border border-border min-w-[40px] sm:min-w-[56px] text-center">
                <span className="text-[10px] sm:text-sm font-semibold text-foreground tabular-nums">{currentTradeNumber}</span>
                <span className="text-[10px] sm:text-sm text-muted-foreground/60">/{filteredTrades.length}</span>
              </div>
              <button
                onClick={() => navigateTrade("next")}
                className="p-1 sm:p-2 rounded-lg bg-muted/30 hover:bg-muted border border-border hover:border-primary/40 transition-all duration-200"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Current Trade Info */}
            {selectedTrade && (
              <div className="flex items-center gap-1.5 sm:gap-3 pl-1.5 sm:pl-4 border-l border-border min-w-0 overflow-hidden">
                <SymbolLogo symbol={selectedTrade.Item || selectedTrade.symbol || ""} size="sm" />
                <div className="min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[60px] sm:max-w-none">{selectedTrade.Item || selectedTrade.symbol}</span>
                    <span className={`hidden sm:inline px-2 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0 ${
                      selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long" || selectedTrade.Type?.toLowerCase() === "buy"
                        ? "bg-profit/10 text-profit"
                        : "bg-loss/10 text-loss"
                    }`}>
                      {selectedTrade.Type || selectedTrade.side}
                    </span>
                  </div>
                  <span className="hidden sm:block text-xs text-muted-foreground">{formatDate(selectedTrade.date)}</span>
                </div>
                {/* Mobile P&L Badge */}
                <span className={`sm:hidden text-xs font-bold flex-shrink-0 ${isProfit ? "text-profit" : "text-loss"}`}>
                  {isProfit ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit, currency, exchangeRate)}
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* Mobile Stats Toggle */}
            <button
              onClick={() => setIsMobileStatsOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border transition-all"
              aria-label="Open stats panel"
            >
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
            </button>

            {selectedTrade && !isDemo && (
              <button
                onClick={() => setShareModal({
                  isOpen: true,
                  tradeId: selectedTrade._id || selectedTrade.id || (selectedTrade as any).Ticket?.toString() || "",
                  accountId: selectedTrade.accountType || "",
                  tradeSummary: {
                    symbol: selectedTrade.Item || selectedTrade.symbol,
                    pnl: selectedTrade.Profit,
                    date: selectedTrade.date,
                  },
                })}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border text-sm text-muted-foreground hover:text-foreground transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden md:inline">Share</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isDemo || isSaving}
              className={`group relative flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-xl text-white font-semibold text-[10px] sm:text-sm transition-all duration-300 disabled:opacity-50 shadow-lg ${
                hasUnsavedChanges 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20 hover:shadow-amber-500/30" 
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/30"
              }`}
            >
              {hasUnsavedChanges && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              )}
              <Save className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden xs:inline sm:inline">{isSaving ? "..." : hasUnsavedChanges ? "Save" : "Saved"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Trade List */}
        <motion.div
          initial={false}
          animate={{ width: isLeftPanelCollapsed ? 0 : 280 }}
          className="hidden md:block flex-shrink-0 border-r border-border bg-gradient-to-b from-card to-background overflow-hidden"
        >
          <div className="w-[280px] h-full flex flex-col">
            {/* Search & Filters */}
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trades..."
                  className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:bg-muted/50 transition-all duration-200"
                />
              </div>
              {/* Filter Buttons */}
              <div className="flex gap-1">
                {[
                  { key: "all", label: "All" },
                  { key: "winners", label: "Winners", color: "profit" },
                  { key: "losers", label: "Losers", color: "loss" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTradeFilter(f.key as "all" | "winners" | "losers")}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      tradeFilter === f.key
                        ? f.color === "profit"
                          ? "bg-profit/15 text-profit border border-profit/30"
                          : f.color === "loss"
                          ? "bg-loss/15 text-loss border border-loss/30"
                          : "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trade List with Day Grouping */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
              {(() => {
                // Group trades by date
                const groupedTrades: { [key: string]: typeof filteredTrades } = {};
                const finalFilteredTrades = filteredTrades.filter(t => {
                  if (tradeFilter === "winners") return t.Profit >= 0;
                  if (tradeFilter === "losers") return t.Profit < 0;
                  return true;
                });
                
                finalFilteredTrades.forEach(trade => {
                  const dateKey = trade.date || "Unknown";
                  if (!groupedTrades[dateKey]) groupedTrades[dateKey] = [];
                  groupedTrades[dateKey].push(trade);
                });

                const getDateLabel = (dateStr: string) => {
                  const today = new Date().toISOString().split('T')[0];
                  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                  if (dateStr === today) return "Today";
                  if (dateStr === yesterday) return "Yesterday";
                  return formatDate(dateStr);
                };

                const sortedDates = Object.keys(groupedTrades).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                if (sortedDates.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm text-muted-foreground/70 mb-1">No trades found</p>
                      <p className="text-xs text-muted-foreground/50">
                        {tradeFilter !== "all" ? "Try changing the filter" : "Add trades to get started"}
                      </p>
                    </div>
                  );
                }

                return sortedDates.map(dateKey => (
                  <div key={dateKey} className="mb-3">
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 px-2 py-1.5 mb-1 bg-background/95 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                          {getDateLabel(dateKey)}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[9px] text-muted-foreground/50">
                          {groupedTrades[dateKey].length} trade{groupedTrades[dateKey].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    {/* Trades for this date */}
                    <div className="space-y-1">
                      {groupedTrades[dateKey].map((trade, idx) => {
                        const globalIdx = finalFilteredTrades.indexOf(trade);
                        const isSelected = (trade.id || trade._id) === (selectedTrade?.id || selectedTrade?._id);
                        const tradeProfit = trade.Profit >= 0;
                        const hasJournalData = trade.jrData?.widw || trade.jrData?.tradeRating;
                        return (
                          <motion.button
                            key={trade.id || trade._id || idx}
                            onClick={() => {
                              setSelectedTrade(trade);
                              setSelectedTradeIndex(globalIdx);
                            }}
                            className={`w-full p-2.5 text-left rounded-xl transition-all duration-200 group ${
                              isSelected 
                                ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/5" 
                                : "hover:bg-muted border border-transparent hover:border-primary/30"
                            }`}
                            whileHover={{ scale: isSelected ? 1 : 1.005 }}
                            whileTap={{ scale: 0.995 }}
                          >
                            <div className="flex items-center gap-2.5">
                              <SymbolLogo 
                                symbol={trade.Item || trade.symbol || ""} 
                                size="sm" 
                                isProfit={tradeProfit}
                                isSelected={isSelected}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`font-semibold text-sm truncate ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>
                                    {trade.Item || trade.symbol}
                                  </span>
                                  <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${tradeProfit ? "text-profit" : "text-loss"}`}>
                                    {tradeProfit ? "+" : ""}{formatCompactCurrency(trade.Profit, currency, exchangeRate)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground/60">{formatTime(trade.EntryTime || trade.time)}</span>
                                  {trade.strategy && trade.strategy !== "Select" && (
                                    <>
                                      <span className="text-muted-foreground/30">·</span>
                                      <span className="text-[10px] text-primary/60 truncate max-w-[70px]">{trade.strategy}</span>
                                    </>
                                  )}
                                  {hasJournalData && (
                                    <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                                      Journaled
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </motion.div>

        {/* Toggle Left Panel - Desktop Only */}
        <motion.button
          initial={false}
          animate={{ left: isLeftPanelCollapsed ? 0 : 280 }}
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card border border-border rounded-r-lg hover:bg-muted/50 transition-colors items-center justify-center"
        >
          {isLeftPanelCollapsed ? <PanelRightOpen className="w-4 h-4 text-muted-foreground" /> : <PanelRightClose className="w-4 h-4 text-muted-foreground" />}
        </motion.button>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Hero Summary Bar - Always Visible */}
          {selectedTrade && metrics && (
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-border bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* P&L Display */}
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold tabular-nums ${isProfit ? 'text-profit' : 'text-loss'}`}>
                    {isProfit ? '+' : ''}{formatCompactCurrency(selectedTrade.Profit, currency, exchangeRate)}
                  </span>
                  
                  {/* Quick Stats */}
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-center px-3">
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block">Entry</span>
                      <span className="text-xs font-semibold text-foreground">{formatTime(selectedTrade.EntryTime || selectedTrade.time)}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center px-3">
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block">Exit</span>
                      <span className="text-xs font-semibold text-foreground">{formatTime(selectedTrade.ExitTime)}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center px-3">
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block">Pips</span>
                      <span className="text-xs font-semibold text-primary">{metrics.pips}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Rating & Sentiment */}
                <div className="flex items-center gap-3">
                  {/* Star Rating - supports half stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = journalData.tradeRating || 0;
                      const isFullStar = rating >= star;
                      const isHalfStar = rating >= star - 0.5 && rating < star;
                      return (
                        <button
                          key={star}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const isLeftHalf = clickX < rect.width / 2;
                            handleRatingChange(isLeftHalf ? star - 0.5 : star);
                          }}
                          className="relative transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <Star className="w-4 h-4 text-muted-foreground/20" />
                          {isFullStar && (
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 absolute inset-0" />
                          )}
                          {isHalfStar && (
                            <div className="absolute inset-0 overflow-hidden w-1/2">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {journalData.tradeRating ? (
                      <span className="text-xs text-amber-400 ml-1">{journalData.tradeRating}</span>
                    ) : null}
                  </div>

                  {/* Quick Sentiment */}
                  <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border">
                    {[
                      { key: "poor", icon: TrendingDown, color: "loss" },
                      { key: "okay", icon: Activity, color: "amber-500" },
                      { key: "great", icon: TrendingUp, color: "profit" },
                    ].map((s) => {
                      const isSelected = journalData.sentiment === s.key;
                      return (
                        <button
                          key={s.key}
                          onClick={() => handleSentimentChange(s.key as "great" | "okay" | "poor")}
                          className={`p-1.5 rounded-md transition-all duration-200 ${
                            isSelected
                              ? s.color === "profit" 
                                ? "bg-profit/20 text-profit"
                                : s.color === "loss"
                                ? "bg-loss/20 text-loss"
                                : "bg-amber-500/20 text-amber-500"
                              : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
                          }`}
                          title={s.key.charAt(0).toUpperCase() + s.key.slice(1)}
                        >
                          <s.icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Center Main Content - Single Scrollable View */}
          <div className="flex-1 overflow-y-auto">
            {selectedTrade && (
              <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
                
                {/* Screenshots Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Trade Screenshots</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Before Screenshot */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-muted-foreground">Before Entry</span>
                        {selectedTrade.beforeURL && (
                          <button
                            onClick={() => openLightbox(selectedTrade.beforeURL!, "before")}
                            className="ml-auto p-1 rounded bg-muted/50 hover:bg-muted/70 transition-all"
                          >
                            <Maximize2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden relative group aspect-video">
                        {selectedTrade.beforeURL ? (
                          <img
                            src={selectedTrade.beforeURL}
                            alt="Before trade"
                            className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => openLightbox(selectedTrade.beforeURL!, "before")}
                          />
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/30 transition-colors">
                            <Upload className="w-5 h-5 text-muted-foreground/40 mb-1" />
                            <span className="text-[10px] text-muted-foreground/60">Upload</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "before")} />
                          </label>
                        )}
                      </div>
                    </div>
                    
                    {/* After Screenshot */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isProfit ? 'bg-profit' : 'bg-loss'}`} />
                        <span className="text-xs font-medium text-muted-foreground">After Exit</span>
                        {selectedTrade.afterURL && (
                          <button
                            onClick={() => openLightbox(selectedTrade.afterURL!, "after")}
                            className="ml-auto p-1 rounded bg-muted/50 hover:bg-muted/70 transition-all"
                          >
                            <Maximize2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden relative group aspect-video">
                        {selectedTrade.afterURL ? (
                          <img
                            src={selectedTrade.afterURL}
                            alt="After trade"
                            className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => openLightbox(selectedTrade.afterURL!, "after")}
                          />
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/30 transition-colors">
                            <Upload className="w-5 h-5 text-muted-foreground/40 mb-1" />
                            <span className="text-[10px] text-muted-foreground/60">Upload</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "after")} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Trade Narrative Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Trade Narrative</h3>
                      {(() => {
                        const activeTemplate = getActiveTemplate();
                        if (activeTemplate) {
                          const colors = getJournalTemplateColor(activeTemplate.color);
                          return (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                              {activeTemplate.name}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  
                  {/* Template Cards - Horizontal Scroll */}
                  <div className="relative">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                      {getAllTemplates().map((template) => {
                        const TemplateIcon = getTemplateIcon(template.icon);
                        const colors = getJournalTemplateColor(template.color);
                        const isActive = journalData.templateId === template.id;
                        const isFavorite = favoriteTemplates.includes(template.id);
                        const isCustom = "isCustom" in template && template.isCustom;
                        
                        return (
                          <motion.div
                            key={template.id}
                            className={`relative flex-shrink-0 w-[110px] p-3 rounded-xl border cursor-pointer transition-all duration-200 group ${
                              isActive
                                ? `${colors.bg} ${colors.border} border-2 shadow-lg`
                                : "bg-muted/20 border-border hover:bg-muted/40 hover:border-primary/30"
                            }`}
                            onClick={() => handleTemplateClick(template)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Favorite Star */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(template.id);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full hover:bg-muted/60 transition-colors z-10"
                            >
                              <Star className={`w-3 h-3 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
                            </button>
                            
                            {/* Delete button for custom templates */}
                            {isCustom && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomTemplate(template.id);
                                }}
                                className="absolute top-1.5 left-1.5 p-1 rounded-full bg-loss/10 hover:bg-loss/20 text-loss opacity-0 group-hover:opacity-100 transition-all z-10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            
                            <div className="flex flex-col items-center text-center gap-1.5 pt-2">
                              <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                                <TemplateIcon className={`w-4 h-4 ${colors.text}`} />
                              </div>
                              <span className="text-[11px] font-medium text-foreground line-clamp-1">{template.name}</span>
                              <span className="text-[9px] text-muted-foreground/70 line-clamp-2 leading-tight">{template.description}</span>
                            </div>
                            
                            {isActive && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${colors.text.replace("text-", "bg-")} flex items-center justify-center`}>
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                      
                      {/* Save as Template Button */}
                      <motion.button
                        onClick={() => setShowSaveTemplateModal(true)}
                        className="flex-shrink-0 w-[110px] p-3 rounded-xl border border-dashed border-border hover:border-primary/40 bg-muted/10 hover:bg-muted/30 transition-all group flex flex-col items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Save Template</span>
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border focus-within:border-primary/30 transition-colors">
                      <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium block mb-1.5">
                        Why did you enter this trade?
                      </label>
                      <textarea
                        value={journalData.reasonForEntry || ""}
                        onChange={(e) => setJournalData((prev) => ({ ...prev, reasonForEntry: e.target.value }))}
                        placeholder="Describe the setup, signals, and your reasoning..."
                        rows={4}
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-muted/20 border border-border focus-within:border-primary/30 transition-colors">
                      <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium block mb-1.5">
                        How did you manage & exit?
                      </label>
                      <textarea
                        value={journalData.exitRationale || ""}
                        onChange={(e) => setJournalData((prev) => ({ ...prev, exitRationale: e.target.value }))}
                        placeholder="Target hit, stopped out, or manual exit? What did you observe?"
                        rows={4}
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Lessons & Reflection Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-foreground">Lessons & Reflection</h3>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/20 border border-border focus-within:border-amber-500/30 transition-colors">
                    <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium block mb-1.5">
                      What did you learn from this trade?
                    </label>
                    <textarea
                      value={journalData.lessonsLearned || ""}
                      onChange={(e) => setJournalData((prev) => ({ ...prev, lessonsLearned: e.target.value }))}
                      placeholder="Key takeaways, mistakes to avoid, patterns to remember..."
                      rows={4}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-muted/20 border border-border focus-within:border-primary/30 transition-colors">
                    <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium block mb-1.5">
                      How were you feeling during this trade?
                    </label>
                    <textarea
                      value={journalData.emotionalState || ""}
                      onChange={(e) => setJournalData((prev) => ({ ...prev, emotionalState: e.target.value }))}
                      placeholder="Confident, anxious, impulsive, calm..."
                      rows={4}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Quick Tags Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-foreground">Quick Tags</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {["A+ Setup", "Followed Rules", "Emotional Entry", "FOMO", "Revenge Trade", "Patience Paid", "Early Exit", "Perfect Execution"].map((tag) => {
                      const isActive = journalData.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            setJournalData(prev => ({
                              ...prev,
                              tags: isActive 
                                ? (prev.tags || []).filter(t => t !== tag)
                                : [...(prev.tags || []), tag]
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Notes Section */}
                <div className="space-y-3 pb-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-foreground">Daily Notes</h3>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/20 border border-border focus-within:border-blue-500/30 transition-colors">
                    <textarea
                      value={journalData.dailyNotes || ""}
                      onChange={(e) => setJournalData((prev) => ({ ...prev, dailyNotes: e.target.value }))}
                      placeholder="General notes about your trading day, market conditions, mindset..."
                      rows={3}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Panel - Unified Stats & Strategy */}
        <motion.div
          initial={false}
          animate={{ width: isRightPanelCollapsed ? 0 : 280 }}
          className="hidden lg:block flex-shrink-0 border-l border-border bg-gradient-to-b from-card/80 to-background overflow-hidden"
        >
          <div className="w-[280px] h-full flex flex-col">
            {/* Right Panel Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Trade Details</h3>
              </div>
            </div>

            {/* Right Panel Content - Single Scrollable View */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
              {selectedTrade && metrics && (
                <>
                  {/* Timing */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Entry</span>
                      <p className="text-[11px] font-semibold text-foreground mt-0.5">{formatTime(selectedTrade.EntryTime || selectedTrade.time)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Exit</span>
                      <p className="text-[11px] font-semibold text-foreground mt-0.5">{formatTime(selectedTrade.ExitTime)}</p>
                    </div>
                  </div>

                  {/* Position & Performance Grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Side</span>
                      <p className={`text-xs font-bold mt-0.5 ${
                        (selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long" || selectedTrade.Type?.toLowerCase() === "buy")
                          ? "text-profit" : "text-loss"
                      }`}>
                        {selectedTrade.Type || selectedTrade.side || "--"}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Size</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{selectedTrade.quantity || selectedTrade.Size || "--"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">Pips</span>
                      <p className="text-xs font-bold text-primary mt-0.5">{metrics.pips}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider">ROI</span>
                      <p className={`text-xs font-bold mt-0.5 ${metrics.netROI >= 0 ? "text-profit" : "text-loss"}`}>
                        {metrics.netROI > 0 ? "+" : ""}{isFinite(metrics.netROI) ? metrics.netROI.toFixed(1) : "0"}%
                      </p>
                    </div>
                  </div>

                  {/* Costs (Compact) */}
                  <div className="flex gap-2 text-[10px]">
                    <span className="text-muted-foreground/50">Fees: <span className="text-foreground">{formatCompactCurrency(selectedTrade.fees || 0, currency, exchangeRate)}</span></span>
                    <span className="text-muted-foreground/50">Swap: <span className="text-foreground">{formatCompactCurrency(selectedTrade.swap || 0, currency, exchangeRate)}</span></span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border" />

                  {/* Strategy Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Strategy</span>
                    </div>
                    <select
                      value={selectedTrade.strategy || ""}
                      onChange={async (e) => {
                        const newStrategy = e.target.value;
                        const tradeId = selectedTrade._id || selectedTrade.id || (selectedTrade as any).Ticket?.toString() || "";
                        
                        setSelectedTrade(prev => prev ? { ...prev, strategy: newStrategy } : null);
                        const currentTradeId = selectedTrade._id || selectedTrade.id || (selectedTrade as any).Ticket?.toString() || "";
                        setTrades(prev => prev.map(t => {
                          const tId = t._id || t.id || (t as any).Ticket?.toString() || "";
                          return tId === currentTradeId ? { ...t, strategy: newStrategy } : t;
                        }));
                        
                        if (newStrategy && newStrategy !== "Select") {
                          fetchStrategyRules(newStrategy);
                        } else {
                          setStrategyRules([]);
                          setRulesCompliance({});
                        }
                        
                        if (!isDemo) {
                          try {
                            await fetch("/api/daily-journal/post", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                apiName: "editDropdowns",
                                id: tradeId,
                                type: "strategy",
                                value: newStrategy,
                                tokenn,
                                accountType: selectedTrade.accountType || "",
                              }),
                            });
                            setAccounts();
                          } catch (error) {
                            console.error("Error saving strategy:", error);
                          }
                        }
                      }}
                      className="w-full px-2.5 py-2 bg-muted/30 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary/40 transition-all cursor-pointer"
                    >
                      <option value="" className="bg-card text-muted-foreground">Select strategy...</option>
                      {existingStrategies.map((strategy) => (
                        <option key={strategy} value={strategy} className="bg-card text-foreground">
                          {strategy}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Strategy Rules Compliance - Show only if strategy selected */}
                  {strategyRules.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider px-0.5">Rules Compliance</span>
                      <div className="space-y-1">
                        {strategyRules.slice(0, 4).map((rule: { id: string; text: string }, idx) => (
                          <div 
                            key={rule.id || idx} 
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={() => {
                              setRulesCompliance(prev => ({
                                ...prev,
                                [rule.id]: prev[rule.id] === true ? false : prev[rule.id] === false ? undefined : true
                              }));
                            }}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                              rulesCompliance[rule.id] === true 
                                ? "bg-profit/20 text-profit border border-profit/30"
                                : rulesCompliance[rule.id] === false 
                                ? "bg-loss/20 text-loss border border-loss/30"
                                : "bg-muted/50 border border-border"
                            }`}>
                              {rulesCompliance[rule.id] === true && <Check className="w-3 h-3" />}
                              {rulesCompliance[rule.id] === false && <X className="w-3 h-3" />}
                            </div>
                            <span className="text-[10px] text-foreground truncate">{rule.text}</span>
                          </div>
                        ))}
                        {strategyRules.length > 4 && (
                          <p className="text-[9px] text-muted-foreground/50 px-1">+{strategyRules.length - 4} more rules</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </motion.div>

        {/* Toggle Right Panel - Desktop Only */}
        <motion.button
          initial={false}
          animate={{ right: isRightPanelCollapsed ? 0 : 280 }}
          onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-10 p-1.5 bg-card border border-border rounded-l-lg hover:bg-muted/50 transition-colors items-center justify-center"
        >
          {isRightPanelCollapsed ? <PanelRightClose className="w-4 h-4 text-muted-foreground" /> : <PanelRightOpen className="w-4 h-4 text-muted-foreground" />}
        </motion.button>
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
                <span className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium">
                  {lightboxType === "before" ? "Entry Screenshot" : "Exit Screenshot"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isDemo && (
                  <button
                    onClick={() => handleDeleteScreenshot(lightboxType!)}
                    className="px-4 py-2 rounded-xl bg-loss/20 hover:bg-loss/30 text-loss text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={closeLightbox}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
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

      {/* Mobile Trade List Drawer */}
      <AnimatePresence>
        {isMobileTradeListOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-background/80 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileTradeListOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-card border-r border-border flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Trades</span>
                <button
                  onClick={() => setIsMobileTradeListOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search trades..."
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredTrades.map((trade, idx) => {
                  const isSelected = (trade.id || trade._id) === (selectedTrade?.id || selectedTrade?._id);
                  const tradeProfit = trade.Profit >= 0;
                  return (
                    <button
                      key={trade.id || trade._id || idx}
                      onClick={() => {
                        setSelectedTrade(trade);
                        setSelectedTradeIndex(idx);
                        setIsMobileTradeListOpen(false);
                      }}
                      className={`w-full p-4 text-left border-b border-border/30 transition-all ${
                        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SymbolLogo symbol={trade.Item || trade.symbol || ""} size="sm" />
                          <div>
                            <span className="font-medium text-foreground text-sm">{trade.Item || trade.symbol}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{formatDate(trade.date)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${tradeProfit ? "text-profit" : "text-loss"}`}>
                          {tradeProfit ? "+" : ""}{formatCompactCurrency(trade.Profit, currency, exchangeRate)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Stats Drawer */}
      <AnimatePresence>
        {isMobileStatsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-background/80 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileStatsOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[90%] max-w-[360px] bg-card border-l border-border flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex gap-1 p-1 bg-muted/20 rounded-xl border border-border flex-1 mr-2">
                  {[
                    { key: "stats", label: "Stats", icon: BarChart2 },
                    { key: "strategy", label: "Strategy", icon: Target },
                    { key: "executions", label: "Exec", icon: Activity },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setMainTab(tab.key as typeof mainTab)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        mainTab === tab.key ? "bg-muted/50 text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsMobileStatsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Stats Tab - Mobile */}
                {mainTab === "stats" && selectedTrade && metrics && (
                  <>
                    <div className={`p-4 rounded-2xl border ${isProfit ? "bg-profit/5 border-profit/20" : "bg-loss/5 border-loss/20"}`}>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Net P&L</span>
                      <div className="mt-1">
                        <span className={`text-2xl font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
                          {isProfit ? "+" : ""}{formatCompactCurrency(selectedTrade.Profit, currency, exchangeRate)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-muted/20 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase">Side</span>
                        <p className={`text-sm font-semibold mt-1 ${
                          (selectedTrade.Type?.toLowerCase() === "long" || selectedTrade.side?.toLowerCase() === "long") ? "text-profit" : "text-loss"
                        }`}>{selectedTrade.Type || selectedTrade.side}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase">Qty</span>
                        <p className="text-sm font-semibold text-foreground mt-1">{selectedTrade.quantity || "--"}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border">
                      <span className="text-xs text-muted-foreground block mb-2">Trade Rating</span>
                      <div className="flex gap-1 items-center">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = journalData.tradeRating || 0;
                          const isFullStar = rating >= star;
                          const isHalfStar = rating >= star - 0.5 && rating < star;
                          return (
                            <button
                              key={star}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const isLeftHalf = clickX < rect.width / 2;
                                handleRatingChange(isLeftHalf ? star - 0.5 : star);
                              }}
                              className="relative"
                            >
                              <Star className="w-5 h-5 text-muted-foreground/30" />
                              {isFullStar && (
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400 absolute inset-0" />
                              )}
                              {isHalfStar && (
                                <div className="absolute inset-0 overflow-hidden w-1/2">
                                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                        {journalData.tradeRating ? (
                          <span className="text-xs text-amber-400 ml-1">{journalData.tradeRating}</span>
                        ) : null}
                      </div>
                    </div>
                  </>
                )}

                {/* Strategy Tab - Mobile */}
                {mainTab === "strategy" && selectedTrade && (
                  <>
                    {selectedTrade.strategy && selectedTrade.strategy !== "Select" ? (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                        <span className="text-xs text-primary uppercase tracking-wider">Active Strategy</span>
                        <p className="text-lg font-semibold text-foreground mt-1">{selectedTrade.strategy}</p>
                      </div>
                    ) : (
                      <div className="p-6 text-center rounded-xl bg-muted/20 border border-border">
                        <Target className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No strategy assigned</p>
                      </div>
                    )}
                  </>
                )}

                {/* Executions Tab - Mobile */}
                {mainTab === "executions" && selectedTrade && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-profit/5 border border-profit/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-profit" />
                        <span className="text-xs font-medium text-profit">Entry</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price</span>
                        <span className="text-foreground font-medium">{selectedTrade.entryPrice || "--"}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-loss/5 border border-loss/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-loss" />
                        <span className="text-xs font-medium text-loss">Exit</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price</span>
                        <span className="text-foreground font-medium">{selectedTrade.exitPrice || "--"}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && pendingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setShowConfirmModal(false);
              setPendingTemplate(null);
            }}
          >
            <motion.div
              ref={confirmModalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Apply Template?</h3>
                    <p className="text-sm text-muted-foreground">This will overwrite existing content</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-sm text-foreground">
                  You are about to apply the <span className="font-semibold text-primary">"{pendingTemplate.name}"</span> template. The following fields will be overwritten:
                </p>
                
                <div className="space-y-2">
                  {getFieldsToOverwrite().map((field) => (
                    <div key={field} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-sm text-foreground">{field}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t border-border flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingTemplate(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-muted/30 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApplyTemplate}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
                >
                  Apply Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSaveTemplateModal(false)}
          >
            <motion.div
              ref={saveTemplateModalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Save as Template</h3>
                    <p className="text-sm text-muted-foreground">Save current content as a custom template</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Template Name */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Template Name</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="w-full px-4 py-2.5 rounded-lg bg-muted/30 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                
                {/* Icon Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_ICONS.map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setNewTemplateIcon(id)}
                        className={`p-2.5 rounded-lg border transition-all ${
                          newTemplateIcon === id
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Color Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_COLORS.map(({ id, class: colorClass }) => (
                      <button
                        key={id}
                        onClick={() => setNewTemplateColor(id)}
                        className={`w-8 h-8 rounded-lg ${colorClass} transition-all ${
                          newTemplateColor === id
                            ? "ring-2 ring-offset-2 ring-offset-card ring-white/50 scale-110"
                            : "hover:scale-105 opacity-70 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Preview */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Preview</label>
                  <div className="p-4 rounded-xl bg-muted/20 border border-border">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComponent = getTemplateIcon(newTemplateIcon);
                        const colors = getJournalTemplateColor(newTemplateColor);
                        return (
                          <>
                            <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                              <IconComponent className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{newTemplateName || "Template Name"}</p>
                              <p className="text-xs text-muted-foreground">Custom template</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-border flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveTemplateModal(false);
                    setNewTemplateName("");
                    setNewTemplateIcon("Zap");
                    setNewTemplateColor("blue");
                  }}
                  className="px-4 py-2 rounded-lg bg-muted/30 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomTemplate}
                  disabled={!newTemplateName.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Template
                </button>
              </div>
            </motion.div>
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
