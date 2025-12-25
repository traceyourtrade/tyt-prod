'use client';

import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
  faCoins,
  faSkullCrossbones,
  faScaleBalanced
} from "@fortawesome/free-solid-svg-icons";

import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts";
import { useDataStore } from "@/store/store";


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
  const { bkurl } = useDataStore();
  const tokenn = Cookies.get("Trace Your Trades");
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

  const StatCard = ({ icon, label, value, valueColor = "text-white", iconBg = "bg-white/5" }: { 
    icon: any; 
    label: string; 
    value: string; 
    valueColor?: string;
    iconBg?: string;
  }) => (
    <div className="group relative bg-gradient-to-br from-white/[0.04] to-transparent rounded-xl p-3 border border-white/[0.06] hover:border-white/[0.12] hover:from-white/[0.06] transition-all duration-300">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0 border border-white/[0.04]`}>
          <FontAwesomeIcon icon={icon} className="text-white/60 text-xs" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-medium truncate">{label}</span>
          <span className={`text-base font-bold ${valueColor} truncate`}>{value}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 ${showTr ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {dataToday.length === 0 ? (
        <div 
          ref={popupRef} 
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
          
          <button
            onClick={() => {
              closePopup();
              setTimeout(() => setAddTrades(), 300);
            }}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Trade
          </button>
        </div>
      ) : (
        <div 
          ref={popupRef} 
          id="trade-details"
          className="w-full max-w-5xl max-h-[90vh] bg-gradient-to-b from-[#151515] to-[#0a0a0a] rounded-2xl md:rounded-3xl flex flex-col border border-white/[0.06] shadow-2xl overflow-hidden"
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
                  {grossPnL >= 0 ? '+' : ''}${Math.abs(grossPnL).toFixed(0)}
                </span>
              </div>
              
              <div className="px-2 md:px-3 py-1.5 md:py-2 bg-white/[0.04] rounded-xl border border-white/[0.04]">
                <span className="text-gray-400 text-[10px] md:text-xs font-medium">{dataToday.length}</span>
              </div>

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
              <div className="w-full md:col-span-5 bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/[0.06] h-36 md:h-48">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-medium">Cumulative P&L</span>
                  <div className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-semibold ${grossPnL >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                    {grossPnL >= 0 ? '+' : ''}{grossPnL.toFixed(2)}
                  </div>
                </div>
                <div className="h-24 md:h-36">
                  <GraphComp />
                </div>
              </div>

              <div className="w-full md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <StatCard 
                  icon={faChartLine} 
                  label="Gross P&L" 
                  value={`$${grossPnL.toFixed(2)}`}
                  valueColor={grossPnL >= 0 ? "text-emerald-400" : "text-red-400"}
                  iconBg={grossPnL >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
                />
                <StatCard 
                  icon={faTrophy} 
                  label="Winners" 
                  value={wins.toString()}
                  valueColor="text-emerald-400"
                  iconBg="bg-emerald-500/10"
                />
                <StatCard 
                  icon={faCoins} 
                  label="Commissions" 
                  value={`$${totalCommissions.toFixed(2)}`}
                  valueColor="text-amber-400"
                  iconBg="bg-amber-500/10"
                />
                <StatCard 
                  icon={faPercent} 
                  label="Win Rate" 
                  value={`${winRate}%`}
                  valueColor={parseFloat(winRate) >= 50 ? "text-emerald-400" : "text-red-400"}
                  iconBg={parseFloat(winRate) >= 50 ? "bg-emerald-500/10" : "bg-red-500/10"}
                />
                <StatCard 
                  icon={faSkullCrossbones} 
                  label="Losers" 
                  value={losses.toString()}
                  valueColor="text-red-400"
                  iconBg="bg-red-500/10"
                />
                <StatCard 
                  icon={faScaleBalanced} 
                  label="Profit Factor" 
                  value={profitFactor.toString()}
                  valueColor={parseFloat(profitFactor) >= 1 || profitFactor === "∞" ? "text-emerald-400" : "text-red-400"}
                  iconBg="bg-purple-500/10"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl md:rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-3 md:px-5 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Time</th>
                      <th className="px-3 md:px-5 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Symbol</th>
                      <th className="px-3 md:px-5 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Side</th>
                      <th className="px-3 md:px-5 py-3 md:py-4 text-left text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Net P&L</th>
                      <th className="px-3 md:px-5 py-3 md:py-4 text-center text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 font-semibold whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dataToday.map((data, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150 group"
                      >
                        <td className="px-3 md:px-5 py-3 md:py-4">
                          <span className="text-gray-300 text-xs md:text-sm font-medium whitespace-nowrap">{data.OpenTime}</span>
                        </td>
                        <td className="px-3 md:px-5 py-3 md:py-4">
                          <span className="inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] md:text-xs font-semibold border border-emerald-500/20">
                            {data.Item}
                          </span>
                        </td>
                        <td className="px-3 md:px-5 py-3 md:py-4">
                          <span className={`inline-flex items-center px-2 md:px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-semibold border ${
                            data.Type?.toLowerCase() === 'buy' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {data.Type?.toLowerCase() === 'buy' ? 'Long' : 'Short'}
                          </span>
                        </td>
                        <td className="px-3 md:px-5 py-3 md:py-4">
                          <span className={`text-xs md:text-sm font-bold whitespace-nowrap ${data.Profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {data.Profit >= 0 ? '+' : ''}{data.Profit < 0 ? `-$${Math.abs(data.Profit).toFixed(2)}` : `$${data.Profit.toFixed(2)}`}
                          </span>
                        </td>
                        <td className="px-3 md:px-5 py-3 md:py-4">
                          <div className="flex items-center justify-center gap-1.5 md:gap-2">
                            <button 
                              onClick={() => handleEdit(data)}
                              className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/[0.04] hover:bg-emerald-500/15 flex items-center justify-center transition-all duration-200 border border-white/[0.04] hover:border-emerald-500/30"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="text-gray-400 hover:text-emerald-400 text-[10px] md:text-xs" />
                            </button>
                            <button 
                              onClick={() => confirmDelete(data.id)}
                              className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/[0.04] hover:bg-red-500/15 flex items-center justify-center transition-all duration-200 border border-white/[0.04] hover:border-red-500/30"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="text-gray-400 hover:text-red-400 text-[10px] md:text-xs" />
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
