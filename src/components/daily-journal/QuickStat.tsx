"use client";

import { TrendingUp, TrendingDown, Target, Trophy, Activity, Zap } from "lucide-react";

interface Trade {
  Profit: number;
}

interface QuickStatsProps {
  dailyData: Trade[];
}

const QuickStats = ({ dailyData }: QuickStatsProps) => {
  const totalPnL = (dailyData || []).reduce((sum, trade) => sum + (trade.Profit || 0), 0);
  const formattedPnL = totalPnL < 0 ? `-$${Math.abs(totalPnL).toFixed(2)}` : `$${totalPnL.toFixed(2)}`;
  const winners = (dailyData || []).filter(trade => trade.Profit > 0).length;
  const losers = (dailyData || []).filter(trade => trade.Profit < 0).length;
  const totalTrades = dailyData?.length || 0;
  const winRate = totalTrades ? Math.round((winners / totalTrades) * 100) : 0;
  
  const totalWins = (dailyData || []).filter(t => t.Profit > 0).reduce((sum, t) => sum + t.Profit, 0);
  const totalLosses = Math.abs((dailyData || []).filter(t => t.Profit < 0).reduce((sum, t) => sum + t.Profit, 0));
  const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? "∞" : "0";

  const avgWin = winners > 0 ? (totalWins / winners).toFixed(2) : "0";
  const avgLoss = losers > 0 ? (totalLosses / losers).toFixed(2) : "0";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        Quick Stats
      </h3>

      {/* Main P&L Card */}
      <div className={`relative overflow-hidden rounded-2xl p-5 ${
        totalPnL >= 0 
          ? 'bg-gradient-to-br from-profit/10 via-profit/5 to-transparent border border-profit/20' 
          : 'bg-gradient-to-br from-loss/10 via-loss/5 to-transparent border border-loss/20'
      }`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net P&L</span>
            {totalPnL >= 0 ? (
              <TrendingUp className="w-4 h-4 text-profit" />
            ) : (
              <TrendingDown className="w-4 h-4 text-loss" />
            )}
          </div>
          <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formattedPnL}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{totalTrades} trades analyzed</p>
        </div>
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl ${
          totalPnL >= 0 ? 'bg-profit/20' : 'bg-loss/20'
        }`} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{winRate}%</p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{profitFactor}</p>
          <p className="text-xs text-muted-foreground">Profit Factor</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-profit" />
            </div>
          </div>
          <p className="text-2xl font-bold text-profit">{winners}</p>
          <p className="text-xs text-muted-foreground">Winners</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-loss/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-loss" />
            </div>
          </div>
          <p className="text-2xl font-bold text-loss">{losers}</p>
          <p className="text-xs text-muted-foreground">Losers</p>
        </div>
      </div>

      {/* Average Win/Loss */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground mb-1">Avg Win</p>
            <p className="text-lg font-bold text-profit">${avgWin}</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground mb-1">Avg Loss</p>
            <p className="text-lg font-bold text-loss">${avgLoss}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
