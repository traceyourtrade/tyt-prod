"use client";
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faCircleInfo, faCircleXmark, faTrashCan, faPlus, faSync, faEllipsisVertical, faPaperclip, faWallet } from "@fortawesome/free-solid-svg-icons";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import Image from "next/image";

interface AccountData {
  accountName: string;
  broker: string;
  accountType: string;
  accountBalance: string;
  lastUpdate?: string;
}

const Account = () => {
  const [visibleOptions, setVisibleOptions] = useState<number | null>(null);
  const optionsRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { accounts } = useAccountDetails();
  const { setEditAcc, setEditAccData, setDeleteAcc, setDeleteAccData, setAddAcc } = calendarPopUp();
  const { setAlertBoxG } = notifications();
  const MT5 = "https://upload.wikimedia.org/wikipedia/commons/2/27/MetaTrader_5.png?20220616130717";
  const MT4 = "https://fxscouts.com/wp-content/uploads/sites/20/2024/08/mt4-sign.png";

  const handleMenuClick = (index: number) => {
    setVisibleOptions(visibleOptions === index ? null : index);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (visibleOptions !== null) {
      const currentRef = optionsRefs.current[visibleOptions];
      if (currentRef && !currentRef.contains(event.target as Node)) {
        setVisibleOptions(null);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visibleOptions]);

  const AccountCard = ({ account, index }: { account: any; index: number }) => (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {(account.broker === "MetaTrader 5" || account.broker === "MetaTrader 4") && (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#252525] flex-shrink-0">
              <Image 
                src={account.broker === "MetaTrader 5" ? MT5 : MT4} 
                alt="Broker" 
                className="w-full h-full object-contain" 
                width={40}
                height={40}
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{account.accountName}</p>
            <p className="text-gray-500 text-xs">{account.broker}</p>
          </div>
        </div>
        <div 
          className="relative"
          ref={(el) => { optionsRefs.current[index] = el; }}
        >
          <button
            onClick={() => handleMenuClick(index)}
            className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#2a2a2a] flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} className="text-gray-400 text-sm" />
          </button>
          
          {visibleOptions === index && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
              <button 
                onClick={() => { setEditAccData(account); setEditAcc(); setVisibleOptions(null); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] transition-colors"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="text-gray-400" />
                Edit
              </button>
              <button 
                onClick={() => setAlertBoxG(account.accountName, "success")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] transition-colors"
              >
                <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400" />
                Account History
              </button>
              <button 
                onClick={() => setAlertBoxG(account.accountName, "success")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] transition-colors"
              >
                <FontAwesomeIcon icon={faCircleXmark} className="text-gray-400" />
                Clear Trades
              </button>
              <div className="h-px bg-[#2a2a2a]" />
              <button 
                onClick={() => { setDeleteAccData(account); setDeleteAcc(); setVisibleOptions(null); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <FontAwesomeIcon icon={faTrashCan} />
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#252525] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Type</p>
          <p className="text-sm text-white font-medium">{account.accountType}</p>
        </div>
        <div className="bg-[#252525] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Balance</p>
          <p className="text-sm text-white font-medium">{account.accountBalance}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a2a]">
        <p className="text-xs text-gray-500">Last update: {account.lastUpdate || "N/A"}</p>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setAlertBoxG("Attach file", "info")}
            className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#2a2a2a] flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faPaperclip} className="text-gray-400 text-sm" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 flex items-center justify-center transition-colors">
            <FontAwesomeIcon icon={faSync} className="text-emerald-400 text-sm" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white">Trading Accounts</h2>
          <p className="text-gray-500 text-xs lg:text-sm mt-1">You can add up to 10 active accounts</p>
        </div>
        <button 
          onClick={() => setAddAcc()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add Account
        </button>
      </div>

      <div className="lg:hidden">
        {accounts.length === 0 ? (
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#252525] flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faWallet} className="text-2xl text-gray-500" />
              </div>
              <p className="text-gray-400 font-medium">No accounts added yet</p>
              <p className="text-gray-500 text-sm mt-1">Add your first trading account to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account, index) => (
              <AccountCard key={index} account={account} index={index} />
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:block bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Account</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Broker</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Type</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Sync</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Balance</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Last Update</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-gray-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#252525] flex items-center justify-center mb-4">
                        <FontAwesomeIcon icon={faWallet} className="text-2xl text-gray-500" />
                      </div>
                      <p className="text-gray-400 font-medium">No accounts added yet</p>
                      <p className="text-gray-500 text-sm mt-1">Add your first trading account to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                accounts.map((account, index) => (
                  <tr key={index} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-semibold">{account.accountName}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{account.broker}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(account.broker === "MetaTrader 5" || account.broker === "MetaTrader 4") && (
                        <div className="w-8 h-8 mx-auto rounded-lg overflow-hidden bg-[#252525]">
                          <Image 
                            src={account.broker === "MetaTrader 5" ? MT5 : MT4} 
                            alt="Broker" 
                            className="w-full h-full object-contain" 
                            width={32}
                            height={32}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-[#252525] text-gray-300 text-xs font-medium rounded-lg">
                        {account.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 flex items-center justify-center mx-auto transition-colors">
                        <FontAwesomeIcon icon={faSync} className="text-emerald-400 text-sm" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-semibold">{account.accountBalance}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-500 text-sm">{account.lastUpdate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center justify-center gap-2 relative"
                        ref={(el) => { optionsRefs.current[index] = el; }}
                      >
                        <button 
                          onClick={() => setAlertBoxG("Attach file", "info")}
                          className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#2a2a2a] flex items-center justify-center transition-colors"
                        >
                          <FontAwesomeIcon icon={faPaperclip} className="text-gray-400 text-sm" />
                        </button>
                        <button
                          onClick={() => handleMenuClick(index)}
                          className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#2a2a2a] flex items-center justify-center transition-colors"
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} className="text-gray-400 text-sm" />
                        </button>

                        {visibleOptions === index && (
                          <div className="absolute top-full right-0 mt-2 w-48 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
                            <button 
                              onClick={() => { setEditAccData(account); setEditAcc(); setVisibleOptions(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] transition-colors"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="text-gray-400" />
                              Edit
                            </button>
                            <button 
                              onClick={() => setAlertBoxG(account.accountName, "success")}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] transition-colors"
                            >
                              <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400" />
                              Account History
                            </button>
                            <button 
                              onClick={() => setAlertBoxG(account.accountName, "success")}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] transition-colors"
                            >
                              <FontAwesomeIcon icon={faCircleXmark} className="text-gray-400" />
                              Clear Trades
                            </button>
                            <div className="h-px bg-[#2a2a2a]" />
                            <button 
                              onClick={() => { setDeleteAccData(account); setDeleteAcc(); setVisibleOptions(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrashCan} />
                              Delete Account
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Account;
