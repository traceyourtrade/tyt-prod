"use client";

import { TrendingUp, TrendingDown, Zap, BarChart3, Scale, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore";

interface Trade {
  Profit: number;
}

interface QuickStatsProps {
  dailyData: Trade[];
  streak?: number;
}

const QuickStats = ({ dailyData, streak = 0 }: QuickStatsProps) => {
  const { currency, exchangeRate } = useCurrencyStore();
  
  const totalPnL = (dailyData || []).reduce((sum, trade) => sum + (trade.Profit || 0), 0);
  const winners = (dailyData || []).filter(trade => trade.Profit > 0).length;
  const losers = (dailyData || []).filter(trade => trade.Profit < 0).length;
  const totalTrades = dailyData?.length || 0;
  const winRate = totalTrades ? Math.round((winners / totalTrades) * 100) : 0;
  
  const totalWins = (dailyData || []).filter(t => t.Profit > 0).reduce((sum, t) => sum + t.Profit, 0);
  const totalLosses = Math.abs((dailyData || []).filter(t => t.Profit < 0).reduce((sum, t) => sum + t.Profit, 0));
  const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? "∞" : "0.00";

  const avgWin = winners > 0 ? (totalWins / winners) : 0;
  const avgLoss = losers > 0 ? (totalLosses / losers) : 0;
  const riskReward = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : avgWin > 0 ? "∞" : "0.00";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Quick Stats
        </h3>
      </div>

      {/* Win Rate Card */}
      <div className="bg-card border border-border rounded-2xl p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Win Rate</span>
          <span className={cn(
            "text-2xl font-bold tabular-nums",
            winRate >= 50 ? "text-profit" : "text-loss"
          )}>
            {winRate}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-2.5 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className={cn(
              "absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out",
              winRate >= 50 ? "bg-gradient-to-r from-profit/80 to-profit" : "bg-gradient-to-r from-loss/80 to-loss"
            )}
            style={{ width: `${winRate}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-profit" />
            <span className="text-xs font-medium text-profit">{winners} wins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-loss">{losers} losses</span>
            <div className="w-2 h-2 rounded-full bg-loss" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Profit Factor */}
        <div className="bg-card border border-border rounded-xl p-3.5 group hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Profit Factor</span>
          </div>
          <p className={cn(
            "text-xl font-bold tabular-nums",
            parseFloat(profitFactor) >= 1.5 ? "text-profit" : parseFloat(profitFactor) >= 1 ? "text-foreground" : "text-loss"
          )}>
            {profitFactor}
          </p>
        </div>

        {/* Total Trades */}
        <div className="bg-card border border-border rounded-xl p-3.5 group hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total Trades</span>
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">{totalTrades}</p>
        </div>

        {/* Avg Win */}
        <div className="bg-card border border-border rounded-xl p-3.5 group hover:border-profit/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-profit/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-profit" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Avg Win</span>
          </div>
          <p className="text-xl font-bold text-profit tabular-nums">
            {formatCompactCurrency(avgWin, currency, exchangeRate)}
          </p>
        </div>

        {/* Avg Loss */}
        <div className="bg-card border border-border rounded-xl p-3.5 group hover:border-loss/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-loss/10 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-loss" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Avg Loss</span>
          </div>
          <p className="text-xl font-bold text-loss tabular-nums">
            {formatCompactCurrency(avgLoss, currency, exchangeRate)}
          </p>
        </div>
      </div>

      {/* Risk/Reward */}
      <div className="bg-card border border-border rounded-xl p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Risk/Reward</span>
          </div>
          <span className={cn(
            "text-lg font-bold tabular-nums",
            parseFloat(riskReward) >= 1.5 ? "text-profit" : "text-foreground"
          )}>
            1 : {riskReward}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
