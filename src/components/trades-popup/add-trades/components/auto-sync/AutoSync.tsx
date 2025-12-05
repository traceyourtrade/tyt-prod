'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  Zap,
  Shield,
  Globe,
  Settings,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrokerConnection {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: "connected" | "disconnected" | "coming_soon";
  lastSync?: string;
  tradesCount?: number;
}

const brokerConnections: BrokerConnection[] = [
  {
    id: "mt5",
    name: "MetaTrader 5",
    logo: "MT5",
    description: "Connect your MT5 account for automatic trade sync",
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
    id: "binance",
    name: "Binance",
    logo: "BN",
    description: "Connect your Binance account via API",
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

const BrokerCard = ({ broker }: { broker: BrokerConnection }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusIcon = () => {
    switch (broker.status) {
      case "connected":
        return <CheckCircle2 className="w-5 h-5 text-profit" />;
      case "disconnected":
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case "coming_soon":
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (broker.status) {
      case "connected":
        return "Connected";
      case "disconnected":
        return "Disconnected";
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
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all duration-200 cursor-pointer",
        "bg-muted/20 border-border/50",
        broker.status === "coming_soon" 
          ? "opacity-70 hover:opacity-100" 
          : "hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className={cn(
          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm",
          getLogoColor()
        )}>
          {broker.logo}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{broker.name}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              broker.status === "connected" && "bg-profit/10 text-profit",
              broker.status === "disconnected" && "bg-warning/10 text-warning",
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

        {/* Action */}
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

const AutoSync = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-1"
    >
      {/* Header Info */}
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

        {/* Features */}
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

      {/* Broker Connections */}
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
              <BrokerCard broker={broker} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Coming Soon Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-muted/20 border border-border/50 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Settings className="w-6 h-6 text-primary animate-spin-slow" />
        </div>
        <h4 className="font-medium text-foreground mb-1">We&apos;re Building This</h4>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Auto-sync is coming soon. For now, use{" "}
          <span className="text-primary font-medium">File Upload</span> or{" "}
          <span className="text-primary font-medium">Manual Entry</span> to add your trades.
        </p>
        
        {/* Request Feature */}
        <button className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors inline-flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Request a Broker
        </button>
      </motion.div>
    </motion.div>
  );
};

export default AutoSync;
