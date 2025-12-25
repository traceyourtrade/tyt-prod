"use client";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { 
  ChevronDown, 
  Calendar, 
  Filter, 
  DollarSign, 
  Copy, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  SunMedium
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import useAccountDetails from "@/store/accountdetails";
import useCurrencyStore, { formatCurrencyValue } from "@/store/currencyStore";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TradeData {
  date: string;
  Profit: number;
  Symbol?: string;
  openTime?: string;
  closeTime?: string;
}

interface AccountData {
  _id: string;
  name?: string;
  brokerName?: string;
  tradeData?: TradeData[];
}

const NewDashboard = () => {
  const [dateRange, setDateRange] = useState("This month");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dateRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  
  const { selectedAccounts, loading, accounts, setAccounts } = useAccountDetails();
  const { currency, exchangeRate } = useCurrencyStore();

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allTrades = useMemo(() => {
    if (!selectedAccounts || !Array.isArray(selectedAccounts)) return [];
    const trades: (TradeData & { accountId: string })[] = [];
    (selectedAccounts as unknown as AccountData[]).forEach((account) => {
      if (account?.tradeData && Array.isArray(account.tradeData)) {
        account.tradeData.forEach((trade) => {
          trades.push({ ...trade, accountId: account._id });
        });
      }
    });
    return trades;
  }, [selectedAccounts]);

  const stats = useMemo(() => {
    if (allTrades.length === 0) {
      return {
        netPnL: 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profitFactor: 1,
        avgWin: 0,
        avgLoss: 0,
        winDays: 0,
        lossDays: 0,
        neutralDays: 0,
        dayWinRate: 0,
        avgWinLossRatio: 0,
        maxDrawdown: 0,
        recoveryFactor: 0,
        consistency: 0,
      };
    }

    let totalProfit = 0;
    let totalLoss = 0;
    let wins = 0;
    let losses = 0;
    const dailyPnL: Record<string, number> = {};

    allTrades.forEach((trade) => {
      const pnl = trade.Profit || 0;
      if (pnl > 0) {
        totalProfit += pnl;
        wins++;
      } else if (pnl < 0) {
        totalLoss += Math.abs(pnl);
        losses++;
      }
      
      const dateKey = trade.date?.split('T')[0] || '';
      if (dateKey) {
        dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + pnl;
      }
    });

    const netPnL = totalProfit - totalLoss;
    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? totalProfit : 0;
    const avgWin = wins > 0 ? totalProfit / wins : 0;
    const avgLoss = losses > 0 ? totalLoss / losses : 0;
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;

    let winDays = 0;
    let lossDays = 0;
    let neutralDays = 0;
    Object.values(dailyPnL).forEach((pnl) => {
      if (pnl > 0) winDays++;
      else if (pnl < 0) lossDays++;
      else neutralDays++;
    });

    const totalDays = winDays + lossDays + neutralDays;
    const dayWinRate = totalDays > 0 ? (winDays / totalDays) * 100 : 0;

    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    const sortedDates = Object.keys(dailyPnL).sort();
    sortedDates.forEach((date) => {
      cumulative += dailyPnL[date];
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const recoveryFactor = maxDrawdown > 0 ? netPnL / maxDrawdown : netPnL > 0 ? 10 : 0;
    
    const pnlValues = Object.values(dailyPnL);
    const avgDailyPnL = pnlValues.length > 0 ? pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length : 0;
    const variance = pnlValues.length > 0 ? pnlValues.reduce((sum, pnl) => sum + Math.pow(pnl - avgDailyPnL, 2), 0) / pnlValues.length : 0;
    const stdDev = Math.sqrt(variance);
    const consistency = stdDev > 0 && avgDailyPnL !== 0 ? Math.min(100, Math.max(0, 100 - (stdDev / Math.abs(avgDailyPnL)) * 10)) : 50;

    return {
      netPnL,
      totalTrades,
      wins,
      losses,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      winDays,
      lossDays,
      neutralDays,
      dayWinRate,
      avgWinLossRatio,
      maxDrawdown,
      recoveryFactor,
      consistency,
    };
  }, [allTrades]);

  const zellaScore = useMemo(() => {
    const winRateScore = Math.min(stats.winRate / 100, 1) * 20;
    const pfScore = Math.min(stats.profitFactor / 3, 1) * 20;
    const ratioScore = Math.min(stats.avgWinLossRatio / 3, 1) * 15;
    const recoveryScore = Math.min(stats.recoveryFactor / 5, 1) * 15;
    const ddScore = stats.maxDrawdown > 0 ? Math.max(0, 1 - stats.maxDrawdown / stats.netPnL) * 15 : 15;
    const consistencyScore = (stats.consistency / 100) * 15;
    return Math.round(winRateScore + pfScore + ratioScore + recoveryScore + ddScore + consistencyScore);
  }, [stats]);

  const dailyData = useMemo(() => {
    const dailyPnL: Record<string, { pnl: number; trades: number }> = {};
    allTrades.forEach((trade) => {
      const dateKey = trade.date?.split('T')[0] || '';
      if (dateKey) {
        if (!dailyPnL[dateKey]) {
          dailyPnL[dateKey] = { pnl: 0, trades: 0 };
        }
        dailyPnL[dateKey].pnl += trade.Profit || 0;
        dailyPnL[dateKey].trades++;
      }
    });
    return dailyPnL;
  }, [allTrades]);

  const cumulativeChartData = useMemo(() => {
    const sortedDates = Object.keys(dailyData).sort();
    let cumulative = 0;
    const labels: string[] = [];
    const data: number[] = [];
    
    sortedDates.forEach((date) => {
      cumulative += dailyData[date].pnl;
      labels.push(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      data.push(cumulative);
    });

    return {
      labels,
      datasets: [{
        label: 'Cumulative P&L',
        data,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      }],
    };
  }, [dailyData]);

  const dailyBarChartData = useMemo(() => {
    const sortedDates = Object.keys(dailyData).sort().slice(-30);
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    
    sortedDates.forEach((date) => {
      labels.push(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const pnl = dailyData[date].pnl;
      data.push(pnl);
      colors.push(pnl >= 0 ? '#10B981' : '#EF4444');
    });

    return {
      labels,
      datasets: [{
        label: 'Daily P&L',
        data,
        backgroundColor: colors,
        borderRadius: 4,
        barThickness: 8,
      }],
    };
  }, [dailyData]);

  const radarChartData = useMemo(() => {
    const normalizedWinRate = Math.min(stats.winRate, 100);
    const normalizedPF = Math.min(stats.profitFactor * 25, 100);
    const normalizedRatio = Math.min(stats.avgWinLossRatio * 25, 100);
    const normalizedRecovery = Math.min(stats.recoveryFactor * 10, 100);
    const normalizedDD = stats.maxDrawdown > 0 ? Math.max(0, 100 - (stats.maxDrawdown / Math.max(stats.netPnL, 1)) * 100) : 100;
    const normalizedConsistency = stats.consistency;

    return {
      labels: ['Win %', 'Profit factor', 'Avg win/loss', 'Recovery factor', 'Max drawdown', 'Consistency'],
      datasets: [{
        label: 'Performance',
        data: [normalizedWinRate, normalizedPF, normalizedRatio, normalizedRecovery, normalizedDD, normalizedConsistency],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10B981',
        borderWidth: 2,
        pointBackgroundColor: '#10B981',
        pointRadius: 3,
      }],
    };
  }, [stats]);

  const recentTrades = useMemo(() => {
    return [...allTrades]
      .filter(t => t.Profit !== undefined)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 10);
  }, [allTrades]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: { date: number | null; pnl: number; trades: number }[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, pnl: 0, trades: 0 });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = dailyData[dateStr] || { pnl: 0, trades: 0 };
      days.push({ date: day, pnl: dayData.pnl, trades: dayData.trades });
    }
    
    return days;
  }, [currentMonth, dailyData]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatCurrencyValue(stats.netPnL, currency, exchangeRate));
  };

  const selectedAccount = (selectedAccounts as unknown as AccountData[] | undefined)?.[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <span className="text-xs text-muted-foreground">Last import: {new Date().toLocaleString()}</span>
          <button className="text-xs text-primary hover:underline">Resync</button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={dateRef}>
            <button
              onClick={() => setIsDateOpen(!isDateOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors",
                "bg-card border-border hover:bg-muted text-foreground"
              )}
            >
              <DollarSign className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border bg-card border-border hover:bg-muted text-foreground">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <div className="relative" ref={dateRef}>
            <button
              onClick={() => setIsDateOpen(!isDateOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors",
                "bg-card border-border hover:bg-muted text-foreground"
              )}
            >
              <Calendar className="w-4 h-4" />
              Date range
              <ChevronDown className="w-3 h-3" />
            </button>
            {isDateOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-xl z-50 p-1">
                {["Today", "This week", "This month", "Last 30 days", "Last 90 days", "All time"].map((option) => (
                  <button
                    key={option}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      dateRange === option ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    )}
                    onClick={() => { setDateRange(option); setIsDateOpen(false); }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors",
                "bg-card border-border hover:bg-muted text-foreground"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {selectedAccount?.name || selectedAccount?.brokerName || "All accounts"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {isAccountOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 p-1">
                <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground">
                  All accounts
                </button>
                {(accounts as unknown as AccountData[] | undefined)?.map((account) => (
                  <button
                    key={account._id}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground"
                  >
                    {account.name || account.brokerName || account._id}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600">
            <SunMedium className="w-4 h-4" />
            Start my day
          </button>
          
          <button className="p-1.5 rounded-lg border bg-card border-border hover:bg-muted">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Net P&L <span className="text-muted-foreground/60">({stats.totalTrades})</span></span>
            <button onClick={copyToClipboard} className="p-1 hover:bg-muted rounded">
              <Copy className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            stats.netPnL >= 0 ? "text-profit" : "text-loss"
          )}>
            {formatCurrencyValue(stats.netPnL, currency, exchangeRate)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Trade win %</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-foreground">{stats.winRate.toFixed(2)}%</p>
            <div className="w-16 h-16">
              <Doughnut
                data={{
                  labels: ['Wins', 'Losses'],
                  datasets: [{
                    data: [stats.wins, stats.losses],
                    backgroundColor: ['#10B981', '#EF4444'],
                    borderWidth: 0,
                  }],
                }}
                options={{
                  cutout: '70%',
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  maintainAspectRatio: true,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="text-profit">{stats.wins}</span>
            <span>·</span>
            <span className="text-loss">{stats.losses}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Profit factor</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-foreground">{stats.profitFactor.toFixed(2)}</p>
            <div className="w-16 h-16 relative">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                <path
                  d="M 10 45 A 40 40 0 0 1 90 45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <path
                  d="M 10 45 A 40 40 0 0 1 90 45"
                  fill="none"
                  stroke={stats.profitFactor >= 1 ? '#10B981' : '#EF4444'}
                  strokeWidth="8"
                  strokeDasharray={`${Math.min(stats.profitFactor / 3, 1) * 126} 126`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Day win %</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-foreground">{stats.dayWinRate.toFixed(2)}%</p>
            <div className="w-16 h-16">
              <Doughnut
                data={{
                  labels: ['Win days', 'Neutral', 'Loss days'],
                  datasets: [{
                    data: [stats.winDays, stats.neutralDays, stats.lossDays],
                    backgroundColor: ['#10B981', '#6B7280', '#EF4444'],
                    borderWidth: 0,
                  }],
                }}
                options={{
                  cutout: '70%',
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  maintainAspectRatio: true,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="text-profit">{stats.winDays}</span>
            <span>·</span>
            <span>{stats.neutralDays}</span>
            <span>·</span>
            <span className="text-loss">{stats.lossDays}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Avg win/loss trade</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.avgWinLossRatio.toFixed(2)}</p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-profit">{formatCurrencyValue(stats.avgWin, currency, exchangeRate)}</span>
            <span className="text-loss">-{formatCurrencyValue(stats.avgLoss, currency, exchangeRate)}</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-foreground">Zella score</span>
            <span className="text-xs text-muted-foreground">ⓘ</span>
          </div>
          <div className="h-48">
            <Radar
              data={radarChartData}
              options={{
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { display: false },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { 
                      color: 'rgb(156, 163, 175)', 
                      font: { size: 10 } 
                    },
                  },
                },
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
              }}
            />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Your Zella Score</span>
              <span>{zellaScore}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all"
                style={{ width: `${zellaScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-foreground">Daily net cumulative P&L</span>
            <span className="text-xs text-muted-foreground">ⓘ</span>
          </div>
          <div className="h-56">
            <Line
              data={cumulativeChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: 'rgb(156, 163, 175)', font: { size: 10 } },
                  },
                  y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                      color: 'rgb(156, 163, 175)', 
                      font: { size: 10 },
                      callback: (value) => `$${Number(value).toLocaleString()}`,
                    },
                  },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-foreground">Net daily P&L</span>
            <span className="text-xs text-muted-foreground">ⓘ</span>
          </div>
          <div className="h-56">
            <Bar
              data={dailyBarChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: 'rgb(156, 163, 175)', font: { size: 10 } },
                  },
                  y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                      color: 'rgb(156, 163, 175)', 
                      font: { size: 10 },
                      callback: (value) => `$${Number(value).toLocaleString()}`,
                    },
                  },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-4 mb-4 border-b border-border pb-2">
            <button className="text-sm font-medium text-primary border-b-2 border-primary pb-2 -mb-2.5">
              Recent trades
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground pb-2 -mb-2.5">
              Open positions
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th className="text-left pb-3 font-medium">Close Date</th>
                  <th className="text-left pb-3 font-medium">Symbol</th>
                  <th className="text-right pb-3 font-medium">Net P&L</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-muted-foreground">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  recentTrades.map((trade, idx) => (
                    <tr key={idx} className="border-t border-border/50">
                      <td className="py-3 text-foreground">
                        {new Date(trade.date).toLocaleDateString('en-US', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="py-3 text-foreground">{trade.Symbol || 'N/A'}</td>
                      <td className={cn(
                        "py-3 text-right font-medium",
                        trade.Profit >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {trade.Profit >= 0 ? '' : '-'}{formatCurrencyValue(Math.abs(trade.Profit), currency, exchangeRate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-sm font-medium text-foreground">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="text-xs text-primary hover:underline ml-2">This month</button>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-muted rounded">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-1 hover:bg-muted rounded">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-xs text-muted-foreground py-2 font-medium">
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "aspect-square p-1 rounded-lg text-xs flex flex-col items-center justify-center",
                  day.date ? (
                    day.pnl > 0 ? "bg-profit/20 text-profit" : 
                    day.pnl < 0 ? "bg-loss/20 text-loss" : 
                    "text-muted-foreground"
                  ) : ""
                )}
              >
                {day.date && (
                  <>
                    <span className="text-[10px] text-muted-foreground">{day.date}</span>
                    {day.trades > 0 && (
                      <>
                        <span className="font-semibold text-xs">
                          {day.pnl >= 0 ? '' : '-'}${Math.abs(Math.round(day.pnl / 1000))}K
                        </span>
                        <span className="text-[9px] text-muted-foreground">{day.trades} trades</span>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NewDashboard;
