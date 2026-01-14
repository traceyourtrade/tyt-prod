"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { ChevronDown, Calendar, Sparkles, TrendingUp, TrendingDown, Minus, HelpCircle, AlertTriangle, Clock, Zap, X, CalendarRange } from "lucide-react";

import DashboardMonth from "@/components/dashboard-components/dasboard-range/DashboardMonth";
import useAccountDetails from "@/store/accountdetails";
import usePropFirmStore from "@/store/propFirmStore";
import notifications from "@/store/notifications";
import useCurrencyStore, { formatCurrencyValue } from "@/store/currencyStore";

import { PropFirmModeToggle, PropFirmDashboard } from "@/components/prop-firm";
import { EditModeToolbar } from "@/components/dashboard/DraggableWidgetGrid";
import { useTourStore } from "@/stores/useTourStore";
import FreeTrialBanner from "@/components/subscription/FreeTrialBanner";
import useDateRangeStore, { dateRangeLabels, DateRangeOption } from "@/store/dateRangeStore";

import { cn } from "@/lib/utils";

const dateRangeOptions: DateRangeOption[] = [
  "this_week",
  "this_month",
  "last_30_days",
  "last_month",
  "this_quarter",
  "this_year",
  "all_time",
];

const DashboardMain = () => {
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const dateRangeDropdownRef = useRef<HTMLDivElement>(null);
  const { setAccounts, profileData, selectedAccounts, loading } = useAccountDetails();
  const { hrBarTxt, hrBarType } = notifications();
  const { isEnabled: isPropFirmMode } = usePropFirmStore();
  const { currency, exchangeRate } = useCurrencyStore();
  const startTour = useTourStore((state) => state.startTour);
  const { selectedRange, setSelectedRange } = useDateRangeStore();

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    
    setFormattedDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    }));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRangeDropdownRef.current && !dateRangeDropdownRef.current.contains(event.target as Node)) {
        setIsDateRangeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = useMemo(() => {
    if (profileData?.fullName) {
      return profileData.fullName.split(' ')[0];
    }
    return null;
  }, [profileData?.fullName]);

  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayPnL = 0;
    let todayTrades = 0;
    let todayWins = 0;

    if (!selectedAccounts || !Array.isArray(selectedAccounts)) {
      return { todayPnL, todayTrades, todayWins };
    }

    selectedAccounts.forEach(account => {
      if (account?.tradeData && Array.isArray(account.tradeData)) {
        account.tradeData.forEach((trade: any) => {
          if (!trade?.date) return;
          
          const tradeDate = new Date(trade.date);
          tradeDate.setHours(0, 0, 0, 0);
          
          if (tradeDate.getTime() === today.getTime()) {
            todayPnL += trade.Profit || 0;
            todayTrades++;
            if (trade.Profit > 0) todayWins++;
          }
        });
      }
    });

    return { todayPnL, todayTrades, todayWins };
  }, [selectedAccounts]);

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  
  const smartAlerts = useMemo(() => {
    const alerts: { id: string; type: 'warning' | 'danger' | 'info'; icon: React.ElementType; title: string; message: string }[] = [];
    
    if (!selectedAccounts || !Array.isArray(selectedAccounts)) return alerts;
    
    const allTrades = selectedAccounts
      .flatMap((acc: any) => acc.tradeData || [])
      .filter((t: any) => t?.date)
      .sort((a: any, b: any) => {
        const dateA = new Date(`${a.date} ${a.time || a.CloseTime || "00:00:00"}`);
        const dateB = new Date(`${b.date} ${b.time || b.CloseTime || "00:00:00"}`);
        return dateB.getTime() - dateA.getTime();
      });
    
    if (allTrades.length < 3) return alerts;

    // Check for tilt (last 3+ trades are losses)
    let consecutiveLosses = 0;
    for (const trade of allTrades) {
      if (trade.Profit < 0) consecutiveLosses++;
      else break;
    }
    
    if (consecutiveLosses >= 3) {
      alerts.push({
        id: 'tilt',
        type: 'danger',
        icon: AlertTriangle,
        title: 'Tilt Warning',
        message: `You're on a ${consecutiveLosses}-trade losing streak. Consider taking a break.`
      });
    }

    // Check for bad trading time
    const currentHour = new Date().getHours();
    const hourlyStats: Record<number, { wins: number; losses: number }> = {};
    
    allTrades.forEach((trade: any) => {
      const timeStr = trade.time || trade.OpenTime?.split(' ')[1] || trade.CloseTime?.split(' ')[1];
      if (!timeStr) return;
      const hour = parseInt(timeStr.split(':')[0]);
      if (!hourlyStats[hour]) hourlyStats[hour] = { wins: 0, losses: 0 };
      if (trade.Profit > 0) hourlyStats[hour].wins++;
      else if (trade.Profit < 0) hourlyStats[hour].losses++;
    });
    
    const currentHourStats = hourlyStats[currentHour];
    if (currentHourStats && (currentHourStats.wins + currentHourStats.losses) >= 5) {
      const winRate = (currentHourStats.wins / (currentHourStats.wins + currentHourStats.losses)) * 100;
      if (winRate < 35) {
        alerts.push({
          id: 'bad-time',
          type: 'warning',
          icon: Clock,
          title: 'Low Performance Hour',
          message: `You historically win only ${winRate.toFixed(0)}% of trades at ${currentHour}:00. Consider waiting.`
        });
      }
    }

    // Check for overtrading
    const tradeDays: Record<string, number> = {};
    allTrades.forEach((trade: any) => {
      if (!tradeDays[trade.date]) tradeDays[trade.date] = 0;
      tradeDays[trade.date]++;
    });
    
    const avgTradesPerDay = Object.values(tradeDays).length > 0
      ? Object.values(tradeDays).reduce((a, b) => a + b, 0) / Object.values(tradeDays).length
      : 0;
    
    // Use local date format (YYYY-MM-DD) to match trade.date format
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayTradeCount = tradeDays[today] || 0;
    
    if (avgTradesPerDay > 0 && todayTradeCount > avgTradesPerDay * 2) {
      alerts.push({
        id: 'overtrading',
        type: 'warning',
        icon: Zap,
        title: 'Overtrading Alert',
        message: `You've taken ${todayTradeCount} trades today (avg: ${avgTradesPerDay.toFixed(1)}/day). Quality over quantity!`
      });
    }

    return alerts.filter(a => !dismissedAlerts.includes(a.id));
  }, [selectedAccounts, dismissedAlerts]);

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  const getAlertStyles = () => {
    switch (hrBarType) {
      case "Alert":
        return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
      case "Danger":
        return "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  const getMotivationalMessage = () => {
    if (todayStats.todayTrades === 0) {
      return "Ready to start trading today?";
    }
    if (todayStats.todayPnL > 0) {
      return "Great job! You're in profit today.";
    }
    if (todayStats.todayPnL < 0) {
      return "Stay focused. Every trade is a learning opportunity.";
    }
    return "Breaking even so far. Keep your strategy tight.";
  };

  return (
    <div className="space-y-6">
      {/* Free Trial Banner - Only shown for eligible users */}
      <FreeTrialBanner />
      
      {/* Personalized Greeting Header */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-6 sm:p-8",
        "bg-gradient-to-br from-primary/5 via-card to-card",
        "dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800",
        "border-border dark:border-white/[0.08]"
      )}>
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 dark:bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left - Greeting */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {greeting}{greeting ? "," : ""}{" "}
                {loading ? (
                  <span className="inline-block w-24 h-8 bg-muted/50 rounded-lg animate-pulse align-middle" />
                ) : (
                  <span className="bg-gradient-to-r from-primary to-emerald-500 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {firstName || 'Trader'}
                  </span>
                )}
              </h1>
              
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {getMotivationalMessage()}
              </p>
            </div>

            {/* Right - Quick Stats */}
            {todayStats.todayTrades > 0 && (
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="text-center min-w-[70px]">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Today's P&L</p>
                  <p className={cn(
                    "text-lg sm:text-xl font-bold flex items-center justify-center gap-1",
                    todayStats.todayPnL > 0 ? "text-profit" : todayStats.todayPnL < 0 ? "text-loss" : "text-muted-foreground"
                  )}>
                    {todayStats.todayPnL > 0 ? <TrendingUp className="w-4 h-4" /> : todayStats.todayPnL < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    {formatCurrencyValue(todayStats.todayPnL, currency, exchangeRate)}
                  </p>
                </div>
                <div className="w-px h-10 bg-border hidden sm:block" />
                <div className="text-center min-w-[50px]">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trades</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{todayStats.todayTrades}</p>
                </div>
                <div className="w-px h-10 bg-border hidden sm:block" />
                <div className="text-center min-w-[50px]">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Wins</p>
                  <p className="text-lg sm:text-xl font-bold text-profit">{todayStats.todayWins}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Alerts Banner */}
      {smartAlerts.length > 0 && !isPropFirmMode && (
        <div className="space-y-2">
          {smartAlerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.id}
                className={cn(
                  "relative rounded-xl border p-4 flex items-start gap-3",
                  alert.type === 'danger' 
                    ? "bg-red-500/10 border-red-500/20" 
                    : alert.type === 'warning'
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-blue-500/10 border-blue-500/20"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  alert.type === 'danger' 
                    ? "bg-red-500/20" 
                    : alert.type === 'warning'
                    ? "bg-amber-500/20"
                    : "bg-blue-500/20"
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    alert.type === 'danger' 
                      ? "text-red-500" 
                      : alert.type === 'warning'
                      ? "text-amber-500"
                      : "text-blue-500"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm",
                    alert.type === 'danger' 
                      ? "text-red-600 dark:text-red-400" 
                      : alert.type === 'warning'
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-blue-600 dark:text-blue-400"
                  )}>
                    {alert.title}
                  </p>
                  <p className="text-muted-foreground text-sm mt-0.5">{alert.message}</p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className={cn(
                    "p-1 rounded-lg transition-colors shrink-0",
                    alert.type === 'danger' 
                      ? "hover:bg-red-500/20 text-red-400" 
                      : alert.type === 'warning'
                      ? "hover:bg-amber-500/20 text-amber-400"
                      : "hover:bg-blue-500/20 text-blue-400"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PropFirmModeToggle />
          <p className="text-muted-foreground text-sm hidden md:block">
            {isPropFirmMode 
              ? "Track your prop firm challenge progress" 
              : "Overview of your trading performance"
            }
          </p>
        </div>
        
        {!isPropFirmMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={startTour}
              className={cn(
                "hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
              )}
              title="Start dashboard tour"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Tour</span>
            </button>
            
            <div className="relative" ref={dateRangeDropdownRef}>
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  "bg-card border border-border text-foreground hover:bg-muted",
                  isDateRangeOpen && "border-primary/50 ring-2 ring-primary/20"
                )}
                onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
              >
                <CalendarRange className="w-4 h-4 text-muted-foreground" />
                <span className="hidden sm:inline">{dateRangeLabels[selectedRange]}</span>
                <span className="sm:hidden">{dateRangeLabels[selectedRange].split(' ')[0]}</span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isDateRangeOpen && "rotate-180"
                )} />
              </button>
              
              {isDateRangeOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-1">
                    {dateRangeOptions.map((option) => (
                      <button
                        key={option}
                        className={cn(
                          "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors",
                          selectedRange === option 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted text-foreground"
                        )}
                        onClick={() => {
                          setSelectedRange(option);
                          setIsDateRangeOpen(false);
                        }}
                      >
                        {dateRangeLabels[option]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <EditModeToolbar />
          </div>
        )}
      </div>

      {hrBarTxt && hrBarType && (
        <div className={cn(
          "rounded-xl border p-4 flex items-center gap-3",
          getAlertStyles()
        )}>
          <div 
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: hrBarTxt }} 
          />
        </div>
      )}

      <div className="animate-fade-in">
        {isPropFirmMode ? (
          <PropFirmDashboard />
        ) : (
          <DashboardMonth />
        )}
      </div>

    </div>
  );
};

export default DashboardMain;
