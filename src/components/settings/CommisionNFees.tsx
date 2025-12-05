"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faDollarSign } from "@fortawesome/free-solid-svg-icons";

interface Trade {
  id: number;
  instrument: string;
  side: string;
  lots: number;
  commission: number;
  fees: number;
  date: string;
}

const CommissionNfees = () => {
  const [filter, setFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const trades: Trade[] = [
    { id: 1123, instrument: "XAUUSD", side: "Long", lots: 1, commission: 33, fees: 30, date: "10/02/2025" },
    { id: 1124, instrument: "BANKNIFTY", side: "Long", lots: 2, commission: 26, fees: 23, date: "13/02/2025" },
    { id: 1125, instrument: "BTCUSDT", side: "Short", lots: 10, commission: 20, fees: 17, date: "01/03/2025" },
  ];

  const totalCommission = trades.reduce((s, t) => s + t.commission, 0);
  const totalFees = trades.reduce((s, t) => s + t.fees, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Commissions & Fees</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faDollarSign} className="text-emerald-500 text-xs" />
            </div>
            <span className="text-xs text-gray-500">Commission</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">${totalCommission}</p>
        </div>
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center">
              <FontAwesomeIcon icon={faDollarSign} className="text-gray-400 text-xs" />
            </div>
            <span className="text-xs text-gray-500">Fees</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">${totalFees}</p>
        </div>
      </div>

      <div className="relative w-fit">
        <button 
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-sm text-gray-700 dark:text-gray-300"
        >
          {filter}
          <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${filterOpen ? "rotate-180" : ""}`} />
        </button>
        {filterOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg shadow-lg overflow-hidden z-10">
            {["All", "This Week", "This Month"].map((opt) => (
              <button
                key={opt}
                onClick={() => { setFilter(opt); setFilterOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] overflow-hidden">
        <div className="hidden sm:grid grid-cols-6 gap-2 px-4 py-2 bg-gray-50 dark:bg-[#0f0f0f] text-xs font-medium text-gray-500 uppercase">
          <span>Trade</span>
          <span>Instrument</span>
          <span>Side</span>
          <span className="text-right">Lots</span>
          <span className="text-right">Commission</span>
          <span className="text-right">Fees</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#262626]">
          {trades.map((t) => (
            <div key={t.id} className="px-4 py-3">
              <div className="sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center">
                <div className="flex justify-between sm:block mb-1 sm:mb-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">#{t.id}</span>
                  <span className="sm:hidden text-xs text-gray-500">{t.date}</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{t.instrument}</span>
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                  t.side === "Long" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                }`}>{t.side}</span>
                <span className="hidden sm:block text-sm text-right text-gray-700 dark:text-gray-300">{t.lots}</span>
                <span className="hidden sm:block text-sm text-right text-emerald-500 font-medium">${t.commission}</span>
                <span className="hidden sm:block text-sm text-right text-gray-700 dark:text-gray-300">${t.fees}</span>
              </div>
              <div className="sm:hidden flex justify-between mt-2 text-sm">
                <span className="text-gray-500">{t.lots} lots</span>
                <span className="text-emerald-500 font-medium">${t.commission} / ${t.fees}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommissionNfees;
