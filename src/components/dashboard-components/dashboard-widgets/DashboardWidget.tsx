"use client";

import React from 'react';
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";
import { DollarSign, Target, Activity, Wallet, Scale } from "lucide-react";
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
  status?: string;
  valueType?: 'profit' | 'loss' | 'neutral';
  children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  status,
  valueType = 'neutral',
  children 
}) => {
  const getValueColor = () => {
    switch (valueType) {
      case 'profit': return 'text-profit';
      case 'loss': return 'text-loss';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 transition-all duration-300 hover:bg-card/80 hover:border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground">
              {icon}
            </div>
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        {status && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-muted/50 text-muted-foreground">
            {status}
          </span>
        )}
      </div>
      
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-2xl font-bold tracking-tight truncate",
            getValueColor()
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
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
        backgroundColor: ["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"],
        hoverBackgroundColor: ["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"],
        borderColor: ["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.15)"],
        borderWidth: 1,
        spacing: 2,
      },
    ],
  };

  const optionsWinLoss = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "70%",
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

  const profitFactorNum = parseFloat(profitF as string);
  const profitFactorStatus = profitFactorNum >= 1.5 ? "Good" : profitFactorNum >= 1 ? "Even" : "Needs work";

  const avgProfitPercentage = avgProfits && avgLoses ? (avgProfits / (Math.abs(avgProfits) + Math.abs(avgLoses))) * 100 : 50;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* Net P&L */}
      <StatCard
        title="Net P&L"
        value={numericPnl >= 0 ? pnlFormatted : `-${pnlFormatted}`}
        icon={<DollarSign className="w-4 h-4" />}
        valueType={numericPnl > 0 ? 'profit' : numericPnl < 0 ? 'loss' : 'neutral'}
        subtitle={numericPnl !== 0 ? `${numericPnl >= 0 ? '+' : ''}${((numericPnl / (parseFloat(accBal as string) || 1)) * 100).toFixed(1)}% return` : 'No change'}
      >
        <div className="w-20 h-10">
          <TinyChart data={data} />
        </div>
      </StatCard>

      {/* Win Rate */}
      <StatCard
        title="Win Rate"
        value={`${winrate}%`}
        subtitle={`${totalTrades} trades`}
        icon={<Target className="w-4 h-4" />}
      >
        <div className="relative w-14 h-8">
          <Doughnut data={dataWinLoss} options={optionsWinLoss} />
          <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-0.5">
            <span className="text-[9px] font-medium text-muted-foreground">{winners}W</span>
            <span className="text-[9px] font-medium text-muted-foreground">{losers}L</span>
          </div>
        </div>
      </StatCard>

      {/* Profit Factor */}
      <StatCard
        title="Profit Factor"
        value={typeof profitF === 'number' ? profitF.toFixed(2) : profitF}
        subtitle={profitFactorStatus}
        icon={<Activity className="w-4 h-4" />}
        status={profitFactorNum >= 1.5 ? "Profitable" : profitFactorNum < 1 ? "Losing" : "Breakeven"}
      />

      {/* Account Balance */}
      <StatCard
        title="Account Balance"
        value={balanceFormatted}
        icon={<Wallet className="w-4 h-4" />}
        subtitle="Current balance"
      >
        <div className="w-20 h-10">
          <TinyChart data={data} />
        </div>
      </StatCard>

      {/* Risk:Reward */}
      <StatCard
        title="Risk : Reward"
        value={typeof rrRatio === 'number' ? `1:${rrRatio.toFixed(1)}` : `1:${rrRatio}`}
        icon={<Scale className="w-4 h-4" />}
      >
        <div className="w-full">
          <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-foreground/40 rounded-l-full transition-all"
              style={{ width: `${avgProfitPercentage}%` }}
            />
            <div 
              className="h-full bg-foreground/15 rounded-r-full transition-all"
              style={{ width: `${100 - avgProfitPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-profit font-medium">
              +${avgProfits?.toFixed(0) || 0}
            </span>
            <span className="text-[9px] text-loss font-medium">
              -${Math.abs(avgLoses || 0).toFixed(0)}
            </span>
          </div>
        </div>
      </StatCard>
    </div>
  );
};

export default DashWidgets;
