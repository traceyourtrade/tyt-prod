"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, 
  ChevronDown, 
  Check, 
  CheckSquare,
  Square,
  Plus,
  Building2,
  Wallet,
  Settings,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import usePropFirmStore from "@/store/propFirmStore";

const brokerIcons: Record<string, string> = {
  "MetaTrader 5": "MT5",
  "MetaTrader 4": "MT4",
  "Zerodha": "ZD",
  "Binance": "BN",
  "Upstox": "UP",
  "Angel One": "AO",
};

const AccountsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { accounts, updateAccView, checkAll } = useAccountDetails();
  const { setAddAcc } = calendarPopUp();
  const { isEnabled: isPropFirmMode } = usePropFirmStore();

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const isAccountPropFirm = acc.isPropFirm === true;
      return isPropFirmMode ? isAccountPropFirm : !isAccountPropFirm;
    });
  }, [accounts, isPropFirmMode]);

  const selectedCount = filteredAccounts.filter(acc => acc.checked).length;
  const allSelected = filteredAccounts.length > 0 && selectedCount === filteredAccounts.length;
  const someSelected = selectedCount > 0 && selectedCount < filteredAccounts.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleAccount = async (accountName: string) => {
    await updateAccView(accountName);
  };

  const handleToggleAll = async () => {
    // For filtered accounts, we should only toggle accounts in the current mode
    // Since the API toggles all accounts, we handle this locally for better UX
    for (const account of filteredAccounts) {
      if (allSelected) {
        // Deselect all in current mode
        if (account.checked) {
          await updateAccView(account.accountName);
        }
      } else {
        // Select all in current mode
        if (!account.checked) {
          await updateAccView(account.accountName);
        }
      }
    }
  };

  const getDisplayText = () => {
    if (filteredAccounts.length === 0) return isPropFirmMode ? "No Prop Accounts" : "No Accounts";
    if (selectedCount === 0) return "No accounts";
    if (allSelected) return isPropFirmMode ? "All Prop Accounts" : "All Accounts";
    if (selectedCount === 1) {
      const selected = filteredAccounts.find(acc => acc.checked);
      return selected?.accountName || "1 Account";
    }
    return `${selectedCount} Accounts`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          "border border-border bg-card hover:bg-muted/50",
          isOpen && "border-primary/50 ring-2 ring-primary/20"
        )}
      >
        {isPropFirmMode ? (
          <Zap className="w-4 h-4 text-amber-500" />
        ) : (
          <DollarSign className="w-4 h-4 text-primary" />
        )}
        <span className="hidden sm:inline text-foreground">{getDisplayText()}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPropFirmMode ? (
                    <Zap className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Wallet className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-semibold text-foreground text-sm">
                    {isPropFirmMode ? "Prop Firm Accounts" : "Trading Accounts"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                  {selectedCount}/{filteredAccounts.length}
                </span>
              </div>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
                  {isPropFirmMode ? (
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {isPropFirmMode ? "No prop firm accounts yet" : "No accounts added yet"}
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setAddAcc();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </button>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="px-2 py-2 border-b border-border">
                  <button
                    onClick={handleToggleAll}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center transition-all",
                      allSelected 
                        ? "bg-primary text-white" 
                        : someSelected
                          ? "bg-primary/50 text-white"
                          : "border-2 border-border group-hover:border-primary/50"
                    )}>
                      {(allSelected || someSelected) && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="font-medium text-sm text-foreground">Select All</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {allSelected ? "Deselect all" : "Select all"}
                    </span>
                  </button>
                </div>

                {/* Account List */}
                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                  {filteredAccounts.map((account) => (
                    <button
                      key={account._id || account.accountName}
                      onClick={() => handleToggleAccount(account.accountName)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0",
                        account.checked 
                          ? "bg-primary text-white" 
                          : "border-2 border-border group-hover:border-primary/50"
                      )}>
                        {account.checked && <Check className="w-3.5 h-3.5" />}
                      </div>

                      {/* Broker Icon */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-blue-400">
                          {brokerIcons[account.broker || ""] || "AC"}
                        </span>
                      </div>

                      {/* Account Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground truncate">
                          {account.accountName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {account.broker || account.accountType || "Trading Account"}
                        </p>
                      </div>

                      {/* Balance */}
                      {account.accountBalance && (
                        <span className="text-xs font-medium text-profit flex-shrink-0">
                          ${Number(account.accountBalance).toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-2 py-2 border-t border-border">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setAddAcc();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Accounts
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountsDropdown;
