"use client";

import { TrendingUp, TrendingDown, Zap, BarChart3 } from "lucide-react";
import { formatCompactNumber } from "@/utils/formatNumber";

interface Trade {
  Profit: number;
}

interface QuickStatsProps {
  dailyData: Trade[];
  streak?: number;
}

const QuickStats = ({ dailyData, streak = 0 }: QuickStatsProps) => {
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          Quick Stats
        </h3>
        {streak >= 2 && (
          <span className="text-xs font-medium text-orange-500">
            🔥 {streak} streak
          </span>
        )}
      </div>

      {/* Win Rate Card */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Win Rate</span>
          <span className="text-lg font-bold text-foreground">{winRate}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${winRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-profit">{winners} wins</span>
          <span className="text-loss">{losers} losses</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase">Profit Factor</span>
          </div>
          <p className="text-lg font-bold text-foreground">{profitFactor}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase">Total Trades</span>
          </div>
          <p className="text-lg font-bold text-foreground">{totalTrades}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-profit" />
            <span className="text-[10px] text-muted-foreground uppercase">Avg Win</span>
          </div>
          <p className="text-lg font-bold text-profit">${formatCompactNumber(avgWin, 0)}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-loss" />
            <span className="text-[10px] text-muted-foreground uppercase">Avg Loss</span>
          </div>
          <p className="text-lg font-bold text-loss">${formatCompactNumber(avgLoss, 0)}</p>
        </div>
      </div>

      {/* R:R Ratio */}
      {avgLoss > 0 && avgWin > 0 && (
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Risk/Reward</span>
            <span className="text-sm font-bold text-foreground">1 : {riskReward}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickStats;
