"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ChevronDown, 
  Building2, 
  Wallet, 
  FileText, 
  Settings2, 
  Zap,
  Upload,
  PenLine,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Rocket,
  Calendar,
  Globe,
  TrendingUp,
  Bitcoin,
  IndianRupee,
  DollarSign,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import useAccountDetails from "@/store/accountdetails";

interface AccountDetails {
  accountName: string;
  accountBalance: string;
  description: string;
  isPropFirm: boolean;
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

interface MarketCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  brokers: BrokerOption[];
}

const accountTypeOptions: DropdownOption[] = [
  { id: "Broker Sync", label: "Broker Sync", description: "Auto-sync trades via API", icon: <Zap className="w-4 h-4" /> },
  { id: "File Upload", label: "File Upload", description: "Import from MT4/MT5 files", icon: <Upload className="w-4 h-4" /> },
  { id: "Manual", label: "Manual Entry", description: "Add trades manually", icon: <PenLine className="w-4 h-4" /> },
];

const marketCategories: MarketCategory[] = [
  {
    id: "forex",
    label: "Forex / CFDs",
    icon: <Globe className="w-4 h-4" />,
    color: "from-blue-500 to-cyan-500",
    brokers: [
      { id: "MetaTrader 5", label: "MetaTrader 5", icon: "MT5" },
      { id: "MetaTrader 4", label: "MetaTrader 4", icon: "MT4" },
      { id: "cTrader", label: "cTrader", icon: "cT" },
      { id: "TradingView", label: "TradingView", icon: "TV" },
      { id: "IC Markets", label: "IC Markets", icon: "IC" },
      { id: "Pepperstone", label: "Pepperstone", icon: "PP" },
      { id: "OANDA", label: "OANDA", icon: "OA" },
      { id: "XM", label: "XM", icon: "XM" },
    ]
  },
  {
    id: "indian",
    label: "Indian Markets",
    icon: <IndianRupee className="w-4 h-4" />,
    color: "from-orange-500 to-amber-500",
    brokers: [
      { id: "Zerodha", label: "Zerodha", icon: "ZD" },
      { id: "Upstox", label: "Upstox", icon: "UP" },
      { id: "Angel One", label: "Angel One", icon: "AO" },
      { id: "Groww", label: "Groww", icon: "GW" },
      { id: "5paisa", label: "5paisa", icon: "5P" },
      { id: "Dhan", label: "Dhan", icon: "DH" },
      { id: "ICICI Direct", label: "ICICI Direct", icon: "ID" },
      { id: "HDFC Securities", label: "HDFC Securities", icon: "HS" },
    ]
  },
  {
    id: "crypto",
    label: "Crypto",
    icon: <Bitcoin className="w-4 h-4" />,
    color: "from-yellow-500 to-orange-500",
    brokers: [
      { id: "Binance", label: "Binance", icon: "BN" },
      { id: "Bybit", label: "Bybit", icon: "BB" },
      { id: "OKX", label: "OKX", icon: "OK" },
      { id: "Coinbase", label: "Coinbase", icon: "CB" },
      { id: "Kraken", label: "Kraken", icon: "KR" },
      { id: "KuCoin", label: "KuCoin", icon: "KC" },
      { id: "Bitget", label: "Bitget", icon: "BG" },
      { id: "Gate.io", label: "Gate.io", icon: "GT" },
    ]
  },
  {
    id: "us",
    label: "US Markets",
    icon: <DollarSign className="w-4 h-4" />,
    color: "from-emerald-500 to-teal-500",
    brokers: [
      { id: "Interactive Brokers", label: "Interactive Brokers", icon: "IB" },
      { id: "TD Ameritrade", label: "TD Ameritrade", icon: "TD" },
      { id: "Robinhood", label: "Robinhood", icon: "RH" },
      { id: "Charles Schwab", label: "Charles Schwab", icon: "CS" },
      { id: "Fidelity", label: "Fidelity", icon: "FD" },
      { id: "E*TRADE", label: "E*TRADE", icon: "ET" },
      { id: "Webull", label: "Webull", icon: "WB" },
      { id: "Tastytrade", label: "Tastytrade", icon: "TT" },
    ]
  },
  {
    id: "other",
    label: "Other",
    icon: <MoreHorizontal className="w-4 h-4" />,
    color: "from-gray-500 to-slate-500",
    brokers: [
      { id: "Other", label: "Other / Custom", icon: "?" },
    ]
  }
];

