'use client';

import { useState, useEffect, useRef } from "react";
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
  faChartLine,
  faArrowTrendUp,
  faArrowTrendDown
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

const CalendarPopup = () => {
  const { showTr, setShowTr, dataDate, setDateHard, setAddTrades, setShowEditTradePopUp, setEditTradeData } = calendarPopUp();
  const { setAlertBoxG } = notifications();
  const { selectedAccounts } = useModeFilteredAccounts();
  const { bkurl } = useDataStore();
  const { setAccounts } = useAccountDetails();
  const tokenn = Cookies.get("ProJournX");
  const popupRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; tradeId: string | null }>({ show: false, tradeId: null });
  const [showChart, setShowChart] = useState(false);

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[dateObj.getDay()]}, ${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
  };

  const groupedTrades = selectedAccounts.flatMap(acc =>
    (acc.tradeData || []).map((trade: Trade) => ({
      ...trade,
      accountName: acc.accountName,
      accountId: acc._id
    }))
  ).reduce((acc: { [key: string]: GroupedTrade }, trade: Trade) => {
    if (!acc[trade.date]) {
      acc[trade.date] = { date: trade.date, trades: [], profit: 0, tradeLength: 0 };
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
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(0) : "0";
  const grossPnL = dataToday.reduce((sum, trade) => sum + trade.Profit, 0);
  const totalCommissions = dataToday.reduce((sum, trade) => sum + (Math.abs(trade.Commission) || 0), 0);
  const grossWins = dataToday.filter(t => t.Profit > 0).reduce((a, t) => a + t.Profit, 0);
  const grossLosses = Math.abs(dataToday.filter(t => t.Profit < 0).reduce((a, t) => a + t.Profit, 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : grossWins > 0 ? "∞" : "0";
  
  const primaryCurrency = dataToday[0]?.Currency || 'USD';
  const primaryMarketType = dataToday[0]?.marketType;
  const dayCurrencySymbol = getCurrencySymbol(primaryCurrency, primaryMarketType);
  const isINR = primaryCurrency === 'INR';
  
  const formatPnL = (value: number, decimals: number = 2): string => {
    return Math.abs(value).toLocaleString(isINR ? 'en-IN' : 'en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const GraphComp = () => {
    let cumulativeSum = 0;
    const data: ChartData[] = [
      { time: "Start", value: 0 },
      ...dataToday.map(({ time, Profit }) => {
        cumulativeSum += Profit;
        return { time: time.substring(0, 5), value: Number(cumulativeSum.toFixed(2)) };
      }),
    ];

    const allPositive = data.every(d => d.value >= 0);
    const allNegative = data.every(d => d.value <= 0);
    const strokeColor = allPositive ? "#10b981" : allNegative ? "#ef4444" : "#8b5cf6";
    const fillColor = allPositive ? "#10b981" : allNegative ? "#ef4444" : "#8b5cf6";

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fill: "#666", fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#666", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${dayCurrencySymbol}${v}`} />
          <Tooltip 
            contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
            formatter={(value: number) => [`${dayCurrencySymbol}${value.toFixed(2)}`, 'P&L']}
          />
          <Area type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} fill="url(#chartGradient)" />
        </AreaChart>
      </ResponsiveContainer>
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

  const changeDay = (delta: number) => {
    const date = new Date(dataDate);
    date.setDate(date.getDate() + delta);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setDateHard(`${yyyy}-${mm}-${dd}`);
  };

  const handleShare = async () => {
    const element = document.getElementById("trade-details");
    if (!element) return;
    try {
      element.style.background = "#0a0a0a";
      const canvas = await html2canvas(element, { backgroundColor: null, useCORS: true });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to create blob");
      const file = new File([blob], "trade-details.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Trade Details" });
      } else {
        setAlertBoxG("Sharing not supported on this device/browser.", "error");
      }
    } catch (error) {
      console.error("Sharing failed", error);
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
      const response = await fetch(`/api/dashboard/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenn, tradeId, apiName: 'deleteManualUpload' }),
      });
      if (!response.ok) throw new Error("Failed to delete trade.");
      setAlertBoxG("Trade deleted successfully", "success");
      await setAccounts();
    } catch (error) {
      console.error("Error deleting trade:", error);
      setAlertBoxG("An error occurred while deleting the trade.", "error");
    }
  };

  const confirmDelete = (tradeId: string) => setDeleteConfirmation({ show: true, tradeId });
  const handleConfirmDelete = () => {
    if (deleteConfirmation.tradeId) handleDelete(deleteConfirmation.tradeId);
    setDeleteConfirmation({ show: false, tradeId: null });
  };
  const cancelDelete = () => setDeleteConfirmation({ show: false, tradeId: null });
  const closePopup = () => setShowTr();

  return (
    <>
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#1a1a1a] rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faTrashCan} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Delete Trade?</h3>
                <p className="text-gray-500 text-xs">This can't be undone</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={cancelDelete} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors">Cancel</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
      
      <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-all duration-200 ${showTr ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {dataToday.length === 0 ? (
          <div ref={popupRef} className="w-full max-w-sm bg-[#141414] rounded-2xl p-6 border border-white/10 text-center">
            <button onClick={closePopup} className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <div className="flex items-center justify-center gap-2 mb-6">
              <button onClick={() => changeDay(-1)} className="w-7 h-7 rounded-lg hover:bg-white/10 text-gray-500 transition-colors">
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>
              <span className="text-gray-400 text-sm font-medium px-2">{formatDate(dataDate)}</span>
              <button onClick={() => changeDay(1)} className="w-7 h-7 rounded-lg hover:bg-white/10 text-gray-500 transition-colors">
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
              <img src="/favicon.png" alt="logo" className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-gray-500 text-sm mb-5">No trades on this day</p>
            <button onClick={() => { closePopup(); setTimeout(() => setAddTrades(), 200); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors">
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Add Trade
            </button>
          </div>
        ) : (
          <div ref={popupRef} id="trade-details" className="w-full max-w-lg max-h-[85vh] bg-[#141414] rounded-2xl flex flex-col border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button onClick={() => changeDay(-1)} className="w-7 h-7 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>
                <span className="text-white text-sm font-medium">{formatDate(dataDate)}</span>
                <button onClick={() => changeDay(1)} className="w-7 h-7 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${grossPnL >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {grossPnL >= 0 ? '+' : '-'}{dayCurrencySymbol}{formatPnL(grossPnL, 0)}
                </div>
                <button onClick={() => setShowChart(!showChart)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showChart ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-500'}`}>
                  <FontAwesomeIcon icon={faChartLine} className="text-sm" />
                </button>
                <button onClick={handleShare} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faShareNodes} className="text-sm" />
                </button>
                <button onClick={closePopup} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faXmark} className="text-sm" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-px bg-white/[0.04] border-b border-white/[0.06]">
              {[
                { label: 'Trades', value: dataToday.length },
                { label: 'Win Rate', value: `${winRate}%`, color: parseInt(winRate) >= 50 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Wins', value: wins, color: 'text-emerald-400' },
                { label: 'Losses', value: losses, color: 'text-red-400' },
                { label: 'PF', value: profitFactor, color: parseFloat(profitFactor) >= 1 || profitFactor === '∞' ? 'text-emerald-400' : 'text-red-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-[#141414] py-2.5 px-2 text-center">
                  <div className={`text-sm font-bold ${stat.color || 'text-white'}`}>{stat.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>

            {showChart && (
              <div className="h-32 px-3 py-2 border-b border-white/[0.06] bg-black/20">
                <GraphComp />
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {dataToday.map((trade, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${trade.Profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <FontAwesomeIcon icon={trade.Profit >= 0 ? faArrowTrendUp : faArrowTrendDown} className={`text-xs ${trade.Profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{trade.Item}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${trade.Type?.toLowerCase() === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {trade.Type?.toLowerCase() === 'buy' ? 'L' : 'S'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{trade.OpenTime} · {trade.Size} {trade.marketType === 'FOREX' ? 'lots' : 'qty'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${trade.Profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.Profit >= 0 ? '+' : '-'}{getCurrencySymbol(trade.Currency, trade.marketType)}{Math.abs(trade.Profit).toLocaleString(trade.Currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(trade)} className="w-7 h-7 rounded-lg hover:bg-emerald-500/15 text-gray-500 hover:text-emerald-400 transition-colors">
                        <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                      </button>
                      <button onClick={() => confirmDelete(trade._id || trade.id || trade.tradeId || String(trade.Ticket))} className="w-7 h-7 rounded-lg hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors">
                        <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-white/[0.06] bg-black/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Commissions</span>
                <span className="text-amber-400 font-medium">-{dayCurrencySymbol}{formatPnL(totalCommissions)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CalendarPopup;
