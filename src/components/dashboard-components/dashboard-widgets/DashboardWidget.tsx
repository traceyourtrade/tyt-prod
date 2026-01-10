"use client";

import React from 'react';
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";
import { DollarSign, Target, Activity, Wallet, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import TinyChart from "./TinyChart";
import useCurrencyStore, { formatCurrencyValue, formatCompactCurrency } from "@/store/currencyStore";

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
  valuesAlreadyConverted?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'neutral';
  status?: string;
  valueType?: 'profit' | 'loss' | 'neutral';
  children?: React.ReactNode;
  dataTour?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconColor = 'neutral',
  status,
  valueType = 'neutral',
  children,
  dataTour,
}) => {
  const getValueColor = () => {
    switch (valueType) {
      case 'profit': return 'text-profit';
      case 'loss': return 'text-loss';
      default: return 'text-foreground';
    }
  };

  const getIconColorClasses = () => {
    switch (iconColor) {
      case 'blue': return 'bg-blue-500/10 text-blue-400';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-400';
      case 'amber': return 'bg-amber-500/10 text-amber-400';
      case 'violet': return 'bg-violet-500/10 text-violet-400';
      case 'rose': return 'bg-rose-500/10 text-rose-400';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  return (
    <div 
      className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-3.5 py-3 transition-all duration-300 hover:bg-card/80 hover:border-border"
      {...(dataTour && { 'data-tour': dataTour })}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={cn("p-1.5 rounded-lg", getIconColorClasses())}>
              {icon}
            </div>
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        {status && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide bg-muted/50 text-muted-foreground">
            {status}
          </span>
        )}
      </div>
      
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-lg font-bold tracking-tight truncate",
            getValueColor()
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
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
  valuesAlreadyConverted = false,
}) => {
  const { currency, exchangeRate } = useCurrencyStore();
  
  const numericPnl = typeof pnl === 'string' ? parseFloat(pnl) : pnl;
  const winrate = winners || losers ? ((winners / (winners + losers)) * 100).toFixed(1) : '0';
  const totalTrades = winners + losers;
  const balanceValue = typeof accBal === 'string' ? parseFloat(accBal) : accBal;
  
  const pnlFormatted = formatCurrencyValue(Math.abs(numericPnl), currency, exchangeRate, balanceValue, undefined, valuesAlreadyConverted);
  const balanceFormatted = formatCurrencyValue(balanceValue, currency, exchangeRate);
  const avgProfitFormatted = formatCompactCurrency(avgProfits || 0, currency, exchangeRate, undefined, undefined, valuesAlreadyConverted);
  const avgLossFormatted = formatCompactCurrency(Math.abs(avgLoses || 0), currency, exchangeRate, undefined, undefined, valuesAlreadyConverted);

  const startingBalance = balanceValue - numericPnl;
  const balanceData = data.map(d => ({ value: startingBalance + d.value }));

  const dataWinLoss = {
    labels: ["Wins", "Losses"],
    datasets: [
      {
        data: [winners, losers],
        backgroundColor: ["rgba(34, 197, 94, 0.7)", "rgba(239, 68, 68, 0.7)"],
        hoverBackgroundColor: ["rgba(34, 197, 94, 0.9)", "rgba(239, 68, 68, 0.9)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 1,
        spacing: 2,
      },
    ],
  };

  const optionsWinLoss = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "85%",
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
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      <StatCard
        title="Net P&L"
        value={numericPnl >= 0 ? pnlFormatted : pnlFormatted.replace(/^([₹$])/, '-$1')}
        icon={<DollarSign className="w-4 h-4" />}
        iconColor="emerald"
        valueType={numericPnl > 0 ? 'profit' : numericPnl < 0 ? 'loss' : 'neutral'}
        subtitle={numericPnl !== 0 ? `${numericPnl >= 0 ? '+' : ''}${((numericPnl / (balanceValue || 1)) * 100).toFixed(1)}% return` : 'No change'}
        dataTour="net-pnl"
      >
        <div className="w-16 h-8">
          <TinyChart data={data} />
        </div>
      </StatCard>

      <div className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-3.5 py-3 transition-all duration-300 hover:bg-card/80 hover:border-border" data-tour="win-rate">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Target className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Win Rate</span>
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex-shrink-0 mt-1">
            <p className="text-lg font-bold text-foreground">{winrate}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{totalTrades} trades</p>
          </div>
          
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-[120px] h-[65px]">
              <Doughnut data={dataWinLoss} options={optionsWinLoss} />
            </div>
            <div className="flex items-center justify-between w-[120px] -mt-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-profit/20 text-profit">{winners}</span>
              <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-muted/50 text-muted-foreground">0</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-loss/20 text-loss">{losers}</span>
            </div>
          </div>
        </div>
      </div>

      <StatCard
        title="Profit Factor"
        value={typeof profitF === 'number' ? profitF.toFixed(2) : profitF}
        subtitle={profitFactorStatus}
        icon={<Activity className="w-4 h-4" />}
        iconColor="amber"
        status={profitFactorNum >= 1.5 ? "Profitable" : profitFactorNum < 1 ? "Losing" : "Breakeven"}
        dataTour="profit-factor"
      />

      <StatCard
        title="Account Balance"
        value={balanceFormatted}
        icon={<Wallet className="w-4 h-4" />}
        iconColor="violet"
        subtitle="Current balance"
        dataTour="account-balance"
      >
        <div className="w-16 h-8">
          <TinyChart data={balanceData} />
        </div>
      </StatCard>

      <StatCard
        title="Risk : Reward"
        value={typeof rrRatio === 'number' ? `1:${rrRatio.toFixed(1)}` : `1:${rrRatio}`}
        icon={<Scale className="w-4 h-4" />}
        iconColor="rose"
        dataTour="risk-reward"
      >
        <div className="w-28">
          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-profit rounded-l-full transition-all"
              style={{ width: `${avgProfitPercentage}%` }}
            />
            <div 
              className="h-full bg-loss rounded-r-full transition-all"
              style={{ width: `${100 - avgProfitPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-profit font-medium">
              +{avgProfitFormatted}
            </span>
            <span className="text-[9px] text-loss font-medium">
              -{avgLossFormatted}
            </span>
          </div>
        </div>
      </StatCard>
    </div>
  );
};

export default DashWidgets;
