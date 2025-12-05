"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faChevronDown, faDollarSign, faReceipt } from "@fortawesome/free-solid-svg-icons";

interface Account {
  tradeNo: number;
  name: string;
  subtext: string;
  brokerIcon: string;
  type: string;
  balance: string;
  lastUpdate: string;
  instrument: string;
  LorS: string;
  lotSize: number;
  comissions: number;
  fees: number;
}

const CommissionNfees = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("All Accounts");

  const accounts: Account[] = [
    {
      tradeNo: 1123,
      name: "Himanshu MT5",
      subtext: "Meta Trader 5",
      brokerIcon: "https://upload.wikimedia.org/wikipedia/commons/2/27/MetaTrader_5.png?20220616130717",
      type: "Autosync",
      balance: "$43,698.55",
      lastUpdate: "10/02/2025, 12:05 AM",
      instrument: "XAUUSD",
      LorS: "Long",
      lotSize: 1,
      comissions: 33,
      fees: 30,
    },
    {
      tradeNo: 1124,
      name: "Tanmay Zerodha",
      subtext: "Kite - Zerodha",
      brokerIcon: "https://images.seeklogo.com/logo-png/48/2/zerodha-kite-logo-png_seeklogo-487028.png",
      type: "Autosync",
      balance: "₹75,446.05",
      lastUpdate: "13/02/2025, 02:05 PM",
      instrument: "BANKNIFTY",
      LorS: "Long",
      lotSize: 2,
      comissions: 26,
      fees: 23,
    },
    {
      tradeNo: 1125,
      name: "Tate Crypto",
      subtext: "Binance",
      brokerIcon: "https://logowik.com/content/uploads/images/binance-black-icon5996.logowik.com.webp",
      type: "File upload",
      balance: "$559.90",
      lastUpdate: "01/03/2025, 04:05 PM",
      instrument: "BTCUSDT",
      LorS: "Short",
      lotSize: 10,
      comissions: 20,
      fees: 17,
    },
  ];

  const totalCommissions = accounts.reduce((sum, account) => sum + account.comissions, 0);
  const totalFees = accounts.reduce((sum, account) => sum + account.fees, 0);

  const TradeCard = ({ account }: { account: Account }) => (
    <div className="bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-gray-900 dark:text-white font-medium">
            Trade <span className="text-emerald-500">#{account.tradeNo}</span>
          </p>
          <p className="text-gray-500 text-xs mt-0.5">{account.lastUpdate}</p>
        </div>
        <span className="px-3 py-1 bg-gray-100 dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg">
          {account.instrument}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-100 dark:bg-[#141414] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Side</p>
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
            account.LorS === "Long" 
              ? "bg-emerald-500/15 text-emerald-500" 
              : "bg-red-500/15 text-red-500"
          }`}>
            {account.LorS}
          </span>
        </div>
        <div className="bg-gray-100 dark:bg-[#141414] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Lot Size</p>
          <p className="text-sm text-gray-900 dark:text-white font-medium">{account.lotSize} Lots</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-[#262626]">
        <div>
          <p className="text-xs text-gray-500">Commission</p>
          <p className="text-sm text-emerald-500 font-semibold">${account.comissions}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Fees</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">${account.fees}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Commissions & Fees</h2>
        <p className="text-gray-500 text-xs lg:text-sm mt-1">Detailed insights of all your trading costs</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors w-full sm:w-auto"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faUser} className="text-gray-500 dark:text-gray-400 text-sm" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium flex-1 text-left">{selectedAccount}</span>
            <FontAwesomeIcon icon={faChevronDown} className={`text-gray-400 text-xs transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-xl shadow-2xl z-10 overflow-hidden">
              {["All Accounts", "Himanshu MT5", "Tanmay Zerodha", "Tate Crypto"].map((acc, index) => (
                <button
                  key={index}
                  onClick={() => { setSelectedAccount(acc); setIsOpen(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  {acc}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
          <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-xl">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faDollarSign} className="text-emerald-400 text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Total Commission</p>
              <p className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">${totalCommissions}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-xl">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faReceipt} className="text-gray-500 dark:text-gray-400 text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Total Fees</p>
              <p className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">${totalFees}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden space-y-3">
        {accounts.map((account, index) => (
          <TradeCard key={index} account={account} />
        ))}
      </div>

      <div className="hidden lg:block bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#262626]">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Trade Details</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Instrument</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Side</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Lot Size</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Commission</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Fees</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        Trade <span className="text-emerald-500">#{account.tradeNo}</span>
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{account.lastUpdate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg">
                      {account.instrument}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                      account.LorS === "Long" 
                        ? "bg-emerald-500/15 text-emerald-500" 
                        : "bg-red-500/15 text-red-500"
                    }`}>
                      {account.LorS}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{account.lotSize} Lots</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-emerald-500 font-semibold">${account.comissions}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">${account.fees}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionNfees;
