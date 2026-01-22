'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, AnimatePresence } from "framer-motion";
import {
  faPenToSquare,
  faTrashCan,
  faShareNodes,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faPlus,
  faTrophy,
  faChartLine,
  faPercent,
  faCoins,
  faSkullCrossbones,
  faScaleBalanced,
  faBook,
  faChevronDown,
  faChevronUp,
  faFilter,
  faSort,
  faClock,
  faLayerGroup,
  faArrowUp,
  faArrowDown
} from "@fortawesome/free-solid-svg-icons";

import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts";
import { useDataStore } from "@/store/store";
import useAccountDetails from "@/store/accountdetails";


interface Trade {
  id?: string;
  _id?: string;
  tradeId?: string;
  date: string;
  time: string;
  OpenTime: string;
  Ticket: number;
  Item: string;
  Type: string;
  Size: number;
  OpenPrice: number;
  CloseTime: string;
  ClosePrice: number;
  Commission: number;
  Swap: number;
  Profit: number;
  Currency?: string;
  marketType?: string;
  accountName?: string;
  accountId?: string;
  notes?: string;
}

const getCurrencySymbol = (currency?: string, marketType?: string): string => {
  if (currency === 'INR') return '₹';
  if (marketType === 'INDIAN F&O' || marketType === 'INDIAN STOCKS' || marketType === 'INDIAN_STOCK') return '₹';
  return '$';
};

interface GroupedTrade {
  date: string;
  trades: Trade[];
  profit: number;
  tradeLength: number;
}

interface ChartData {
  time: string;
  value: number;
}

type FilterType = 'all' | 'winners' | 'losers';
type SortType = 'time' | 'pnl' | 'size';

