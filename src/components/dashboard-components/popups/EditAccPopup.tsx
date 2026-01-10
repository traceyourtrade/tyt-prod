"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ChevronDown, 
  Wallet, 
  Settings2, 
  Zap,
  Upload,
  PenLine,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Server,
  Key,
  Lock,
  FileText,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import useAccountDetails from "@/store/accountdetails";
import Cookies from "js-cookie";

interface AccountDetails {
  accountName: string;
  accountBalance: string;
  description: string;
  accountId: string;
}

interface EditAccData {
  accountType?: string;
  broker?: string;
  investorId?: string;
  investorPw?: string;
  serverName?: string;
  accountName?: string;
  accountBalance?: string;
  description?: string;
  accountId?: string;
}

interface DropdownOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface BrokerOption {
  id: string;
  label: string;
  icon: string;
}

const accountTypeOptions: DropdownOption[] = [
  { id: "Broker Sync", label: "MT5 Auto-Sync", description: "Connected & auto-importing", icon: <Zap className="w-4 h-4" /> },
  { id: "File Upload", label: "File Upload", description: "Import from MT4/MT5 files", icon: <Upload className="w-4 h-4" /> },
  { id: "Manual", label: "Manual Entry", description: "Add trades manually", icon: <PenLine className="w-4 h-4" /> },
];

const brokers: BrokerOption[] = [
  { id: "MetaTrader 5", label: "MetaTrader 5", icon: "MT5" },
  { id: "MetaTrader 4", label: "MetaTrader 4", icon: "MT4" },
  { id: "Zerodha", label: "Zerodha", icon: "ZD" },
  { id: "Binance", label: "Binance", icon: "BN" },
  { id: "Upstox", label: "Upstox", icon: "UP" },
  { id: "Angel One", label: "Angel One", icon: "AO" },
];