const AddAccPopup = () => {
  const { showAddAcc, setAddAcc } = calendarPopUp();
  const { setAccounts } = useAccountDetails();
  const { setAlertBoxG, accStatusPolling } = notifications();

  const [accountType, setAccountType] = useState<string>("");
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [broker, setBroker] = useState<string>("");
  const [investorId, setInvestorId] = useState<string>("");
  const [investorPw, setInvestorPw] = useState<string>("");
  const [server, setServer] = useState<string>("");
  const [accountDetails, setAccDetails] = useState<AccountDetails>({
    accountName: "",
    accountBalance: "",
    description: "",
    isPropFirm: false
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);

  const accountTypeRef = useRef<HTMLDivElement>(null);
  const brokerRef = useRef<HTMLDivElement>(null);

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

  const submitFun = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!accountType) {
      setError("Please select an account type");
      return;
    }
    if (!broker) {
      setError("Please select a broker");
      return;
    }
    if (!accountDetails.accountName.trim()) {
      setError("Please enter an account name");
      return;
    }

    setIsSubmitting(true);

    if (accountType === "Broker Sync") {
      const { accountName, description, isPropFirm } = accountDetails;

      try {
        const res = await fetch(`/api/dashboard/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountName, 
            accountType, 
            broker, 
            investorId, 
            password: investorPw, 
            serverName: server, 
            description,
            isPropFirm,
            apiName:'createAutoSyncAccount'
          })
        });

        const data = await res.json();

        if (res.status === 200) {
          setSuccess("Account created successfully!");
          setTimeout(() => {
            setAddAcc();
            setAlertBoxG("Your account details are being fetched, this may take few seconds", "async-alert");
            accStatusPolling(accountName);
            setAccounts();
          }, 1500);
        } else {
          handleApiError(data.error);
        }
      } catch (error) {
        setError("Something went wrong. Please try again.");
      }
    } else {
      const { accountName, accountBalance, description, isPropFirm } = accountDetails;

      try {
        const res = await fetch(`/api/dashboard/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountName, 
            accountBalance, 
            accountType, 
            broker, 
            description,
            isPropFirm,
            apiName:'createAccount'
          })
        });

        const data = await res.json();

        if (res.status === 200) {
          setSuccess("Account created successfully!");
          setTimeout(() => {
            setAddAcc();
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
    } else if (errorMsg === "Account already exists") {
      setError("An account with this name already exists.");
    } else {
      setError(errorMsg || "Something went wrong.");
    }
  };

  const handleMarketSelect = (marketId: string) => {
    setSelectedMarket(marketId);
    setBroker("");
  };

  const handleBrokerSelect = (brokerId: string) => {
    setBroker(brokerId);
    setShowBrokerDropdown(false);
  };

  const selectedAccountType = accountTypeOptions.find(opt => opt.id === accountType);
  const selectedMarketCategory = marketCategories.find(m => m.id === selectedMarket);
  const selectedBrokerObj = selectedMarketCategory?.brokers.find(b => b.id === broker);

  if (!showAddAcc) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={() => setAddAcc()}
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
                onClick={() => setAddAcc()}
                className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Add New Account</h2>
                    <p className="text-xs text-muted-foreground">Connect your trading account</p>
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

            {/* Account Mode Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Account Mode
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/30 border border-border/50">
                <button
                  type="button"
                  onClick={() => setAccDetails({ ...accountDetails, isPropFirm: false })}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                    !accountDetails.isPropFirm 
                      ? "bg-primary text-white shadow-md" 
                      : "bg-transparent text-muted-foreground hover:bg-muted"
                  )}
                >
                  Normal Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccDetails({ ...accountDetails, isPropFirm: true });
                    setSelectedMarket("forex");
                    if (!broker || !marketCategories.find(m => m.id === "forex")?.brokers.some(b => b.id === broker)) {
                      setBroker("MetaTrader 5");
                    }
                  }}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                    accountDetails.isPropFirm 
                      ? "bg-amber-500 text-white shadow-md" 
                      : "bg-transparent text-muted-foreground hover:bg-muted"
                  )}
                >
                  Prop Firm
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {accountDetails.isPropFirm 
                  ? "Prop firms focus on Forex & CFD instruments only" 
                  : "This account will show in Live Trading mode"
                }
              </p>
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
                              setSelectedMarket("forex");
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
                    Starting Balance
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

            {/* Market Category Selection - Hidden for Broker Sync and Prop Firm */}
            {accountType !== "Broker Sync" && !accountDetails.isPropFirm && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                What do you trade?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {marketCategories.map((market) => (
                  <motion.button
                    key={market.id}
                    type="button"
                    onClick={() => handleMarketSelect(market.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                      selectedMarket === market.id
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br",
                      market.color
                    )}>
                      {market.icon}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium text-center leading-tight",
                      selectedMarket === market.id ? "text-primary" : "text-muted-foreground"
                    )}>
                      {market.label}
                    </span>
                    {selectedMarket === market.id && (
                      <motion.div
                        layoutId="marketIndicator"
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            )}

            {/* Prop Firm Market Info */}
            {accountDetails.isPropFirm && accountType !== "Broker Sync" && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Forex / CFDs</p>
                  <p className="text-xs text-muted-foreground">Prop firms only support Forex & CFD trading</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
              </div>
            )}

            {/* Broker Selection - Hidden for Broker Sync only (shown for Prop Firm) */}
            {accountType !== "Broker Sync" && (
            <AnimatePresence>
              {(selectedMarket || accountDetails.isPropFirm) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                  ref={brokerRef}
                >
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Select Broker
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedMarketCategory?.brokers.map((brokerOpt) => (
                      <motion.button
                        key={brokerOpt.id}
                        type="button"
                        onClick={() => handleBrokerSelect(brokerOpt.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                          broker === brokerOpt.id
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                          broker === brokerOpt.id
                            ? `bg-gradient-to-br ${selectedMarketCategory?.color} text-white`
                            : "bg-muted text-muted-foreground"
                        )}>
                          {brokerOpt.icon}
                        </div>
                        <span className={cn(
                          "text-[10px] font-medium text-center leading-tight line-clamp-1",
                          broker === brokerOpt.id ? "text-primary" : "text-muted-foreground"
                        )}>
                          {brokerOpt.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            )}

            {/* Broker Sync Coming Soon Notice */}
            <AnimatePresence>
              {accountType === "Broker Sync" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/5 border border-amber-500/30">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 flex-shrink-0">
                        <Rocket className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-sm">
                            Coming Soon
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                            Feb 2025
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Broker auto-sync is launching soon. You'll be able to automatically import trades from your broker.
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-amber-400 text-xs font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>Stay tuned!</span>
                        </div>
                      </div>
                    </div>
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
                placeholder="Notes about this account..."
                rows={2}
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50",
                  "text-foreground placeholder:text-muted-foreground text-sm resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  "transition-all duration-200"
                )}
              />
            </div>

            {/* Error/Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border shrink-0 space-y-3">
            <motion.button
              type="button"
              onClick={submitFun}
              disabled={isSubmitting || !accountDetails.accountName || !broker}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200",
                "flex items-center justify-center gap-2",
                "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </motion.button>
            <p className="text-center text-xs text-muted-foreground">
              Need Help?
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddAccPopup;
