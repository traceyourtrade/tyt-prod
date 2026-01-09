"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, MoreVertical, Trash2, Edit3, Wallet, Check, RefreshCw, Upload, Link, Zap, ArrowRight, Sparkles, CheckSquare, Square, X
} from "lucide-react";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import { cn } from "@/lib/utils";

const getAccountTypeInfo = (type: string) => {
  switch(type?.toLowerCase()) {
    case 'manual':
      return { icon: Edit3, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Manual' };
    case 'file upload':
      return { icon: Upload, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'File Upload' };
    case 'broker sync':
      return { icon: RefreshCw, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Broker Sync' };
    default:
      return { icon: Wallet, color: 'text-gray-500', bg: 'bg-gray-500/10', label: type };
  }
};

const Account = () => {
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { accounts, deleteAccount, setAccounts } = useAccountDetails();
  const { setEditAcc, setEditAccData, setDeleteAcc, setDeleteAccData, setAddAcc } = calendarPopUp();
  const { setAlertBoxG } = notifications();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleSelectAccount = (accountName: string) => {
    const newSelected = new Set(selectedForDelete);
    if (newSelected.has(accountName)) {
      newSelected.delete(accountName);
    } else {
      newSelected.add(accountName);
    }
    setSelectedForDelete(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedForDelete.size === accounts.length) {
      setSelectedForDelete(new Set());
    } else {
      setSelectedForDelete(new Set(accounts.map(acc => acc.accountName)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedForDelete.size === 0) return;
    
    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const accountName of selectedForDelete) {
      const account = accounts.find(a => a.accountName === accountName);
      if (!account) continue;
      
      const accountType = account.accountType === 'Broker Sync' ? 'async' : 'filemanual';
      const result = await deleteAccount(accountName, accountType);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsDeleting(false);
    setSelectedForDelete(new Set());
    setShowBulkDeleteConfirm(false);
    await setAccounts();

    if (failCount === 0) {
      setAlertBoxG(`Successfully deleted ${successCount} account${successCount > 1 ? 's' : ''}`, 'success');
    } else {
      setAlertBoxG(`Deleted ${successCount} account${successCount > 1 ? 's' : ''}, ${failCount} failed`, 'error');
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/5"
          )}>
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Trading Accounts</h2>
            <p className="text-sm text-muted-foreground">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
            </p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setAddAcc()}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            "bg-primary text-white hover:bg-primary/90"
          )}
        >
          <Plus className="w-4 h-4" />
          Add Account
        </motion.button>
      </div>

      {/* Bulk Actions Bar */}
      {accounts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center justify-between gap-3 p-3 rounded-xl border",
            "bg-muted/30 border-border"
          )}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                selectedForDelete.size === accounts.length
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {selectedForDelete.size === accounts.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedForDelete.size === accounts.length ? "Deselect All" : "Select All"}
            </button>
            {selectedForDelete.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedForDelete.size} selected
              </span>
            )}
          </div>
          
          <AnimatePresence>
            {selectedForDelete.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowBulkDeleteConfirm(true)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  "bg-red-500 text-white hover:bg-red-600"
                )}
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedForDelete.size})
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !isDeleting && setShowBulkDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-full max-w-md rounded-2xl border overflow-hidden",
                "bg-card border-border shadow-2xl"
              )}
            >
              <div className="p-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-center text-foreground mb-2">
                  Delete {selectedForDelete.size} Account{selectedForDelete.size > 1 ? 's' : ''}?
                </h3>
                <p className="text-center text-muted-foreground text-sm mb-6">
                  This will permanently delete the selected accounts and all their trade data. This action cannot be undone.
                </p>
                
                <div className="max-h-32 overflow-y-auto mb-6 space-y-1">
                  {Array.from(selectedForDelete).map(name => (
                    <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground truncate">{name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    disabled={isDeleting}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                      "bg-muted text-foreground hover:bg-muted/80",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                      "bg-red-500 text-white hover:bg-red-600",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured MT5 Connect Card */}
      {!accounts.some(acc => acc.accountType === 'Broker Sync') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "relative overflow-hidden rounded-2xl border-2 p-6",
            "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
            "border-emerald-500/30 hover:border-emerald-500/50",
            "transition-all duration-300 cursor-pointer group"
          )}
          onClick={() => setAddAcc()}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-full" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-2xl" />
          
          <div className="relative flex items-start gap-4">
            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30"
              )}
            >
              <Zap className="w-7 h-7 text-white" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-foreground">Connect MT5 Account</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-full uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Auto-Sync
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Import your trades automatically from MetaTrader 5. Supports 100+ brokers worldwide.
              </p>
              
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {['IC', 'PP', 'XM', 'EX'].map((broker, i) => (
                    <div 
                      key={broker}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-card",
                        i === 0 && "bg-blue-500 text-white",
                        i === 1 && "bg-orange-500 text-white",
                        i === 2 && "bg-red-500 text-white",
                        i === 3 && "bg-amber-500 text-white"
                      )}
                    >
                      {broker}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border-2 border-card">
                    +96
                  </div>
                </div>
                
                <motion.div 
                  className="flex items-center gap-1.5 text-emerald-500 font-medium text-sm group-hover:gap-2.5 transition-all"
                  whileHover={{ x: 5 }}
                >
                  Connect Now
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {accounts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "rounded-2xl border p-12 text-center",
            "bg-card dark:bg-zinc-900/50",
            "border-border dark:border-white/[0.08]"
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/5"
          )}>
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No accounts yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Add your first trading account to start tracking your performance
          </p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAddAcc()}
            className={cn(
              "mt-6 px-6 py-3 rounded-xl text-sm font-medium transition-all",
              "bg-primary text-white hover:bg-primary/90"
            )}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Your First Account
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {accounts.map((acc, i) => {
            const typeInfo = getAccountTypeInfo(acc.accountType || 'Manual');
            const TypeIcon = typeInfo.icon;
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "group relative rounded-2xl border overflow-hidden transition-all hover:shadow-lg",
                  "bg-card dark:bg-zinc-900/50",
                  "border-border dark:border-white/[0.08]",
                  "hover:border-primary/30",
                  selectedForDelete.has(acc.accountName) && "ring-2 ring-red-500/50 border-red-500/30"
                )}
              >
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                  selectedForDelete.has(acc.accountName) ? "bg-red-500" : acc.checked ? "bg-primary" : "bg-muted"
                )} />
                
                <div className="p-5 pl-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleSelectAccount(acc.accountName)}
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0",
                          selectedForDelete.has(acc.accountName)
                            ? "bg-red-500 text-white"
                            : "border-2 border-border hover:border-primary/50"
                        )}
                      >
                        {selectedForDelete.has(acc.accountName) && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        typeInfo.bg
                      )}>
                        <TypeIcon className={cn("w-5 h-5", typeInfo.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{acc.accountName}</p>
                        <p className="text-xs text-muted-foreground truncate">{acc.broker}</p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0" ref={menuOpen === i ? menuRef : null}>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMenuOpen(menuOpen === i ? null : i)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </motion.button>
                      <AnimatePresence>
                        {menuOpen === i && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-20"
                          >
                            <button 
                              onClick={() => { setEditAccData(acc); setEditAcc(); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-muted-foreground" />
                              Edit
                            </button>
                            <button 
                              onClick={() => { setDeleteAccData(acc); setDeleteAcc(); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                      typeInfo.bg, typeInfo.color
                    )}>
                      {typeInfo.label}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {formatBalance(acc.accountBalance || 0)}
                    </span>
                  </div>
                  
                  {/* Sync status for Broker Sync accounts */}
                  {(acc.accountType === 'Broker Sync') && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Auto-syncing enabled
                      </div>
                      {acc.checked ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-500">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Syncs every 5 mins
                        </span>
                      )}
                    </div>
                  )}
                  
                  {acc.checked && acc.accountType !== 'Broker Sync' && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-emerald-500">
                      <Check className="w-3.5 h-3.5" />
                      Active in dashboard
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Account;