const parseTimeToDate = (timeStr: string): Date | null => {
  if (!timeStr) return null;

  // Try ISO format first (e.g., "2025-12-30T18:58" or "2025-12-30T18:58:00")
  if (timeStr.includes('T') || timeStr.includes('-')) {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Try simple time format (e.g., "18:58" or "18:58:00")
  if (timeStr.includes(':')) {
    const today = new Date();
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    today.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
    return today;
  }

  return null;
};

const calculateDuration = (openTime: string, closeTime: string): string => {
  if (!openTime || !closeTime) return '-';

  try {
    const open = parseTimeToDate(openTime);
    const close = parseTimeToDate(closeTime);

    if (!open || !close) return '-';

    let diffMs = close.getTime() - open.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const diffMins = Math.floor(diffMs / 60000);
    if (isNaN(diffMins) || diffMins < 0) return '-';

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  } catch {
    return '-';
  }
};

const calculateDurationMinutes = (openTime: string, closeTime: string): number => {
  if (!openTime || !closeTime) return 0;

  try {
    const open = parseTimeToDate(openTime);
    const close = parseTimeToDate(closeTime);

    if (!open || !close) return 0;

    let diffMs = close.getTime() - open.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const result = Math.floor(diffMs / 60000);
    return isNaN(result) || result < 0 ? 0 : result;
  } catch {
    return 0;
  }
};

const formatAvgDuration = (minutes: number): string => {
  if (minutes === 0) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

const CalendarPopup = () => {
  const router = useRouter();
  const { showTr, setShowTr, dataDate, setDateHard, setAddTrades, setShowEditTradePopUp, setEditTradeData } = calendarPopUp();
  const { setAlertBoxG } = notifications();
  const { selectedAccounts } = useModeFilteredAccounts();
  const { bkurl } = useDataStore();
  const { setAccounts } = useAccountDetails();
  const tokenn = Cookies.get("ProJournX");
  const popupRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; tradeId: string | null }>({ show: false, tradeId: null });
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('time');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";

    const dateObj = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const dayOfWeek = days[dateObj.getDay()];
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];

    return `${dayOfWeek}, ${month} ${day}`;
  };

  const groupedTrades = selectedAccounts.flatMap(acc =>
    (acc.tradeData || []).map((trade: Trade) => ({
      ...trade,
      accountName: acc.accountName,
      accountId: acc._id
    }))
  ).reduce((acc: { [key: string]: GroupedTrade }, trade: Trade) => {
    if (!acc[trade.date]) {
      acc[trade.date] = {
        date: trade.date,
        trades: [],
        profit: 0,
        tradeLength: 0
      };
    }

    acc[trade.date].trades.push(trade);
    acc[trade.date].profit += trade.Profit;
    acc[trade.date].tradeLength += 1;

    return acc;
  }, {});

  const calendarData: GroupedTrade[] = Object.values(groupedTrades);
  const dataToday = calendarData.find(item => item.date === dataDate)?.trades || [];

  const filteredTrades = dataToday
    .filter(trade => {
      if (filter === 'winners') return trade.Profit > 0;
      if (filter === 'losers') return trade.Profit < 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'pnl') return b.Profit - a.Profit;
      if (sortBy === 'size') return b.Size - a.Size;
      return 0;
    });

  const wins = dataToday.filter(trade => trade.Profit > 0).length;
  const losses = dataToday.filter(trade => trade.Profit < 0).length;
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0.0";
  const grossPnL = dataToday.reduce((sum, trade) => sum + trade.Profit, 0);
  const totalCommissions = dataToday.reduce((sum, trade) => sum + (Math.abs(trade.Commission) || 0), 0);
  const grossWins = dataToday.filter(t => t.Profit > 0).reduce((a, t) => a + t.Profit, 0);
  const grossLosses = Math.abs(dataToday.filter(t => t.Profit < 0).reduce((a, t) => a + t.Profit, 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : grossWins > 0 ? "∞" : "0.00";

  const totalLots = dataToday.reduce((sum, trade) => sum + (trade.Size || 0), 0);
  const avgDurationMins = dataToday.length > 0
    ? dataToday.reduce((sum, trade) => sum + calculateDurationMinutes(trade.OpenTime, trade.CloseTime), 0) / dataToday.length
    : 0;
  const bestTrade = dataToday.length > 0 ? Math.max(...dataToday.map(t => t.Profit)) : 0;
  const worstTrade = dataToday.length > 0 ? Math.min(...dataToday.map(t => t.Profit)) : 0;

  const primaryCurrency = dataToday[0]?.Currency || 'USD';
  const primaryMarketType = dataToday[0]?.marketType;
  const dayCurrencySymbol = getCurrencySymbol(primaryCurrency, primaryMarketType);
  const isINR = primaryCurrency === 'INR';

  const formatPnLValue = (value: number, decimals: number = 2): string => {
    const absValue = Math.abs(value);
    return absValue.toLocaleString(isINR ? 'en-IN' : 'en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString(isINR ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(5);
  };

  const toggleTradeExpand = (tradeId: string) => {
    setExpandedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const getTradeId = (trade: Trade, index: number): string => {
    return trade._id || trade.id || trade.tradeId || String(trade.Ticket) || `trade-${index}`;
  };

  const handleJournal = (trade: Trade) => {
    const tradeId = trade._id || trade.id || trade.tradeId || String(trade.Ticket);
    setShowTr();
    router.push(`/daily-journal?tradeId=${encodeURIComponent(tradeId)}`);
  };

  const GraphComp = () => {
    let cumulativeSum = 0;

    const data: ChartData[] = [
      { time: "00:00", value: 0 },
      ...dataToday.map(({ time, Profit }) => {
        cumulativeSum += Profit;
        return {
          time: time.substring(0, 5),
          value: Number(cumulativeSum.toFixed(2))
        };
      }),
    ];

    const calculateOffset = (data: ChartData[]): string => {
      const values = data.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);

      if (minValue >= 0) return "0%";
      if (maxValue <= 0) return "100%";

      return `${(maxValue / (maxValue - minValue)) * 100}%`;
    };

    const zeroOffset = calculateOffset(data);

    const checkValueStatus = (data: ChartData[]): string | boolean => {
      const hasPositive = data.some(d => d.value > 0);
      const hasNegative = data.some(d => d.value < 0);

      if (hasPositive && hasNegative) return "both";
      if (hasPositive) return true;
      if (hasNegative) return false;

      return "both";
    };

    const status = checkValueStatus(data);

    const getGradientId = (): string => {
      if (status === "both") return "mixedGradient";
      if (status === true) return "positiveGradient";
      if (status === false) return "negativeGradient";
      return "";
    };

    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="mixedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset={zeroOffset} stopColor="#10b981" stopOpacity={0.05} />
                <stop offset={zeroOffset} stopColor="#ef4444" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
              </linearGradient>

              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>

              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="rgba(255, 255, 255, 0.2)"
              tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255, 255, 255, 0.2)"
              tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 10 }}
              tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(12, 12, 12, 0.95)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                backdropFilter: "blur(16px)",
                padding: "10px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={status === true ? "#10b981" : status === false ? "#ef4444" : "#8b5cf6"}
              strokeWidth={2}
              fill={`url(#${getGradientId()})`}
              fillOpacity={1}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowTr();
      }
    };

    if (showTr) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [showTr, setShowTr]);

  const subtractOneDay = () => {
    const date = new Date(dataDate);
    date.setDate(date.getDate() - 1);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    setDateHard(`${yyyy}-${mm}-${dd}`);
  };

  const addOneDay = () => {
    const date = new Date(dataDate);
    date.setDate(date.getDate() + 1);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    setDateHard(`${yyyy}-${mm}-${dd}`);
  };

  const handleShare = async () => {
    const element = document.getElementById("trade-details");

    if (!element) return;

    const originalBackground = element.style.background;
    const originalBackdropFilter = element.style.backdropFilter;

    try {
      element.style.background = "#0a0a0a";
      element.style.backdropFilter = "none";

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        useCORS: true,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) throw new Error("Failed to create blob");

      const file = new File([blob], "trade-details.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Trade Details",
          text: "Here's the trade summary from my dashboard.",
        });
      } else {
        setAlertBoxG("Sharing not supported on this device/browser.", "error");
      }
    } catch (error) {
      console.error("Sharing failed", error);
    } finally {
      element.style.background = originalBackground;
      element.style.backdropFilter = originalBackdropFilter;
    }
  };

  const handleEdit = (data: Trade) => {
    setEditTradeData(data);
    setShowEditTradePopUp(true);
    setShowTr();
  };

  const handleDelete = async (tradeId: string) => {
    if (!selectedAccounts) {
      setAlertBoxG("Please select an account first", "error");
      return;
    }

    try {
      const requestData = {
        tokenn,
        tradeId,
        apiName: 'deleteManualUpload'
      };

      const response = await fetch(
        `/api/dashboard/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete trade.");
      }

      const data = await response.json();
      setAlertBoxG("Trade deleted successfully", "success");
      await setAccounts();
    } catch (error) {
      console.error("Error deleting trade:", error);
      setAlertBoxG("An error occurred while deleting the trade.", "error");
    }
  };

  const confirmDelete = (tradeId: string) => {
    setDeleteConfirmation({ show: true, tradeId });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.tradeId) {
      handleDelete(deleteConfirmation.tradeId);
    }
    setDeleteConfirmation({ show: false, tradeId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, tradeId: null });
  };

  const closePopup = () => {
    setShowTr();
  };

  const StatCard = ({ icon, label, value, valueColor = "text-white", iconBg = "bg-white/5", index = 0 }: {
    icon: any;
    label: string;
    value: string;
    valueColor?: string;
    iconBg?: string;
    index?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group relative bg-gradient-to-br from-white/[0.04] to-transparent rounded-xl p-3 border border-white/[0.06] hover:border-white/[0.12] hover:from-white/[0.06] transition-all duration-300"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0 border border-white/[0.04]`}>
          <FontAwesomeIcon icon={icon} className="text-white/60 text-xs" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-medium truncate">{label}</span>
          <span className={`text-base font-bold ${valueColor} truncate`}>{value}</span>
        </div>
      </div>
    </motion.div>
  );

  const MobileTradeCard = ({ trade, index }: { trade: Trade; index: number }) => {
    const tradeId = getTradeId(trade, index);
    const isExpanded = expandedTrades.has(tradeId);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-xl border border-white/[0.06] overflow-hidden"
      >
        <div
          className="p-4 cursor-pointer"
          onClick={() => toggleTradeExpand(tradeId)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-500/20">
                {trade.Item}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold border ${trade.Type?.toLowerCase() === 'buy'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                {trade.Type?.toLowerCase() === 'buy' ? 'Long' : 'Short'}
              </span>
            </div>
            <FontAwesomeIcon
              icon={isExpanded ? faChevronUp : faChevronDown}
              className="text-gray-400 text-xs"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${trade.Profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trade.Profit >= 0 ? '+' : '-'}{getCurrencySymbol(trade.Currency, trade.marketType)}{Math.abs(trade.Profit).toLocaleString(trade.Currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-gray-500 text-xs">{trade.OpenTime}</span>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/[0.06] overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Lot Size</span>
                    <p className="text-white font-medium">{(Number(trade.Size) || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration</span>
                    <p className="text-white font-medium">{calculateDuration(trade.OpenTime, trade.CloseTime)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Entry</span>
                    <p className="text-white font-medium">{formatPrice(trade.OpenPrice)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Exit</span>
                    <p className="text-white font-medium">{formatPrice(trade.ClosePrice)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ticket #</span>
                    <p className="text-white font-medium">{trade.Ticket}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Commission</span>
                    <p className="text-amber-400 font-medium">{getCurrencySymbol(trade.Currency, trade.marketType)}{Math.abs(Number(trade.Commission) || 0).toFixed(2)}</p>
                  </div>
                  {trade.Swap !== 0 && (
                    <div>
                      <span className="text-gray-500">Swap</span>
                      <p className="text-white font-medium">{getCurrencySymbol(trade.Currency, trade.marketType)}{(Number(trade.Swap) || 0).toFixed(2)}</p>
                    </div>
                  )}
                  {trade.accountName && (
                    <div>
                      <span className="text-gray-500">Account</span>
                      <p className="text-white font-medium truncate">{trade.accountName}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleJournal(trade); }}
                    className="flex-1 py-2 rounded-lg bg-white/[0.04] hover:bg-blue-500/15 flex items-center justify-center transition-all duration-200 border border-white/[0.04] hover:border-blue-500/30"
                  >
                    <FontAwesomeIcon icon={faBook} className="text-gray-400 hover:text-blue-400 text-xs" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(trade); }}
                    className="flex-1 py-2 rounded-lg bg-white/[0.04] hover:bg-emerald-500/15 flex items-center justify-center transition-all duration-200 border border-white/[0.04] hover:border-emerald-500/30"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="text-gray-400 hover:text-emerald-400 text-xs" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); confirmDelete(tradeId); }}
                    className="flex-1 py-2 rounded-lg bg-white/[0.04] hover:bg-red-500/15 flex items-center justify-center transition-all duration-200 border border-white/[0.04] hover:border-red-500/30"
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="text-gray-400 hover:text-red-400 text-xs" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {deleteConfirmation.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faTrashCan} className="text-red-400 text-xl" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">Delete Trade</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Are you sure you want to delete this trade? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 font-medium text-sm transition-all duration-200 border border-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium text-sm transition-all duration-200 border border-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            {dataToday.length === 0 ? (
              <motion.div
                ref={popupRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl bg-gradient-to-b from-[#161616] to-[#0c0c0c] rounded-3xl flex flex-col items-center justify-center p-8 border border-white/[0.06] shadow-2xl min-h-[400px] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                  onClick={closePopup}
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200 border border-white/[0.04]"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-gray-400 hover:text-white" />
                </button>

                <div className="flex flex-row items-center gap-3 mb-4">
                  <button
                    onClick={subtractOneDay}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200 border border-white/[0.04]"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 text-xs" />
                  </button>
                  <span className="text-gray-400 text-sm font-medium">{formatDate(dataDate)}</span>
                  <button
                    onClick={addOneDay}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200 border border-white/[0.04]"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
                  </button>
                </div>

                <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4 border border-white/[0.04]">
                  <img src="/favicon.png" alt="logo" className="w-12 h-12 opacity-60" />
                </div>

                <p className="text-gray-500 text-sm font-medium mb-6">No trades recorded for this day</p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    closePopup();
                    setTimeout(() => setAddTrades(), 300);
                  }}
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  Add Trade
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                ref={popupRef}
                id="trade-details"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-5xl max-h-[90vh] bg-gradient-to-b from-[#151515] to-[#0a0a0a] rounded-2xl md:rounded-3xl flex flex-col border border-white/[0.06] shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/[0.04] gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-3 md:gap-4">
                    <h2 className="text-base md:text-lg font-bold text-white tracking-tight">Trade Details</h2>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <button
                        onClick={subtractOneDay}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200 border border-white/[0.04]"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 text-[10px]" />
                      </button>
                      <div className="px-2 md:px-3 py-1 md:py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.04]">
                        <span className="text-gray-300 text-[10px] md:text-xs font-medium">{formatDate(dataDate)}</span>
                      </div>
                      <button
                        onClick={addOneDay}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200 border border-white/[0.04]"
                      >
                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-[10px]" />
                      </button>
                    </div>
                    <button
                      onClick={closePopup}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-red-500/20 flex items-center justify-center transition-all duration-200 group sm:hidden border border-white/[0.04]"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-gray-400 group-hover:text-red-400 text-xs" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl ${grossPnL >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      <span className={`text-[11px] md:text-sm font-bold ${grossPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {grossPnL >= 0 ? '+' : '-'}{dayCurrencySymbol}{formatPnLValue(grossPnL, 0)}
                      </span>
                    </div>

                    <div className="px-2 md:px-3 py-1.5 md:py-2 bg-white/[0.04] rounded-xl border border-white/[0.04]">
                      <span className="text-gray-400 text-[10px] md:text-xs font-medium">{dataToday.length}</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        closePopup();
                        setTimeout(() => setAddTrades(), 300);
                      }}
                      className="flex items-center gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-bold rounded-xl border border-emerald-500/20 transition-all duration-200"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-[10px] md:text-xs" />
                      <span className="whitespace-nowrap">Add Trades</span>
                    </motion.button>

                    <button
                      onClick={handleShare}
                      className="w-7 h-7 md:w-9 md:h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200 border border-white/[0.04]"
                    >
                      <FontAwesomeIcon icon={faShareNodes} className="text-gray-400 hover:text-white text-[10px] md:text-sm" />
                    </button>

                    <button
                      onClick={closePopup}
                      className="w-7 h-7 md:w-9 md:h-9 rounded-xl bg-white/[0.04] hover:bg-red-500/20 flex items-center justify-center transition-all duration-200 group hidden sm:flex border border-white/[0.04]"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-gray-400 group-hover:text-red-400 text-[10px] md:text-sm" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-6">
                  <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-5 mb-4 md:mb-6">
                    <div className="w-full md:col-span-4 bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/[0.06] h-36 md:h-48">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-medium">Cumulative P&L</span>
                        <div className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-semibold ${grossPnL >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                          {grossPnL >= 0 ? '+' : '-'}{dayCurrencySymbol}{formatPnLValue(grossPnL)}
                        </div>
                      </div>
                      <div className="h-24 md:h-36">
                        <GraphComp />
                      </div>
                    </div>

                    <div className="w-full md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                      <StatCard
                        icon={faChartLine}
                        label="Gross P&L"
                        value={`${dayCurrencySymbol}${formatPnLValue(grossPnL)}`}
                        valueColor={grossPnL >= 0 ? "text-emerald-400" : "text-red-400"}
                        iconBg={grossPnL >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
                        index={0}
                      />
                      <StatCard
                        icon={faTrophy}
                        label="Winners"
                        value={wins.toString()}
                        valueColor="text-emerald-400"
                        iconBg="bg-emerald-500/10"
                        index={1}
                      />
                      <StatCard
                        icon={faSkullCrossbones}
                        label="Losers"
                        value={losses.toString()}
                        valueColor="text-red-400"
                        iconBg="bg-red-500/10"
                        index={2}
                      />
                      <StatCard
                        icon={faPercent}
                        label="Win Rate"
                        value={`${winRate}%`}
                        valueColor={parseFloat(winRate) >= 50 ? "text-emerald-400" : "text-red-400"}
                        iconBg={parseFloat(winRate) >= 50 ? "bg-emerald-500/10" : "bg-red-500/10"}
                        index={3}
                      />
                      <StatCard
                        icon={faLayerGroup}
                        label="Total Lots"
                        value={(Number(totalLots) || 0).toFixed(2)}
                        valueColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        index={4}
                      />
                      <StatCard
                        icon={faClock}
                        label="Avg Duration"
                        value={formatAvgDuration(avgDurationMins)}
                        valueColor="text-purple-400"
                        iconBg="bg-purple-500/10"
                        index={5}
                      />
                      <StatCard
                        icon={faArrowUp}
                        label="Best Trade"
                        value={`${dayCurrencySymbol}${formatPnLValue(bestTrade)}`}
                        valueColor="text-emerald-400"
                        iconBg="bg-emerald-500/10"
                        index={6}
                      />
                      <StatCard
                        icon={faArrowDown}
                        label="Worst Trade"
                        value={dataToday.length <= 1 ? "N/A" : `${worstTrade >= 0 ? '+' : '-'}${dayCurrencySymbol}${formatPnLValue(Math.abs(worstTrade))}`}
                        valueColor={dataToday.length <= 1 ? "text-gray-400" : worstTrade >= 0 ? "text-emerald-400" : "text-red-400"}
                        iconBg={dataToday.length <= 1 ? "bg-gray-500/10" : worstTrade >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
                        index={7}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/[0.06]">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${filter === 'all'
                          ? 'bg-white/[0.1] text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter('winners')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${filter === 'winners'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                      >
                        Winners
                      </button>
                      <button
                        onClick={() => setFilter('losers')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${filter === 'losers'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                      >
                        Losers
                      </button>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.06] text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faSort} className="text-[10px]" />
                        <span>Sort: {sortBy === 'time' ? 'By Time' : sortBy === 'pnl' ? 'By P&L' : 'By Size'}</span>
                        <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                      </button>

                      <AnimatePresence>
                        {showSortDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/[0.08] rounded-lg overflow-hidden z-10 min-w-[120px]"
                          >
                            <button
                              onClick={() => { setSortBy('time'); setShowSortDropdown(false); }}
                              className={`w-full px-3 py-2 text-xs text-left transition-colors ${sortBy === 'time' ? 'bg-white/[0.1] text-white' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'}`}
                            >
                              By Time
                            </button>
                            <button
                              onClick={() => { setSortBy('pnl'); setShowSortDropdown(false); }}
                              className={`w-full px-3 py-2 text-xs text-left transition-colors ${sortBy === 'pnl' ? 'bg-white/[0.1] text-white' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'}`}
                            >
                              By P&L
                            </button>
                            <button
                              onClick={() => { setSortBy('size'); setShowSortDropdown(false); }}
                              className={`w-full px-3 py-2 text-xs text-left transition-colors ${sortBy === 'size' ? 'bg-white/[0.1] text-white' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'}`}
                            >
                              By Size
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <span className="text-gray-500 text-xs ml-auto">
                      {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="hidden md:block bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl md:rounded-2xl border border-white/[0.06] overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap w-8"></th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Time</th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Symbol</th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Lot Size</th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Entry</th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Exit</th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Duration</th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Side</th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Net P&L</th>
                            <th className="px-3 md:px-4 py-3 md:py-4 text-center text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredTrades.map((data, index) => {
                            const tradeId = getTradeId(data, index);
                            const isExpanded = expandedTrades.has(tradeId);

                            return (
                              <React.Fragment key={tradeId}>
                                <motion.tr
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150 group cursor-pointer"
                                  onClick={() => toggleTradeExpand(tradeId)}
                                >
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <FontAwesomeIcon icon={faChevronDown} className="text-gray-500 text-[10px]" />
                                    </motion.div>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <span className="text-gray-300 text-xs md:text-sm font-medium whitespace-nowrap">{data.OpenTime}</span>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <span className="inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] md:text-xs font-semibold border border-emerald-500/20">
                                      {data.Item}
                                    </span>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <span className="text-gray-300 text-xs md:text-sm font-medium">{(Number(data.Size) || 0).toFixed(2)}</span>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <span className="text-gray-300 text-xs md:text-sm font-medium">{formatPrice(data.OpenPrice)}</span>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <span className="text-gray-300 text-xs md:text-sm font-medium">{formatPrice(data.ClosePrice)}</span>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <span className="text-purple-400 text-xs md:text-sm font-medium">{calculateDuration(data.OpenTime, data.CloseTime)}</span>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <span className={`inline-flex items-center px-2 md:px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-semibold border ${data.Type?.toLowerCase() === 'buy'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                                      }`}>
                                      {data.Type?.toLowerCase() === 'buy' ? 'Long' : 'Short'}
                                    </span>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <span className={`text-xs md:text-sm font-bold whitespace-nowrap ${data.Profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                      {data.Profit >= 0 ? '+' : '-'}{getCurrencySymbol(data.Currency, data.marketType)}{Math.abs(data.Profit).toLocaleString(data.Currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                  <td className="px-3 md:px-4 py-3 md:py-4">
                                    <div className="flex items-center justify-center gap-1.5 md:gap-2" onClick={(e) => e.stopPropagation()}>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleJournal(data)}
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/[0.04] hover:bg-blue-500/15 flex items-center justify-center transition-all duration-200 border border-white/[0.04] hover:border-blue-500/30"
                                      >
                                        <FontAwesomeIcon icon={faBook} className="text-gray-400 hover:text-blue-400 text-[10px] md:text-xs" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleEdit(data)}
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/[0.04] hover:bg-emerald-500/15 flex items-center justify-center transition-all duration-200 border border-white/[0.04] hover:border-emerald-500/30"
                                      >
                                        <FontAwesomeIcon icon={faPenToSquare} className="text-gray-400 hover:text-emerald-400 text-[10px] md:text-xs" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => confirmDelete(data._id || data.id || data.tradeId || String(data.Ticket))}
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/[0.04] hover:bg-red-500/15 flex items-center justify-center transition-all duration-200 border border-white/[0.04] hover:border-red-500/30"
                                      >
                                        <FontAwesomeIcon icon={faTrashCan} className="text-gray-400 hover:text-red-400 text-[10px] md:text-xs" />
                                      </motion.button>
                                    </div>
                                  </td>
                                </motion.tr>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <tr key={`${tradeId}-expanded`}>
                                      <td colSpan={10} className="p-0">
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.06]">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                              <div>
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Ticket #</span>
                                                <span className="text-sm text-white font-medium">{data.Ticket}</span>
                                              </div>
                                              {data.accountName && (
                                                <div>
                                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Account</span>
                                                  <span className="text-sm text-white font-medium">{data.accountName}</span>
                                                </div>
                                              )}
                                              <div>
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Commission</span>
                                                <span className="text-sm text-amber-400 font-medium">{getCurrencySymbol(data.Currency, data.marketType)}{Math.abs(Number(data.Commission) || 0).toFixed(2)}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Swap</span>
                                                <span className="text-sm text-white font-medium">{getCurrencySymbol(data.Currency, data.marketType)}{(Number(data.Swap) || 0).toFixed(2)}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Entry Time</span>
                                                <span className="text-sm text-white font-medium">{data.OpenTime}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Exit Time</span>
                                                <span className="text-sm text-white font-medium">{data.CloseTime}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Gross P&L</span>
                                                <span className={`text-sm font-medium ${data.Profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                  {data.Profit >= 0 ? '+' : ''}{getCurrencySymbol(data.Currency, data.marketType)}{(Number(data.Profit) || 0).toFixed(2)}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Net P&L</span>
                                                <span className={`text-sm font-medium ${(data.Profit - Math.abs(data.Commission)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                  {(data.Profit - Math.abs(data.Commission)) >= 0 ? '+' : ''}{getCurrencySymbol(data.Currency, data.marketType)}{((Number(data.Profit) || 0) - Math.abs(Number(data.Commission) || 0)).toFixed(2)}
                                                </span>
                                              </div>
                                            </div>
                                            {data.notes && (
                                              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-2">Notes</span>
                                                <p className="text-sm text-gray-300">{data.notes}</p>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      </td>
                                    </tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="md:hidden space-y-3">
                    {filteredTrades.map((trade, index) => (
                      <MobileTradeCard key={getTradeId(trade, index)} trade={trade} index={index} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CalendarPopup;
