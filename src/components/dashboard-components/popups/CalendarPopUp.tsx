'use client';

import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Cookies from "js-cookie";
import Image from "next/image";
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
  faArrowTrendUp,
  faArrowTrendDown,
  faClock,
  faLayerGroup
} from "@fortawesome/free-solid-svg-icons";

import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import { useModeFilteredAccounts } from "@/hooks/useModeFilteredAccounts";
import { useDataStore } from "@/store/store";

import Logo from "@/images/Logo.png";

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
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>

              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.5} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" vertical={false} />
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
                backgroundColor: "rgba(10, 10, 10, 0.95)", 
                color: "white", 
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                backdropFilter: "blur(20px)",
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
              strokeWidth={2.5}
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
        document.body.classList.remove("no-scroll");
      }
    };

    if (showTr) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    document.body.classList.remove("no-scroll");
  };

  const StatPill = ({ icon, label, value, color = "gray" }: { 
    icon: any; 
    label: string; 
    value: string; 
    color?: "green" | "red" | "amber" | "purple" | "blue" | "gray";
  }) => {
    const colorClasses = {
      green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      red: "text-red-400 bg-red-500/10 border-red-500/20",
      amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      gray: "text-gray-400 bg-white/5 border-white/10",
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClasses[color]} backdrop-blur-sm`}>
        <FontAwesomeIcon icon={icon} className="text-xs opacity-70" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider opacity-60">{label}</span>
          <span className="text-sm font-bold">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 ${showTr ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {dataToday.length === 0 ? (
        <div 
          ref={popupRef} 
          className="w-full max-w-lg bg-gradient-to-b from-[#181818] to-[#0f0f0f] rounded-3xl flex flex-col items-center justify-center p-10 border border-white/[0.06] shadow-2xl min-h-[400px] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <button
            onClick={closePopup}
            className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200 border border-white/5"
          >
            <FontAwesomeIcon icon={faXmark} className="text-gray-400 hover:text-white text-sm" />
          </button>

          <div className="flex flex-row items-center gap-2 mb-6">
            <button
              onClick={subtractOneDay}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 text-xs" />
            </button>
            <span className="text-white/70 text-sm font-medium px-3">{formatDate(dataDate)}</span>
            <button
              onClick={addOneDay}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
            </button>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-5 border border-white/5">
            <Image src={Logo} alt="logo" width={48} height={48} className="opacity-50" />
          </div>
          
          <p className="text-gray-500 text-sm font-medium mb-8">No trades recorded for this day</p>
          
          <button
            onClick={() => {
              closePopup();
              setTimeout(() => setAddTrades(), 300);
            }}
            className="group flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Trade
          </button>
        </div>
      ) : (
        <div 
          ref={popupRef} 
          id="trade-details"
          className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-[#141414] to-[#0a0a0a] rounded-2xl md:rounded-3xl flex flex-col border border-white/[0.06] shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/50 via-blue-500/50 to-purple-500/50" />
          
          <div className="relative px-5 md:px-8 py-5 md:py-6 border-b border-white/[0.04]">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={subtractOneDay}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 text-xs" />
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Trading Day</span>
                  <span className="text-white font-semibold text-sm">{formatDate(dataDate)}</span>
                </div>
                <button
                  onClick={addOneDay}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200 border border-white/5"
                >
                  <FontAwesomeIcon icon={faShareNodes} className="text-gray-400 hover:text-white text-sm" />
                </button>
                <button
                  onClick={closePopup}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all duration-200 border border-white/5 group"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-gray-400 group-hover:text-red-400 text-sm" />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
              <div className="flex items-baseline gap-3">
                <div className={`relative ${grossPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className="text-4xl md:text-5xl font-bold tracking-tight">
                    {grossPnL >= 0 ? '+' : '-'}${Math.abs(grossPnL).toFixed(2)}
                  </span>
                  <div className={`absolute -inset-4 rounded-2xl blur-2xl opacity-20 -z-10 ${grossPnL >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-gray-500 text-[10px]" />
                  <span className="text-gray-400 text-xs font-medium">{dataToday.length} trades</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatPill 
                  icon={faTrophy} 
                  label="Win Rate" 
                  value={`${winRate}%`}
                  color={parseFloat(winRate) >= 50 ? "green" : "red"}
                />
                <StatPill 
                  icon={faArrowTrendUp} 
                  label="Winners" 
                  value={wins.toString()}
                  color="green"
                />
                <StatPill 
                  icon={faArrowTrendDown} 
                  label="Losers" 
                  value={losses.toString()}
                  color="red"
                />
                <StatPill 
                  icon={faPercent} 
                  label="Profit Factor" 
                  value={profitFactor.toString()}
                  color={parseFloat(profitFactor) >= 1 || profitFactor === "∞" ? "purple" : "gray"}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04] mb-5 h-48 md:h-56">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Cumulative P&L</span>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${grossPnL >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {grossPnL >= 0 ? '+' : ''}{grossPnL.toFixed(2)}
                </div>
              </div>
              <div className="h-32 md:h-40">
                <GraphComp />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-3">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Today's Trades</span>
                <span className="text-[10px] text-gray-600">{dataToday.length} total</span>
              </div>

              {dataToday.map((data, index) => (
                <div 
                  key={index}
                  className={`group relative bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/[0.04] hover:border-white/[0.08] p-4 transition-all duration-200 overflow-hidden`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${data.Profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  
                  <div className="flex items-center justify-between pl-3">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold text-sm">{data.Item}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            data.Type?.toLowerCase() === 'buy' 
                              ? 'bg-emerald-500/15 text-emerald-400' 
                              : 'bg-red-500/15 text-red-400'
                          }`}>
                            {data.Type?.toLowerCase() === 'buy' ? 'LONG' : 'SHORT'}
                          </span>
                          <span className="text-gray-500 text-[11px] flex items-center gap-1">
                            <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                            {data.OpenTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`text-lg font-bold ${data.Profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {data.Profit >= 0 ? '+' : ''}{data.Profit < 0 ? `-$${Math.abs(data.Profit).toFixed(2)}` : `$${data.Profit.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => handleEdit(data)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center transition-all duration-200"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="text-gray-400 hover:text-emerald-400 text-xs" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(data.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all duration-200"
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="text-gray-400 hover:text-red-400 text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPopup;
