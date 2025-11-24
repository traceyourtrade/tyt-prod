'use client';

import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faChartLine, faDollarSign } from '@fortawesome/free-solid-svg-icons';

interface TradeData {
  date: string;
  Profit: number;
  Item: string;
}

interface TradesWidgetProps {
  data: TradeData[];
}

const TradesWidget: React.FC<TradesWidgetProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<"recentTrades" | "openPositions">("recentTrades");
  const [loading, setLoading] = useState<boolean>(false);

  const handleTabSwitch = (tab: "recentTrades" | "openPositions") => {
    setLoading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setLoading(false);
    }, 0);
  };

  const skeletonPlaceholder = (
    <div className="space-y-3">
      <div className="skeleton skeleton-line skeleton-short bg-gray-600 animate-pulse h-4 rounded"></div>
      <div className="skeleton skeleton-line skeleton-medium bg-gray-600 animate-pulse h-4 rounded"></div>
      <div className="skeleton skeleton-line skeleton-long bg-gray-600 animate-pulse h-4 rounded"></div>
      <div className="skeleton skeleton-line skeleton-medium bg-gray-600 animate-pulse h-4 rounded"></div>
    </div>
  );

  const tableContent = (
    <table className="w-[95%] border-collapse">
      <thead>
        <tr className="w-4/5 mx-auto rounded-full overflow-hidden">
          <th className="px-3 py-2 text-center bg-gray-600 bg-opacity-55 font-bold text-xs uppercase text-gray-200 rounded-l-full">
            Close Date
          </th>
          <th className="px-3 py-2 text-center bg-gray-600 bg-opacity-55 font-bold text-xs uppercase text-gray-200">
            Symbol
          </th>
          <th className="px-3 py-2 text-center bg-gray-600 bg-opacity-55 font-bold text-xs uppercase text-gray-200 rounded-r-full">
            Net P&L
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className="border-b border-gray-700">
            <td className="px-3 py-2 text-center text-gray-300">{row.date}</td>
            <td className="px-3 py-2 text-center font-semibold text-gray-300">{row.Item}</td>
            <td className={`px-3 py-2 text-center font-semibold ${
              parseFloat(row.Profit.toString()) < 0 ? "text-red-400" : 
              parseFloat(row.Profit.toString()) > 0 ? "text-green-500" : "text-gray-300"
            }`}>
              {parseFloat(row.Profit.toString()) < 0 ? `-$${Math.abs(row.Profit)}` : `$${row.Profit}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="w-[95%] max-w-[600px] h-[300px] flex flex-col font-['Inter'] bg-[rgba(114,113,113,0.134)] rounded-xl mt-5 shadow-[0_25px_45px_rgba(0,0,0,0.1)] border-b border-b-[rgba(255,255,255,0.2)] backdrop-blur-sm shadow-lg">
      <div className="tab-header relative flex border-b-2 border-gray-500">
        <button
          className={`tab-button flex-1 px-2.5 py-2.5 text-center cursor-pointer text-base bg-transparent border-none outline-none transition-colors duration-300 font-['Inter'] text-white ${
            activeTab === "recentTrades" ? "font-bold text-gray-200" : ""
          }`}
          onClick={() => handleTabSwitch("recentTrades")}
        >
          Recent Trades
        </button>
        <button
          className={`tab-button flex-1 px-2.5 py-2.5 text-center cursor-pointer text-base bg-transparent border-none outline-none transition-colors duration-300 font-['Inter'] text-white ${
            activeTab === "openPositions" ? "font-bold text-gray-200" : ""
          }`}
          onClick={() => handleTabSwitch("openPositions")}
        >
          Open Positions
        </button>
        <div
          className="tab-indicator absolute bottom-0 h-0.5 w-1/2 bg-gray-500 transition-transform duration-300"
          style={{
            transform: activeTab === "recentTrades" ? "translateX(0)" : "translateX(100%)",
          }}
        ></div>
      </div>

      <div className="tab-container w-full overflow-y-auto overflow-x-hidden mt-2.5 rounded-xl">
        <div className="tab-content min-h-[150px] text-sm text-white rounded-xl px-2.5 py-5">
          {loading ? skeletonPlaceholder : activeTab === "recentTrades" ? tableContent : <p>No open positions.</p>}
        </div>
      </div>
    </div>
  );
};

export default TradesWidget;