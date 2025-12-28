'use client';

import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faScaleBalanced,
  faArrowTrendUp,
  faArrowTrendDown,
  faCoins
} from "@fortawesome/free-solid-svg-icons";

import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts";


interface Trade {
  id: string;
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
  accountName?: string;
  accountId?: string;
}

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

const CalendarPopup = () => {
  const { showTr, setShowTr, dataDate, setDateHard, setAddTrades, setShowEditTradePopUp, setEditTradeData } = calendarPopUp();
  const { setAlertBoxG } = notifications();
  const { selectedAccounts } = useModeFilteredAccounts();
  const tokenn = Cookies.get("ProJournX");
  const popupRef = useRef<HTMLDivElement>(null);

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

  const wins = dataToday.filter(trade => trade.Profit > 0).length;
  const losses = dataToday.filter(trade => trade.Profit < 0).length;
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0.0";
  const grossPnL = dataToday.reduce((sum, trade) => sum + trade.Profit, 0);
  const totalCommissions = dataToday.reduce((sum, trade) => sum + (Math.abs(trade.Commission) || 0), 0);
  const grossWins = dataToday.filter(t => t.Profit > 0).reduce((a, t) => a + t.Profit, 0);
  const grossLosses = Math.abs(dataToday.filter(t => t.Profit < 0).reduce((a, t) => a + t.Profit, 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : grossWins > 0 ? "∞" : "0.00";
  const avgWin = wins > 0 ? (grossWins / wins).toFixed(2) : "0.00";
  const avgLoss = losses > 0 ? (grossLosses / losses).toFixed(2) : "0.00";
  const isProfit = grossPnL >= 0;

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

    const strokeColor = isProfit ? "#10b981" : "#ef4444";
    const gradientId = isProfit ? "profitGradient" : "lossGradient";

    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#f87171" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="transparent"
              tick={{ fill: "rgba(255, 255, 255, 0.35)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "rgba(255, 255, 255, 0.35)", fontSize: 9 }}
              tickFormatter={(value) => `$${value}`}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip 
              contentStyle={{ 
                background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)",
                color: "white", 
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
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
      element.style.background = "#0f172a";
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
        apiName:'deleteManualUpload'
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
    } catch (error) {
      console.error("Error deleting trade:", error);
      setAlertBoxG("An error occurred while deleting the trade.", "error");
    }
  };

  const confirmDelete = (tradeId: string) => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      handleDelete(tradeId);
    }
  };

  const closePopup = () => {
    setShowTr();
  };

  const StatCard = ({ 
    icon, 
    label, 
    value, 
    subtext,
    variant = 'default' 
  }: { 
    icon: any; 
    label: string; 
    value: string;
    subtext?: string;
    variant?: 'profit' | 'loss' | 'neutral' | 'gold' | 'default';
  }) => {
    const variantStyles = {
      profit: {
        bg: 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent',
        border: 'border-emerald-500/20',
        iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10',
        iconColor: 'text-emerald-400',
        valueColor: 'text-emerald-400',
        glow: 'hover:shadow-emerald-500/10'
      },
      loss: {
        bg: 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent',
        border: 'border-red-500/20',
        iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-500/10',
        iconColor: 'text-red-400',
        valueColor: 'text-red-400',
        glow: 'hover:shadow-red-500/10'
      },
      neutral: {
        bg: 'bg-gradient-to-br from-blue-500/8 via-indigo-500/4 to-transparent',
        border: 'border-blue-500/15',
        iconBg: 'bg-gradient-to-br from-blue-500/15 to-indigo-500/8',
        iconColor: 'text-blue-400',
        valueColor: 'text-blue-400',
        glow: 'hover:shadow-blue-500/10'
      },
      gold: {
        bg: 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent',
        border: 'border-amber-500/20',
        iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10',
        iconColor: 'text-amber-400',
        valueColor: 'text-amber-400',
        glow: 'hover:shadow-amber-500/10'
      },
      default: {
        bg: 'bg-gradient-to-br from-white/[0.04] to-transparent',
        border: 'border-white/[0.06]',
        iconBg: 'bg-white/[0.06]',
        iconColor: 'text-gray-400',
        valueColor: 'text-white',
        glow: 'hover:shadow-white/5'
      }
    };

    const styles = variantStyles[variant];

    return (
      <div className={`group relative ${styles.bg} rounded-xl p-4 border ${styles.border} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${styles.glow}`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 ${styles.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
            <FontAwesomeIcon icon={icon} className={`${styles.iconColor} text-sm`} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-0.5">{label}</span>
            <span className={`text-xl font-bold ${styles.valueColor} truncate`}>{value}</span>
            {subtext && <span className="text-[10px] text-gray-500 mt-0.5">{subtext}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 transition-all duration-300 ${showTr ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {dataToday.length === 0 ? (
        <div 
          ref={popupRef} 
          className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl flex flex-col items-center justify-center p-8 border border-white/[0.08] shadow-2xl min-h-[320px] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />
          
          <button
            onClick={closePopup}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200 hover:scale-105 z-10"
          >
            <FontAwesomeIcon icon={faXmark} className="text-gray-400 hover:text-white text-sm" />
          </button>

          <div className="flex items-center gap-2 mb-6 z-10">
            <button
              onClick={subtractOneDay}
              className="w-7 h-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200 hover:scale-105"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 text-xs" />
            </button>
            <span className="text-gray-300 text-sm font-medium px-3 py-1.5 bg-white/[0.05] rounded-lg">{formatDate(dataDate)}</span>
            <button
              onClick={addOneDay}
              className="w-7 h-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200 hover:scale-105"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
            </button>
          </div>

          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 flex items-center justify-center mb-4 border border-blue-500/10 z-10">
            <img src="/favicon.png" alt="logo" className="w-10 h-10 opacity-60" />
          </div>
          
          <p className="text-gray-400 text-sm mb-5 z-10">No trades recorded for this day</p>
          
          <button
            onClick={() => {
              closePopup();
              setTimeout(() => setAddTrades(), 300);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105 z-10"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Trade
          </button>
        </div>
      ) : (
        <div 
          ref={popupRef} 
          id="trade-details"
          className="w-full max-w-4xl max-h-[85vh] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl flex flex-col border border-white/[0.08] shadow-2xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
          <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${isProfit ? 'via-emerald-500/50' : 'via-red-500/50'} to-transparent`} />
          
          {/* Glassmorphic Header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-white">Daily Summary</h2>
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
                <button
                  onClick={subtractOneDay}
                  className="w-7 h-7 rounded-md hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 text-xs" />
                </button>
                <span className="text-gray-200 text-sm font-medium px-3 min-w-[100px] text-center">{formatDate(dataDate)}</span>
                <button
                  onClick={addOneDay}
                  className="w-7 h-7 rounded-md hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200 hover:scale-105"
                title="Share"
              >
                <FontAwesomeIcon icon={faShareNodes} className="text-gray-400 text-sm" />
              </button>
              <button
                onClick={closePopup}
                className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-red-500/20 flex items-center justify-center transition-all duration-200 hover:scale-105 group"
              >
                <FontAwesomeIcon icon={faXmark} className="text-gray-400 group-hover:text-red-400 text-sm" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative flex-1 overflow-y-auto p-5">
            {/* Two-Column Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
              {/* Left: Main P&L Card with Chart */}
              <div className={`lg:col-span-2 relative overflow-hidden rounded-xl p-5 border ${isProfit ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/50 border-emerald-500/20' : 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-slate-900/50 border-red-500/20'}`}>
                <div className={`absolute inset-0 ${isProfit ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent' : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent'}`} />
                
                <div className="relative flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faChartLine} className={`${isProfit ? 'text-emerald-400' : 'text-red-400'} text-[10px]`} />
                      Net P&L
                    </p>
                    <p className={`text-3xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'} drop-shadow-sm`}>
                      {isProfit ? '+' : '-'}${Math.abs(grossPnL).toFixed(2)}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${isProfit ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    <FontAwesomeIcon icon={isProfit ? faArrowTrendUp : faArrowTrendDown} className="text-[10px]" />
                    {dataToday.length} trade{dataToday.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="relative h-32">
                  <GraphComp />
                </div>
              </div>

              {/* Right: KPI Grid */}
              <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard 
                  icon={faPercent}
                  label="Win Rate"
                  value={`${winRate}%`}
                  subtext={`${wins}W / ${losses}L`}
                  variant={parseFloat(winRate) >= 50 ? 'profit' : 'loss'}
                />
                <StatCard 
                  icon={faScaleBalanced}
                  label="Profit Factor"
                  value={profitFactor}
                  subtext="Risk/Reward"
                  variant={parseFloat(profitFactor) >= 1 || profitFactor === "∞" ? 'profit' : 'loss'}
                />
                <StatCard 
                  icon={faArrowTrendUp}
                  label="Avg Win"
                  value={`$${avgWin}`}
                  subtext={`${wins} trades`}
                  variant="profit"
                />
                <StatCard 
                  icon={faArrowTrendDown}
                  label="Avg Loss"
                  value={`$${avgLoss}`}
                  subtext={`${losses} trades`}
                  variant="loss"
                />
                <StatCard 
                  icon={faTrophy}
                  label="Gross Profit"
                  value={`+$${grossWins.toFixed(2)}`}
                  subtext={`${wins} winners`}
                  variant="profit"
                />
                <StatCard 
                  icon={faCoins}
                  label="Commissions"
                  value={`$${totalCommissions.toFixed(2)}`}
                  subtext="Total fees"
                  variant="gold"
                />
              </div>
            </div>

            {/* Trades Table */}
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Trades
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-gray-500 font-medium">Time</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-gray-500 font-medium">Symbol</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-gray-500 font-medium">Side</th>
                      <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wide text-gray-500 font-medium">P&L</th>
                      <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataToday.map((data, index) => (
                      <tr 
                        key={index} 
                        className={`${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'} hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-transparent transition-all duration-200 group`}
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-gray-300 text-sm">{data.OpenTime}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-white text-sm font-semibold">{data.Item}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                            data.Type?.toLowerCase() === 'buy' 
                              ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-gradient-to-r from-red-500/15 to-rose-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {data.Type?.toLowerCase() === 'buy' ? 'Long' : 'Short'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`text-sm font-bold ${data.Profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {data.Profit >= 0 ? '+' : '-'}${Math.abs(data.Profit).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(data)}
                              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-blue-500/15 flex items-center justify-center transition-all duration-200 hover:scale-110"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="text-gray-400 hover:text-blue-400 text-xs" />
                            </button>
                            <button 
                              onClick={() => confirmDelete(data.id)}
                              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-red-500/15 flex items-center justify-center transition-all duration-200 hover:scale-110"
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="text-gray-400 hover:text-red-400 text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPopup;
