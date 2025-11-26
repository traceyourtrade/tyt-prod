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
  faCircleLeft, 
  faCircleRight, 
  faCircleXmark 
} from "@fortawesome/free-solid-svg-icons";

// Store imports (you'll need to adjust these based on your store structure)
import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import useAccountDetails from "@/store/accountdetails";
import { useDataStore } from "@/store/store";

// Import your logo
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
  const { selectedAccounts } = useAccountDetails();
  const { bkurl } = useDataStore();
  const tokenn = Cookies.get("Trace Your Trades");
  const popupRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    
    const dateObj = new Date(dateString);
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    const dayOfWeek = days[dateObj.getDay()];
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `${dayOfWeek}, ${month} ${day} ${year}`;
  };

  const groupedTrades = selectedAccounts.flatMap(acc =>
    acc.tradeData.map((trade: Trade) => ({
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
  const dataToday=calendarData.find(item => item.date === dataDate)?.trades || [];
//   const [dataToday, setDataToday] = useState<Trade[]>([]);

  const wins = dataToday.filter(trade => trade.Profit > 0).length;
  const losses = dataToday.filter(trade => trade.Profit < 0).length;
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : "0.00";

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
      <div className="relative -left-2.5">
        <ResponsiveContainer width="105%" height={150}>
          <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mixedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(96, 187, 165)" stopOpacity={1} />
                <stop offset={zeroOffset} stopColor="rgba(96, 187, 164, 0.04)" stopOpacity={1} />
                <stop offset={zeroOffset} stopColor="rgba(179, 22, 22, 0.08)" stopOpacity={1} />
                <stop offset="100%" stopColor="rgb(239, 92, 92)" stopOpacity={0.7} />
              </linearGradient>

              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(96, 187, 165)" stopOpacity={1} />
                <stop offset="100%" stopColor="rgba(96, 187, 164, 0.04)" stopOpacity={1} />
              </linearGradient>

              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(239, 92, 92, 0.35)" stopOpacity={1} />
                <stop offset="100%" stopColor="rgba(179, 22, 22, 0.7)" stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgb(80, 80, 80)" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255, 255, 255, 0.51)" 
              tick={{ fill: "rgba(255, 255, 255, 0.51)" }} 
            />
            <YAxis
              stroke="rgba(255, 255, 255, 0.51)"
              tick={{ fill: "rgba(255, 255, 255, 0.51)" }}
              tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
            />

            <Tooltip contentStyle={{ backgroundColor: "#222", color: "white", border: "1px solid white" }} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="white"
              fill={`url(#${getGradientId()})`}
              fillOpacity={1}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

//   useEffect(() => {
//     const todayData = calendarData.find(item => item.date === dataDate)?.trades || [];
//     setDataToday(todayData);
//   }, [calendarData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowTr(false);
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
      element.style.background = "#1a1a1a";
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
      // Handle successful deletion
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

  return (
    <div className={`fixed inset-0 bg-[#00000064] bg-opacity-40 z-50 flex flex-col items-center justify-center ${showTr ? "flex" : "hidden"}`}>
      {dataToday.length === 0 ? (
        <div 
          ref={popupRef} 
          className="w-4/5 h-3/4 mt-12 bg-[rgba(34,33,33,0.379) bg-opacity-40 backdrop-blur-3xl rounded-3xl flex flex-col items-center justify-start border border-gray-500 relative"
        >
          <div className="w-11/12 flex flex-row items-center justify-between relative -top-4">
            <p className="tr-menu-btns absolute top-0 right-0 w-12 h-auto flex flex-row items-center justify-between">
              <FontAwesomeIcon 
                icon={faCircleLeft} 
                className="text-green-500 cursor-pointer relative -top-4 mr-1 text-base"
                onClick={subtractOneDay}
              />
              <FontAwesomeIcon 
                icon={faCircleRight} 
                className="text-yellow-400 cursor-pointer relative -top-4 mr-1 text-base"
                onClick={addOneDay}
              />
              <FontAwesomeIcon 
                icon={faCircleXmark} 
                className="text-red-500 cursor-pointer relative -top-4 text-base"
                onClick={closePopup}
              />
            </p>
          </div>

          <div className="w-full h-5/6 flex flex-col-reverse items-center justify-center">
            <button
              onClick={() => {
                closePopup();
                setTimeout(() => setAddTrades(), 500);
              }}
              className="w-30 px-2 py-1 font-inter text-xs rounded-3xl bg-purple-500 text-white border-none cursor-pointer -mr-1"
            >
              ADD TRADES +
            </button>
            <p className="text-gray-400 text-xs font-medium mb-1">NO TRADES FOR THIS DAY</p>
            <Image src={Logo} alt="logo" width={100} height={100} />
          </div>
        </div>
      ) : (
        <div 
          ref={popupRef} 
          id="trade-details"
          className="w-4/5 h-3/4  bg-[rgba(34,33,33,0.379) bg-opacity-40 backdrop-blur-3xl rounded-3xl flex flex-col items-center justify-start border border-gray-500 relative"
        >
          <div className="w-11/12 mt-10 flex flex-row items-center justify-between relative -top-4">
            <p className="text-white text-lg font-semibold mt-6">TRADE DETAILS</p>

            <div className="w-7/10 h-auto flex flex-row items-center justify-end font-inter mt-4">
              <FontAwesomeIcon 
                icon={faShareNodes} 
                className="text-gray-500 cursor-pointer mr-5 text-lg font-semibold"
                onClick={handleShare}
              />
              <Image src={Logo} alt="logo" width={60} height={60} className="cursor-pointer" />
            </div>

            <p className="tr-menu-btns absolute top-3 right-[-20] w-12 h-auto flex flex-row items-center justify-between">
              <FontAwesomeIcon 
                icon={faCircleLeft} 
                className="text-green-500 cursor-pointer relative -top-4 mr-1 text-base"
                onClick={subtractOneDay}
              />
              <FontAwesomeIcon 
                icon={faCircleRight} 
                className="text-yellow-400 cursor-pointer relative -top-4 mr-1 text-base"
                onClick={addOneDay}
              />
              <FontAwesomeIcon 
                icon={faCircleXmark} 
                className="text-red-500 cursor-pointer relative -top-4 text-base"
                onClick={closePopup}
              />
            </p>
          </div>

          <div className="w-11/12 h-auto flex items-center justify-start">
            <div className="w-60 h-7 flex items-center justify-between rounded-3xl bg-gray-900 text-xs px-4 py-0 text-gray-500 font-semibold">
              <span className="text-gray-400">{formatDate(dataDate)}</span>
              <span>
                Net P&L :{" "}
                <span 
                  className={dataToday.reduce((sum, trade) => sum + trade.Profit, 0).toFixed(2) >= "0" ? "text-green-500" : "text-red-300"}
                >
                  {dataToday.reduce((sum, trade) => sum + trade.Profit, 0).toFixed(2)}
                </span>
              </span>
            </div>
            <p className="text-gray-500 text-xs font-semibold ml-5">TOTAL TRADES - {dataToday.length}</p>
          </div>

          <div className="w-11/12 h-auto flex flex-row items-center justify-between mt-6">
            <div className="w-3/10 h-36 border border-dashed border-gray-500 rounded-3xl">
              <GraphComp />
            </div>
            <div className="w-65/100 h-36 border border-dotted border-gray-500 bg-[#1d1b1b] rounded-3xl flex items-center justify-evenly flex-wrap">
              {[
                { label: "GROSS P&L", value: `$${dataToday.reduce((sum, trade) => sum + trade.Profit, 0).toFixed(2)}`, color: dataToday.reduce((sum, trade) => sum + trade.Profit, 0).toFixed(2) >= "0" ? "text-green-500" : "text-red-300" },
                { label: "WINNERS", value: dataToday.filter(trade => trade.Profit > 0).length.toString() },
                { label: "COMMISSIONS", value: dataToday.reduce((sum, trade) => sum + (Math.abs(trade.Commission) || 0), 0).toString() },
                { label: "WIN RATE", value: `${winRate}%` },
                { label: "LOSERS", value: dataToday.filter(trade => trade.Profit < 0).length.toString() },
                { label: "PROFIT FACTOR", value: dataToday.filter(t => t.Profit > 0).reduce((a, t) => a + t.Profit, 0).toString() },
              ].map((item, index) => (
                <div key={index} className="w-3/10 h-15 rounded-3xl">
                  <p className="text-white text-xs h-auto mt-2 ml-7 font-semibold">{item.label}</p>
                  <p className={`text-sm mt-2 ml-7 font-semibold ${item.color || "text-gray-400"}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-11/12 overflow-x-auto mt-5">
            <table className="w-full border-collapse rounded-3xl overflow-hidden">
              <thead className="bg-purple-500 bg-opacity-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm text-white font-semibold">OPEN TIME</th>
                  <th className="px-4 py-2 text-left text-sm text-white font-semibold">SYMBOL</th>
                  <th className="px-4 py-2 text-left text-sm text-white font-semibold">LONG / SHORT</th>
                  <th className="px-4 py-2 text-left text-sm text-white font-semibold">NET P&L</th>
                  <th className="px-4 py-2 text-left text-sm text-white font-semibold">NET ROI</th>
                  <th className="px-4 py-2 text-left text-sm text-white font-semibold">RR RATIO</th>
                  <th className="px-4 py-2 text-left text-sm text-white font-semibold">EDIT</th>
                  <th className="px-4 py-2 text-left text-sm text-white font-semibold">DELETE</th>
                </tr>
              </thead>

              <tbody>
                {dataToday.map((data, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-left text-sm">{data.OpenTime}</td>
                    <td className="px-4 py-2 text-left text-sm">
                      <span className="px-2 py-1 bg-white text-black rounded-full text-xs relative -left-1">
                        {data.Item}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-left text-sm">{data.Type}</td>
                    <td className={`px-4 py-2 text-left text-sm ${data.Profit < 0 ? "text-red-300" : "text-green-500"}`}>
                      {data.Profit < 0 ? `-$${Math.abs(data.Profit)}` : `$${data.Profit}`}
                    </td>
                    <td className="px-4 py-2 text-left text-sm">NET ROI</td>
                    <td className="px-4 py-2 text-left text-sm">RR RATIO</td>
                    <td 
                      className="px-4 py-2 text-left text-sm cursor-pointer edit-trade-button hover:text-green-500"
                      onClick={() => handleEdit(data)}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </td>
                    <td 
                      className="px-4 py-2 text-left text-sm cursor-pointer delete-trade-button hover:text-red-500"
                      onClick={() => confirmDelete(data.id)}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPopup;