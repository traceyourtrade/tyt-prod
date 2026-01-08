'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link2, 
  RefreshCw, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Zap,
  Shield,
  Globe,
  ExternalLink,
  X,
  Server,
  Key,
  User,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAccountDetails from "@/store/accountdetails";
import notifications from "@/store/notifications";

interface BrokerConnection {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: "connected" | "disconnected" | "coming_soon";
  lastSync?: string;
  tradesCount?: number;
}

const MAX_TOTAL_ACCOUNTS = 10;
const MAX_BROKER_SYNC_ACCOUNTS = 4;

const brokerConnections: BrokerConnection[] = [
  {
    id: "mt5",
    name: "MetaTrader 5",
    logo: "MT5",
    description: "Connect your MT5 account for automatic trade sync",
    status: "disconnected"
  },
  {
    id: "binance",
    name: "Binance",
    logo: "BN",
    description: "Connect your Binance account via API",
    status: "coming_soon"
  },
  {
    id: "angelone",
    name: "Angel One",
    logo: "AO",
    description: "Sync trades from your Angel One account",
    status: "coming_soon"
  },
  {
    id: "upstox",
    name: "Upstox",
    logo: "UP",
    description: "Connect your Upstox account for trade sync",
    status: "coming_soon"
  },
  {
    id: "mt4",
    name: "MetaTrader 4",
    logo: "MT4",
    description: "Sync trades from your MT4 trading platform",
    status: "coming_soon"
  },
  {
    id: "tradingview",
    name: "TradingView",
    logo: "TV",
    description: "Import trades from TradingView paper trading",
    status: "coming_soon"
  },
  {
    id: "zerodha",
    name: "Zerodha",
    logo: "ZD",
    description: "Sync trades from your Zerodha Kite account",
    status: "coming_soon"
  },
  {
    id: "interactive",
    name: "Interactive Brokers",
    logo: "IB",
    description: "Connect your IBKR account for trade sync",
    status: "coming_soon"
  }
];

interface BrokerCardProps {
  broker: BrokerConnection;
  onClick?: () => void;
}

