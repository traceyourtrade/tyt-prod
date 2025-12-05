"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Trophy, 
  Zap, 
  Flame,
  Star,
  Activity
} from "lucide-react";
import { useEffect, useState } from "react";

interface Trade {
  Profit: number;
}

interface QuickStatsProps {
  dailyData: Trade[];
  streak?: number;
}

const AnimatedNumber = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current = (value / steps) * step;
      if (step >= steps) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</>;
};

const CircularProgress = ({ value, max, color, size = 60 }: { value: number; max: number; color: string; size?: number }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

const QuickStats = ({ dailyData, streak = 0 }: QuickStatsProps) => {
  const totalPnL = (dailyData || []).reduce((sum, trade) => sum + (trade.Profit || 0), 0);
  const formattedPnL = totalPnL < 0 ? `-$${Math.abs(totalPnL).toFixed(2)}` : `$${totalPnL.toFixed(2)}`;
  const winners = (dailyData || []).filter(trade => trade.Profit > 0).length;
  const losers = (dailyData || []).filter(trade => trade.Profit < 0).length;
  const totalTrades = dailyData?.length || 0;
  const winRate = totalTrades ? Math.round((winners / totalTrades) * 100) : 0;
  
  const totalWins = (dailyData || []).filter(t => t.Profit > 0).reduce((sum, t) => sum + t.Profit, 0);
  const totalLosses = Math.abs((dailyData || []).filter(t => t.Profit < 0).reduce((sum, t) => sum + t.Profit, 0));
  const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? "∞" : "0.00";

  const avgWin = winners > 0 ? (totalWins / winners) : 0;
  const avgLoss = losers > 0 ? (totalLosses / losers) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Quick Stats
        </h3>
        {streak >= 2 && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-1 text-xs font-medium text-orange-500"
          >
            <Flame className="w-3 h-3" />
            {streak} streak
          </motion.div>
        )}
      </div>

      {/* Win Rate Ring */}
      <motion.div 
        variants={itemVariants}
        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4"
      >
        <div className="flex items-center gap-4">
          <CircularProgress value={winRate} max={100} color="var(--profit)" size={70} />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-foreground">
              <AnimatedNumber value={winRate} />%
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-profit">{winners}W</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-loss">{losers}L</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 transition-shadow hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center"
            >
              <Zap className="w-4 h-4 text-primary" />
            </motion.div>
          </div>
          <p className="text-2xl font-bold text-foreground">{profitFactor}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Profit Factor</p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 transition-shadow hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center"
            >
              <Star className="w-4 h-4 text-primary" />
            </motion.div>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalTrades}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Trades</p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-profit/5 to-profit/10 border border-profit/20 rounded-2xl p-4 transition-shadow hover:shadow-lg hover:shadow-profit/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div 
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-8 h-8 rounded-xl bg-profit/20 flex items-center justify-center"
            >
              <TrendingUp className="w-4 h-4 text-profit" />
            </motion.div>
          </div>
          <p className="text-2xl font-bold text-profit">
            $<AnimatedNumber value={avgWin} decimals={0} />
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg Win</p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-loss/5 to-loss/10 border border-loss/20 rounded-2xl p-4 transition-shadow hover:shadow-lg hover:shadow-loss/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div 
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-8 h-8 rounded-xl bg-loss/20 flex items-center justify-center"
            >
              <TrendingDown className="w-4 h-4 text-loss" />
            </motion.div>
          </div>
          <p className="text-2xl font-bold text-loss">
            $<AnimatedNumber value={avgLoss} decimals={0} />
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg Loss</p>
        </motion.div>
      </div>

      {/* Risk/Reward Ratio */}
      {avgLoss > 0 && avgWin > 0 && (
        <motion.div 
          variants={itemVariants}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Risk/Reward</p>
            <p className="text-sm font-bold text-primary">
              1 : {(avgWin / avgLoss).toFixed(2)}
            </p>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((avgWin / (avgWin + avgLoss)) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Risk</span>
            <span>Reward</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuickStats;