const EditAccPopup = () => {
  const { showEditAcc, setEditAcc, editAccData } = calendarPopUp();
  const { setAccounts } = useAccountDetails();
  const { setAlertBoxG, accStatusPolling } = notifications();

  const [accountType, setAccountType] = useState<string>("");
  const [broker, setBroker] = useState<string>("");
  const [investorId, setInvestorId] = useState<string>("");
  const [investorPw, setInvestorPw] = useState<string>("");
  const [server, setServer] = useState<string>("");
  const [accountDetails, setAccDetails] = useState<AccountDetails>({
    accountName: "",
    accountBalance: "",
    description: "",
    accountId: ""
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);

  const accountTypeRef = useRef<HTMLDivElement>(null);
  const brokerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = editAccData as EditAccData;
    setAccountType(data.accountType || "");
    setBroker(data.broker || "");
    setInvestorId(data.investorId || "");
    setInvestorPw(data.investorPw || "");
    setServer(data.serverName || "");
    setAccDetails({
      accountName: data.accountName || "",
      accountBalance: data.accountBalance || "",
      description: data.description || "",
      accountId: data.accountId || ""
    });
  }, [editAccData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountTypeRef.current && !accountTypeRef.current.contains(event.target as Node)) {
        setShowAccountTypeDropdown(false);
      }
      if (brokerRef.current && !brokerRef.current.contains(event.target as Node)) {
        setShowBrokerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAccDetails({ ...accountDetails, [name]: value });
  };

  const tokenn = Cookies.get("authToken");

  const submitFun = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (accountType === "Broker Sync") {
      const { accountName, description } = accountDetails;

      if (!accountType) {
        setError("Please select account type");
        setIsSubmitting(false);
        return;
      }
      if (!broker) {
        setError("Please select a broker");
        setIsSubmitting(false);
        return;
      }

      try {
        const res = await fetch('/api/dashboard/put', {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: editAccData.accountId,
            accountName,
            accountType,
            broker,
            investorId,
            investorPw,
            server,
            description,
            tokenn,
            apiName: "updateAsyncCredentials"
          })
        });

        const data = await res.json();

        if (res.status === 200) {
          setSuccess("Account updated successfully!");
          setTimeout(() => {
            setEditAcc();
            if (data.message === "Account updated successfully (no credential changes)") {
              setAlertBoxG("Account details updated", "success");
            } else if (data.message === "Account updated successfully, credentials changed and synced") {
              setAlertBoxG("Credentials updated - syncing your trades...", "async-alert");
              accStatusPolling(accountName);
            }
            setAccounts();
          }, 1500);
        } else {
          handleApiError(data.error);
        }
      } catch (error) {
        setError("Something went wrong. Please try again.");
      }
    } else {
      const { accountName, accountBalance, description } = accountDetails;

      if (!accountType) {
        setError("Please select account type");
        setIsSubmitting(false);
        return;
      }
      if (!broker) {
        setError("Please select a broker");
        setIsSubmitting(false);
        return;
      }

      try {
        const res = await fetch(`/api/dashboard/put`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountName,
            accountBalance,
            accountType,
            broker,
            description,
            tokenn,
            accountId: editAccData.accountId,
            apiName: 'updateFileManualCredentials'
          })
        });

        const data = await res.json();

        if (res.status === 200) {
          setSuccess("Account updated successfully!");
          setTimeout(() => {
            setEditAcc();
            setAlertBoxG("Account updated successfully", "success");
            setAccounts();
          }, 1500);
        } else {
          handleApiError(data.error);
        }
      } catch (error) {
        setError("Something went wrong. Please try again.");
      }
    }

    setIsSubmitting(false);
  };

  const handleApiError = (errorMsg: string) => {
    if (errorMsg === "User not authenticated") {
      setError("Authentication failed. Please log in again.");
    } else if (errorMsg === "Enter all the details") {
      setError("Please fill in all required fields.");
    } else if (errorMsg === "Account already exists" || errorMsg === "Account name already taken") {
      setError("An account with this name already exists.");
    } else {
      setError(errorMsg || "Something went wrong.");
    }
  };

  const selectedAccountType = accountTypeOptions.find(opt => opt.id === accountType);
  const selectedBroker = brokers.find(b => b.id === broker);

  if (!showEditAcc) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={() => setEditAcc()}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-border shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditAcc()}
                className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                    <Pencil className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Edit Account</h2>
                    <p className="text-xs text-muted-foreground">Update your account settings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Account Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Account Name
              </label>
              <input
                type="text"
                name="accountName"
                value={accountDetails.accountName}
                onChange={handleOnChange}
                placeholder="My Trading Account"
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50",
                  "text-foreground placeholder:text-muted-foreground text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  "transition-all duration-200"
                )}
              />
            </div>

            {/* Account Type Dropdown */}
            <div className="space-y-2" ref={accountTypeRef}>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Account Type
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountTypeDropdown(!showAccountTypeDropdown);
                    setShowBrokerDropdown(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50",
                    "flex items-center justify-between gap-2 text-left",
                    "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all duration-200",
                    showAccountTypeDropdown && "border-primary/50 ring-2 ring-primary/20"
                  )}
                >
                  {selectedAccountType ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {selectedAccountType.icon}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">{selectedAccountType.label}</span>
                        <p className="text-xs text-muted-foreground">{selectedAccountType.description}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Select account type</span>
                  )}
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    showAccountTypeDropdown && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showAccountTypeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                    >
                      {accountTypeOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setAccountType(option.id);
                            setShowAccountTypeDropdown(false);
                            if (option.id === "Broker Sync") {
                              setBroker("MetaTrader 5");
                            }
                          }}
                          className={cn(
                            "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                            "hover:bg-muted/50",
                            accountType === option.id && "bg-primary/10"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            accountType === option.id ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground"
                          )}>
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground">{option.label}</span>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                          {accountType === option.id && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Account Balance (for File Upload and Manual) */}
            <AnimatePresence>
              {(accountType === "File Upload" || accountType === "Manual") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Account Balance
                  </label>
                  <input
                    type="number"
                    name="accountBalance"
                    value={accountDetails.accountBalance}
                    onChange={handleOnChange}
                    placeholder="50000"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50",
                      "text-foreground placeholder:text-muted-foreground text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                      "transition-all duration-200"
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Broker Dropdown */}
            <div className="space-y-2" ref={brokerRef}>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Broker
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowBrokerDropdown(!showBrokerDropdown);
                    setShowAccountTypeDropdown(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50",
                    "flex items-center justify-between gap-2 text-left",
                    "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all duration-200",
                    showBrokerDropdown && "border-primary/50 ring-2 ring-primary/20"
                  )}
                >
                  {selectedBroker ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                        {selectedBroker.icon}
                      </div>
                      <span className="text-sm font-medium text-foreground">{selectedBroker.label}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Select broker</span>
                  )}
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    showBrokerDropdown && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showBrokerDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-[200px] overflow-y-auto"
                    >
                      {(accountType === "Broker Sync" ? brokers.filter(b => b.id === "MetaTrader 5") : brokers).map((brokerItem) => (
                        <button
                          key={brokerItem.id}
                          type="button"
                          onClick={() => {
                            setBroker(brokerItem.id);
                            setShowBrokerDropdown(false);
                          }}
                          className={cn(
                            "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                            "hover:bg-muted/50",
                            broker === brokerItem.id && "bg-primary/10"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                            broker === brokerItem.id ? "bg-primary text-white" : "bg-muted text-foreground"
                          )}>
                            {brokerItem.icon}
                          </div>
                          <span className="text-sm font-medium text-foreground">{brokerItem.label}</span>
                          {broker === brokerItem.id && (
                            <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* MT5 Credentials */}
            <AnimatePresence>
              {accountType === "Broker Sync" && broker === "MetaTrader 5" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-500">Credential Update</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Changing credentials will trigger a re-sync of your trades
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Investor ID
                    </label>
                    <input
                      type="text"
                      value={investorId}
                      onChange={(e) => setInvestorId(e.target.value)}
                      placeholder="Your MT5 investor ID"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50",
                        "text-foreground placeholder:text-muted-foreground text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                        "transition-all duration-200"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Investor Password
                    </label>
                    <input
                      type="password"
                      value={investorPw}
                      onChange={(e) => setInvestorPw(e.target.value)}
                      placeholder="Your MT5 investor password"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50",
                        "text-foreground placeholder:text-muted-foreground text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                        "transition-all duration-200"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={server}
                      onChange={(e) => setServer(e.target.value)}
                      placeholder="e.g., ICMarketsSC-Demo"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50",
                        "text-foreground placeholder:text-muted-foreground text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                        "transition-all duration-200"
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
                <span className="text-xs text-muted-foreground/60">(Optional)</span>
              </label>
              <textarea
                name="description"
                value={accountDetails.description}
                onChange={handleOnChange}
                placeholder="Add notes about this account..."
                rows={3}
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 resize-none",
                  "text-foreground placeholder:text-muted-foreground text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  "transition-all duration-200"
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border shrink-0 space-y-4">
            {/* Error/Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-sm text-green-500">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditAcc()}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-sm font-medium",
                  "bg-muted/50 text-muted-foreground hover:bg-muted",
                  "transition-all duration-200"
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitFun}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-sm font-medium",
                  "bg-primary text-white hover:bg-primary/90",
                  "shadow-lg shadow-primary/25",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Account"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditAccPopup;
