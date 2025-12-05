"use client";
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEllipsisVertical, faTrash, faPen, faWallet } from "@fortawesome/free-solid-svg-icons";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";

const Account = () => {
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { accounts } = useAccountDetails();
  const { setEditAcc, setEditAccData, setDeleteAcc, setDeleteAccData, setAddAcc } = calendarPopUp();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Accounts</h2>
        <button 
          onClick={() => setAddAcc()}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center mx-auto mb-3">
            <FontAwesomeIcon icon={faWallet} className="text-gray-400 text-lg" />
          </div>
          <p className="text-gray-900 dark:text-white font-medium">No accounts yet</p>
          <p className="text-sm text-gray-500 mt-1">Add your first trading account</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {accounts.map((acc, i) => (
            <div key={i} className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{acc.accountName}</p>
                  <p className="text-xs text-gray-500 truncate">{acc.broker}</p>
                </div>
                <div className="relative" ref={menuOpen === i ? menuRef : null}>
                  <button 
                    onClick={() => setMenuOpen(menuOpen === i ? null : i)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                  </button>
                  {menuOpen === i && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg shadow-lg overflow-hidden z-10">
                      <button 
                        onClick={() => { setEditAccData(acc); setEditAcc(); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-xs text-gray-400" />
                        Edit
                      </button>
                      <button 
                        onClick={() => { setDeleteAccData(acc); setDeleteAcc(); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{acc.accountType}</span>
                <span className="font-medium text-gray-900 dark:text-white">{acc.accountBalance}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Account;
