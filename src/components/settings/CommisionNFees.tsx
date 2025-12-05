"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faChevronDown, faDollarSign, faPercent, faReceipt } from "@fortawesome/free-solid-svg-icons";

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">Commissions & Fees</h2>
          <p className="text-gray-500 text-sm mt-1">Detailed insights of all your trading costs</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl hover:bg-[#252525] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#252525] flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-gray-400 text-sm" />
            </div>
            <span className="text-gray-300 text-sm font-medium">{selectedAccount}</span>
            <FontAwesomeIcon icon={faChevronDown} className={`text-gray-500 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl z-10 overflow-hidden">
              {["All Accounts", "Himanshu MT5", "Tanmay Zerodha", "Tate Crypto"].map((acc, index) => (
                <button
                  key={index}
                  onClick={() => { setSelectedAccount(acc); setIsOpen(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors"
                >
                  {acc}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <FontAwesomeIcon icon={faDollarSign} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Commission</p>
              <p className="text-white font-semibold">${totalCommissions}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <FontAwesomeIcon icon={faReceipt} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Fees</p>
              <p className="text-white font-semibold">${totalFees}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
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
              <tr key={index} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">
                      Trade <span className="text-emerald-400">#{account.tradeNo}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{account.lastUpdate}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-3 py-1 bg-[#252525] text-gray-300 text-sm font-medium rounded-lg">
                    {account.instrument}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                    account.LorS === "Long" 
                      ? "bg-emerald-500/15 text-emerald-400" 
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {account.LorS}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-gray-300 font-medium">{account.lotSize} Lots</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-amber-400 font-semibold">${account.comissions}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-gray-300 font-medium">${account.fees}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionNfees;
