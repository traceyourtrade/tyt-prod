"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, MoreVertical, Trash2, Edit3, Wallet, Check, RefreshCw, Upload, Link
} from "lucide-react";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
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
                  "hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                  acc.checked ? "bg-primary" : "bg-muted"
                )} />
                
                <div className="p-5 pl-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
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
                  
                  {acc.checked && (
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
