'use client';

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileUp, RefreshCw, PenLine, Briefcase, TrendingUp, Plus, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import calendarPopUp from "@/store/calendarPopUp";
import useAccountDetails from "@/store/accountdetails";
import usePropFirmStore from "@/store/propFirmStore";
import ManualTradeForm from "./components/manual/ManualTradeForm";
import FileUpload from "./components/file-upload/FileUpload";
import AutoSync from "./components/auto-sync/AutoSync";

const tabs = [
  { id: 1, label: "Manual", icon: PenLine },
  { id: 2, label: "File Upload", icon: FileUp },
  { id: 3, label: "Broker Sync", icon: RefreshCw }
];

const AddtradesMain = () => {
  const { showAddTrades, setAddTrades } = calendarPopUp();
  const { selectedAccounts } = useAccountDetails();
  const { isEnabled: isPropFirmMode } = usePropFirmStore();
  const [selectedTab, setSelectedTab] = useState(1);
  
  const filteredAccounts = useMemo(() => {
    return selectedAccounts.filter(acc => {
      const isAccountPropFirm = acc.isPropFirm === true;
      // In Prop Firm mode: only show prop firm accounts
      // In Live Trading mode: show ALL accounts (including prop firm)
      return isPropFirmMode ? isAccountPropFirm : true;
    });
  }, [selectedAccounts, isPropFirmMode]);

  const [selectedAccount, setSelectedAccount] = useState(
    filteredAccounts.length > 0 ? filteredAccounts[0].accountName : ""
  );

  useEffect(() => {
    if (filteredAccounts.length > 0 && !filteredAccounts.find(a => a.accountName === selectedAccount)) {
      setSelectedAccount(filteredAccounts[0].accountName);
    }
  }, [filteredAccounts, selectedAccount]);
  
  // Submit state for Manual Trade form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradesCount, setTradesCount] = useState(1);
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

  const handleSubmitStateChange = (submitting: boolean, count: number, valid: boolean) => {
    setIsSubmitting(submitting);
    setTradesCount(count);
    setCanSubmit(valid);
  };

  const triggerSubmit = () => {
    setSubmitTrigger(prev => prev + 1);
  };

  const handleClose = () => {
    setAddTrades();
    setSubmitTrigger(0); // Reset submit trigger when closing modal
    document.body.classList.remove("no-scroll");
  };

  if (!showAddTrades) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[5vh] md:pt-[8vh] bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-[92%] max-w-[480px] max-h-[85vh] bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Add Trade</h2>
                <p className="text-[10px] text-muted-foreground">Record your activity</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Tab Navigation */}
          <div className="px-4 pt-3">
            <div className="flex gap-0.5 p-0.5 bg-muted/30 rounded-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200",
                      isActive
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Account Selector */}
          <div className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs",
                isPropFirmMode 
                  ? "bg-amber-500/10 border-amber-500/30" 
                  : "bg-muted/30 border-border/50"
              )}>
                {isPropFirmMode ? (
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer min-w-[100px]"
                >
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account) => (
                      <option key={account.accountName} value={account.accountName} className="bg-card">
                        {account.accountName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled className="bg-card">
                      No {isPropFirmMode ? "prop firm" : "trading"} accounts
                    </option>
                  )}
                </select>
              </div>
              {selectedAccount && (
                <span className="text-[10px] text-muted-foreground">
                  Account selected
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {selectedTab === 1 && (
                  <ManualTradeForm 
                    selectedAccount={selectedAccount} 
                    onClose={handleClose}
                    onSubmitStateChange={handleSubmitStateChange}
                    submitTrigger={submitTrigger}
                    isPropFirmMode={isPropFirmMode}
                  />
                )}
                {selectedTab === 2 && <FileUpload />}
                {selectedTab === 3 && <AutoSync />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Compact Footer - Submit Button (only for Manual tab) */}
          {selectedTab === 1 && (
            <div className="flex-shrink-0 px-4 py-3 border-t border-border/50 bg-card">
              <motion.button
                onClick={triggerSubmit}
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                className={cn(
                  "w-full py-3 rounded-lg text-xs font-semibold transition-all relative overflow-hidden",
                  isSubmitting
                    ? "bg-muted text-muted-foreground cursor-wait"
                    : "bg-gradient-to-r from-profit to-profit/80 text-white hover:shadow-lg hover:shadow-profit/25"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    {tradesCount > 1 ? `Add ${tradesCount} Trades` : "Add Trade"}
                  </span>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddtradesMain;