const BrokerCard = ({ broker, onClick }: BrokerCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusIcon = () => {
    switch (broker.status) {
      case "connected":
        return <CheckCircle2 className="w-5 h-5 text-profit" />;
      case "disconnected":
        return <Link2 className="w-5 h-5 text-primary" />;
      case "coming_soon":
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (broker.status) {
      case "connected":
        return "Connected";
      case "disconnected":
        return "Available";
      case "coming_soon":
        return "Coming Soon";
    }
  };

  const getLogoColor = () => {
    switch (broker.id) {
      case "mt5":
      case "mt4":
        return "from-blue-500 to-blue-600";
      case "tradingview":
        return "from-purple-500 to-purple-600";
      case "binance":
        return "from-yellow-500 to-yellow-600";
      case "zerodha":
        return "from-red-500 to-red-600";
      case "interactive":
        return "from-cyan-500 to-cyan-600";
      case "angelone":
        return "from-green-500 to-green-600";
      case "upstox":
        return "from-violet-500 to-violet-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const handleClick = () => {
    if (broker.status !== "coming_soon" && onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: broker.status !== "coming_soon" ? 1.02 : 1 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all duration-200",
        "bg-muted/20 border-border/50",
        broker.status === "coming_soon" 
          ? "opacity-70 cursor-not-allowed" 
          : "cursor-pointer hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm",
          getLogoColor()
        )}>
          {broker.logo}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{broker.name}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              broker.status === "connected" && "bg-profit/10 text-profit",
              broker.status === "disconnected" && "bg-primary/10 text-primary",
              broker.status === "coming_soon" && "bg-muted text-muted-foreground"
            )}>
              {getStatusText()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {broker.description}
          </p>
          
          {broker.status === "connected" && broker.lastSync && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Last synced: {broker.lastSync}
              {broker.tradesCount && ` • ${broker.tradesCount} trades`}
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          {broker.status === "coming_soon" ? (
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <motion.div
              animate={{ x: isHovered ? 4 : 0 }}
              className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface MT5FormData {
  accountName: string;
  investorId: string;
  investorPw: string;
  server: string;
  isPropFirm: boolean;
}

const MT5ConnectionModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const { setAccounts } = useAccountDetails();
  const { setAlertBoxG, accStatusPolling } = notifications();
  
  const [formData, setFormData] = useState<MT5FormData>({
    accountName: "",
    investorId: "",
    investorPw: "",
    server: "",
    isPropFirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!formData.accountName.trim()) {
      setError("Please enter an account name");
      return;
    }
    if (!formData.investorId.trim()) {
      setError("Please enter your Investor ID");
      return;
    }
    if (!formData.investorPw.trim()) {
      setError("Please enter your Investor Password");
      return;
    }
    if (!formData.server.trim()) {
      setError("Please enter the server name");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/dashboard/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          apiName: "addAutoSyncAccount",
          accountName: formData.accountName,
          accountType: "Broker Sync",
          broker: "MetaTrader 5",
          description: "",
          investorId: formData.investorId,
          investorPw: formData.investorPw,
          serverName: formData.server,
          isPropFirm: formData.isPropFirm
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect account");
      }

      setSuccess("MT5 account connected successfully! Syncing trades...");
      setAlertBoxG("MT5 account connected! Trade sync in progress.", "Success");
      accStatusPolling(formData.accountName);
      
      setTimeout(() => {
        setAccounts();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Failed to connect MT5 account");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              MT5
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Connect MetaTrader 5</h3>
              <p className="text-xs text-muted-foreground">Enter your MT5 investor credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Name
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              placeholder="e.g., My MT5 Account"
              className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Investor ID (Login)
            </label>
            <input
              type="text"
              name="investorId"
              value={formData.investorId}
              onChange={handleChange}
              placeholder="e.g., 12345678"
              className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              Investor Password
            </label>
            <input
              type="password"
              name="investorPw"
              value={formData.investorPw}
              onChange={handleChange}
              placeholder="Your investor password"
              className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Use the read-only investor password (not master password)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Server className="w-4 h-4 text-muted-foreground" />
              Server Name
            </label>
            <input
              type="text"
              name="server"
              value={formData.server}
              onChange={handleChange}
              placeholder="e.g., Exness-MT5Real"
              className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="checkbox"
              name="isPropFirm"
              checked={formData.isPropFirm}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Prop Firm Account</span>
              <p className="text-xs text-muted-foreground">Enable to track this in Prop Firm Mode</p>
            </div>
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-loss/10 border border-loss/20 text-loss text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-profit/10 border border-profit/20 text-profit text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-muted/30 text-foreground font-medium hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Connect
                </>
              )}
            </button>
          </div>
        </form>

        <div className="px-6 pb-6">
          <div className="p-4 rounded-xl bg-muted/20 border border-border">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-profit flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Secure Connection</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your credentials are encrypted and stored securely. We only use read-only access to sync your trades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AutoSync = () => {
  const [showMT5Modal, setShowMT5Modal] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const { accounts } = useAccountDetails();
  const { setAlertBoxG } = notifications();

  const totalAccounts = accounts.length;
  const brokerSyncAccounts = accounts.filter(acc => acc.accountType === "Broker Sync").length;

  useEffect(() => {
    const checkRedStatusAccounts = async () => {
      try {
        const response = await fetch("/api/dashboard/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ apiName: "getRedStatusAccounts" }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.redAccounts && data.redAccounts.length > 0) {
            data.redAccounts.forEach((accName: string) => {
              setAlertBoxG(`"${accName}" credentials are incorrect. Please recheck and update your investor ID & password.`, "error");
            });
          }
        }
      } catch (error) {
        console.error("Error checking red status accounts:", error);
      }
    };

    if (accounts.length > 0) {
      checkRedStatusAccounts();
    }
  }, [accounts, setAlertBoxG]);

  const handleBrokerClick = (brokerId: string) => {
    setLimitError(null);
    
    if (totalAccounts >= MAX_TOTAL_ACCOUNTS) {
      setLimitError(`You've reached the maximum limit of ${MAX_TOTAL_ACCOUNTS} accounts. Please delete an existing account to add a new one.`);
      return;
    }
    
    if (brokerSyncAccounts >= MAX_BROKER_SYNC_ACCOUNTS) {
      setLimitError(`You've reached the maximum limit of ${MAX_BROKER_SYNC_ACCOUNTS} Broker Sync accounts. Please delete an existing broker sync account to add a new one.`);
      return;
    }
    
    if (brokerId === "mt5") {
      setShowMT5Modal(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-1"
      >
        {limitError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-loss/10 border border-loss/20 text-loss"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{limitError}</p>
          </motion.div>
        )}

        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg mb-1">
                Automatic Trade Sync
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your trading accounts to automatically import trades. 
                No more manual data entry - your journal stays up to date.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 text-primary" />
              <span>Auto-sync</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-profit" />
              <span>Secure API</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Real-time</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              Available Connections
            </h4>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              {brokerConnections.length} brokers
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {brokerConnections.map((broker, index) => (
              <motion.div
                key={broker.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BrokerCard 
                  broker={broker} 
                  onClick={() => handleBrokerClick(broker.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-muted/20 border border-border/50 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h4 className="font-medium text-foreground mb-1">Click to Connect</h4>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Select an available broker above to connect your trading account.
            More integrations are coming soon!
          </p>
          
          <button className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Request a Broker
          </button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showMT5Modal && (
          <MT5ConnectionModal 
            isOpen={showMT5Modal} 
            onClose={() => setShowMT5Modal(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AutoSync;
