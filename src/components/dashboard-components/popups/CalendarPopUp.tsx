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
  faPlus
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

    const isPositive = grossPnL >= 0;
    const strokeColor = isPositive ? "#10b981" : "#ef4444";

    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="transparent"
              tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 9 }}
              tickFormatter={(value) => `$${value}`}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgba(0, 0, 0, 0.9)", 
                color: "white", 
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px"
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#chartGradient)"
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

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-all duration-300 ${showTr ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {dataToday.length === 0 ? (
        <div 
          ref={popupRef} 
          className="w-full max-w-md bg-[#141414] rounded-2xl flex flex-col items-center justify-center p-8 border border-white/[0.08] shadow-2xl min-h-[320px] relative"
        >
          <button
            onClick={closePopup}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-gray-400 hover:text-white text-sm" />
          </button>

          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={subtractOneDay}
              className="w-7 h-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 text-xs" />
            </button>
            <span className="text-gray-300 text-sm font-medium px-2">{formatDate(dataDate)}</span>
            <button
              onClick={addOneDay}
              className="w-7 h-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
            </button>
          </div>

          <div className="w-16 h-16 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4">
            <img src="/favicon.png" alt="logo" className="w-10 h-10 opacity-50" />
          </div>
          
          <p className="text-gray-500 text-sm mb-5">No trades recorded for this day</p>
          
          <button
            onClick={() => {
              closePopup();
              setTimeout(() => setAddTrades(), 300);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Trade
          </button>
        </div>
      ) : (
        <div 
          ref={popupRef} 
          id="trade-details"
          className="w-full max-w-4xl max-h-[85vh] bg-[#111111] rounded-xl flex flex-col border border-white/[0.08] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-white">Daily Summary</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={subtractOneDay}
                  className="w-7 h-7 rounded-md hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 text-xs" />
                </button>
                <span className="text-gray-300 text-sm font-medium px-2 min-w-[100px] text-center">{formatDate(dataDate)}</span>
                <button
                  onClick={addOneDay}
                  className="w-7 h-7 rounded-md hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                title="Share"
              >
                <FontAwesomeIcon icon={faShareNodes} className="text-gray-400 text-sm" />
              </button>
              <button
                onClick={closePopup}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-gray-400 text-sm" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Two-Column Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
              {/* Left: Main P&L Card with Chart */}
              <div className="lg:col-span-2 bg-[#181818] rounded-xl p-5 border border-white/[0.04]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Net P&L</p>
                    <p className={`text-3xl font-bold ${grossPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {grossPnL >= 0 ? '+' : '-'}${Math.abs(grossPnL).toFixed(2)}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${grossPnL >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {dataToday.length} trade{dataToday.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="h-32">
                  <GraphComp />
                </div>
              </div>

              {/* Right: KPI Grid */}
              <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Win Rate */}
                <div className="bg-[#181818] rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                  <p className={`text-xl font-bold ${parseFloat(winRate) >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {winRate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{wins}W / {losses}L</p>
                </div>

                {/* Profit Factor */}
                <div className="bg-[#181818] rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-xs text-gray-500 mb-1">Profit Factor</p>
                  <p className={`text-xl font-bold ${parseFloat(profitFactor) >= 1 || profitFactor === "∞" ? 'text-emerald-400' : 'text-red-400'}`}>
                    {profitFactor}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Ratio</p>
                </div>

                {/* Avg Win */}
                <div className="bg-[#181818] rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-xs text-gray-500 mb-1">Avg Win</p>
                  <p className="text-xl font-bold text-emerald-400">${avgWin}</p>
                  <p className="text-xs text-gray-500 mt-1">{wins} trades</p>
                </div>

                {/* Avg Loss */}
                <div className="bg-[#181818] rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-xs text-gray-500 mb-1">Avg Loss</p>
                  <p className="text-xl font-bold text-red-400">${avgLoss}</p>
                  <p className="text-xs text-gray-500 mt-1">{losses} trades</p>
                </div>

                {/* Winners */}
                <div className="bg-[#181818] rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-xs text-gray-500 mb-1">Gross Profit</p>
                  <p className="text-xl font-bold text-emerald-400">+${grossWins.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">{wins} winners</p>
                </div>

                {/* Commissions */}
                <div className="bg-[#181818] rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-xs text-gray-500 mb-1">Commissions</p>
                  <p className="text-xl font-bold text-amber-400">${totalCommissions.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total fees</p>
                </div>
              </div>
            </div>

            {/* Trades Table */}
            <div className="bg-[#181818] rounded-xl border border-white/[0.04] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <h3 className="text-sm font-medium text-white">Trades</h3>
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
                        className={`${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'} hover:bg-white/[0.03] transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{data.OpenTime}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white text-sm font-medium">{data.Item}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            data.Type?.toLowerCase() === 'buy' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {data.Type?.toLowerCase() === 'buy' ? 'Long' : 'Short'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-semibold ${data.Profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {data.Profit >= 0 ? '+' : '-'}${Math.abs(data.Profit).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleEdit(data)}
                              className="w-7 h-7 rounded-md hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="text-gray-400 hover:text-white text-xs" />
                            </button>
                            <button 
                              onClick={() => confirmDelete(data.id)}
                              className="w-7 h-7 rounded-md hover:bg-red-500/10 flex items-center justify-center transition-colors"
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
