"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { ChevronDown, Calendar, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

import DashboardCustom from "@/components/dashboard-components/dasboard-range/DashboardCustom";
import DashboardDay from "@/components/dashboard-components/dasboard-range/DashboardDay";
import DashboardMonth from "@/components/dashboard-components/dasboard-range/DashboardMonth";
import DashboardWeek from "@/components/dashboard-components/dasboard-range/DashboardWeek";
import useAccountDetails from "@/store/accountdetails";
import usePropFirmStore from "@/store/propFirmStore";
import notifications from "@/store/notifications";

import { PropFirmModeToggle, PropFirmDashboard } from "@/components/prop-firm";
import { EditModeToolbar } from "@/components/dashboard/DraggableWidgetGrid";

import { cn } from "@/lib/utils";

const timeRangeOptions = [
  { label: "Monthly", value: "Monthly" },
  { label: "Weekly", value: "Weekly" },
  { label: "Daily", value: "Daily" },
  { label: "Custom", value: "Custom" },
];

const DashboardMain = () => {
  const [selected, setSelected] = useState("Monthly");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setAccounts, profileData, selectedAccounts, loading } = useAccountDetails();
  const { hrBarTxt, hrBarType } = notifications();
  const { isEnabled: isPropFirmMode } = usePropFirmStore();

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

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
      {/* Personalized Greeting Header */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-6 sm:p-8",
        "bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/50",
        "dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800",
        "border-blue-100/50 dark:border-white/[0.08]",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"
      )}>
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/15 dark:bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left - Greeting */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4" />
                <span>{getFormattedDate()}</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {getTimeBasedGreeting()},{" "}
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
                    ${Math.abs(todayStats.todayPnL).toLocaleString()}
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
            <div className="relative" ref={dropdownRef}>
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  "bg-card border border-border text-foreground hover:bg-muted",
                  isOpen && "border-primary/50 ring-2 ring-primary/20"
                )}
                onClick={() => setIsOpen(!isOpen)}
              >
                {selected}
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )} />
              </button>
              
              {isOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-1">
                    {timeRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        className={cn(
                          "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors",
                          selected === option.value 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted text-foreground"
                        )}
                        onClick={() => {
                          setSelected(option.value);
                          setIsOpen(false);
                        }}
                      >
                        {option.label}
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
          <>
            {selected === "Daily" && <DashboardDay />}
            {selected === "Weekly" && <DashboardWeek />}
            {selected === "Monthly" && <DashboardMonth />}
            {selected === "Custom" && <DashboardCustom />}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardMain;
