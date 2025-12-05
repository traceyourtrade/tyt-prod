"use client";

import React from 'react';
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";
import { TrendingUp, TrendingDown, DollarSign, Target, Percent, Scale, Activity, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import TinyChart from "./TinyChart";

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

interface DashWidgetsProps {
  data: { value: number }[];
  pnl: number | string;
  winrate?: number | string;
  winners?: number;
  losers?: number;
  profitF: number | string;
  avgProfits: number;
  avgLoses: number;
  rrRatio: number | string;
  accBal: number | string;
  totalProfits: number;
  totalLoses: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  valueColor?: 'profit' | 'loss' | 'default';
  children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  valueColor = 'default',
  children 
}) => {
  const getValueColor = () => {
    switch (valueColor) {
      case 'profit': return 'text-profit';
      case 'loss': return 'text-loss';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:border-border/80">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="p-2 rounded-lg bg-muted">
              {icon}
            </div>
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        {trend && trendValue && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            trend === 'up' ? "bg-profit/10 text-profit" : 
            trend === 'down' ? "bg-loss/10 text-loss" : 
            "bg-muted text-muted-foreground"
          )}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className={cn("text-2xl font-bold tracking-tight", getValueColor())}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

const DashWidgets: React.FC<DashWidgetsProps> = ({ 
  data, 
  pnl, 
  winners = 0, 
  losers = 0, 
  profitF, 
  avgProfits, 
  avgLoses, 
  rrRatio, 
  accBal, 
  totalProfits, 
  totalLoses 
}) => {
  const numericPnl = typeof pnl === 'string' ? parseFloat(pnl) : pnl;
  const winrate = winners || losers ? ((winners / (winners + losers)) * 100).toFixed(1) : '0';
  const totalTrades = winners + losers;
  
  const pnlFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(numericPnl));

  const balanceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof accBal === 'string' ? parseFloat(accBal) : accBal);

  const dataWinLoss = {
    labels: ["Wins", "Losses"],
    datasets: [
      {
        data: [winners, losers],
        backgroundColor: ["#10b981", "#ef4444"],
        hoverBackgroundColor: ["#34d399", "#f87171"],
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };

  const optionsWinLoss = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "75%",
    rotation: -90,
    circumference: 180,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    elements: {
      arc: { borderRadius: 4 },
    },
  };

  const avgProfitPercentage = avgProfits && avgLoses ? (avgProfits / (Math.abs(avgProfits) + Math.abs(avgLoses))) * 100 : 50;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {/* Net P&L */}
      <StatCard
        title="Net P&L"
        value={numericPnl >= 0 ? pnlFormatted : `-${pnlFormatted}`}
        icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
        trend={numericPnl >= 0 ? 'up' : 'down'}
        trendValue={numericPnl >= 0 ? '+' + ((numericPnl / (parseFloat(accBal as string) || 1)) * 100).toFixed(1) + '%' : ((numericPnl / (parseFloat(accBal as string) || 1)) * 100).toFixed(1) + '%'}
        valueColor={numericPnl >= 0 ? 'profit' : 'loss'}
      >
        <div className="w-24 h-12">
          <TinyChart data={data} />
        </div>
      </StatCard>

      {/* Win Rate */}
      <StatCard
        title="Win Rate"
        value={`${winrate}%`}
        subtitle={`${totalTrades} trades`}
        icon={<Target className="w-4 h-4 text-muted-foreground" />}
      >
        <div className="relative w-16 h-10">
          <Doughnut data={dataWinLoss} options={optionsWinLoss} />
          <div className="absolute -bottom-2 left-0 right-0 flex justify-between px-1">
            <span className="text-[10px] font-medium text-profit">{winners}W</span>
            <span className="text-[10px] font-medium text-loss">{losers}L</span>
          </div>
        </div>
      </StatCard>

      {/* Profit Factor */}
      <StatCard
        title="Profit Factor"
        value={typeof profitF === 'number' ? profitF.toFixed(2) : profitF}
        subtitle={parseFloat(profitF as string) >= 1.5 ? "Good" : parseFloat(profitF as string) >= 1 ? "Breakeven" : "Needs work"}
        icon={<Activity className="w-4 h-4 text-muted-foreground" />}
        trend={parseFloat(profitF as string) >= 1.5 ? 'up' : parseFloat(profitF as string) < 1 ? 'down' : 'neutral'}
        trendValue={parseFloat(profitF as string) >= 1.5 ? "Profitable" : parseFloat(profitF as string) < 1 ? "Losing" : "Even"}
      />

      {/* Account Balance */}
      <StatCard
        title="Account Balance"
        value={balanceFormatted}
        icon={<Wallet className="w-4 h-4 text-muted-foreground" />}
        valueColor={numericPnl >= 0 ? 'profit' : 'default'}
      >
        <div className="w-24 h-12">
          <TinyChart data={data} />
        </div>
      </StatCard>

      {/* Risk:Reward */}
      <StatCard
        title="Risk : Reward"
        value={typeof rrRatio === 'number' ? `1:${rrRatio.toFixed(1)}` : `1:${rrRatio}`}
        icon={<Scale className="w-4 h-4 text-muted-foreground" />}
      >
        <div className="w-full mt-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-profit rounded-l-full transition-all"
              style={{ width: `${avgProfitPercentage}%` }}
            />
            <div 
              className="h-full bg-loss rounded-r-full transition-all"
              style={{ width: `${100 - avgProfitPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-profit font-medium">
              +${avgProfits?.toFixed(0) || 0}
            </span>
            <span className="text-[10px] text-loss font-medium">
              -${Math.abs(avgLoses || 0).toFixed(0)}
            </span>
          </div>
        </div>
      </StatCard>
    </div>
  );
};

export default DashWidgets;
