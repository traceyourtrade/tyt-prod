// changes 12-13-25

"use client";

import React, { useState, useEffect, useLayoutEffect, Suspense, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import "../globals.css";
import PageLoading from "@/components/ui/page-loading";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  Target,
  Settings,
  HelpCircle,
  ChevronLeft,
  Plus,
  LogOut,
  LineChart,
  PanelLeft,
  Calendar,
  Bell,
  Sun,
  Moon,
  DollarSign,
  ChevronDown,
  Menu,
  X,
  Calculator,
  Sparkles,
  GraduationCap,
  BrainCircuit,
  Trophy,
  Activity,
  TrendingUp,
  Zap,
  Command,
  CandlestickChart,
  Search,
  Gift,
  Crown,
  Clock,
} from "lucide-react";

interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  canStartTrial?: boolean;
  status: 'subscribed' | 'trial' | 'expired' | 'none' | 'inactive' | 'demo';
  demoMode?: boolean;
}
import Image from "next/image";
import { Button } from "@/components/ui/button";

import DeleteAccPopup from "@/components/dashboard-components/popups/DeleteAccPopup";
import EditAccPopup from "@/components/dashboard-components/popups/EditAccPopup";
import AddAccPopup from "@/components/dashboard-components/popups/AddAccPopup";
import AddtradesMain from "@/components/trades-popup/add-trades/AddTradesMain";
import EditTradePopUp from "@/components/trades-popup/edit-trades/EditTradePopUp";
import CalendarPopup from "@/components/dashboard-components/popups/CalendarPopUp";
import AlertBox from "@/components/dashboard-components/popups/AlertBox";
import DjImgPopup from "@/components/dashboard-components/popups/DjImgPopup";
import AccountsDropdown from "@/components/dashboard-components/AccountsDropdown";
import CurrencyDropdown from "@/components/dashboard-components/CurrencyDropdown";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import DemoModeBanner from "@/components/DemoModeBanner";
import PhaseAdvancementNotification from "@/components/prop-firm/PhaseAdvancementNotification";
import OnboardingTour, { WelcomeModal } from "@/components/onboarding/OnboardingTour";
import { platformTourSteps } from "@/hooks/useOnboardingTour";
import { useTourStore } from "@/stores/useTourStore";

import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";

const tradingItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "#6B8ACD", tourId: "nav-dashboard" },
  { name: "Daily Journal", href: "/daily-journal", icon: BookOpen, color: "#9B8AC4", tourId: "nav-daily-journal" },
  { name: "Notebook", href: "/notebook", icon: FileText, color: "#C9A86C", tourId: "nav-notebook" },
];

const analysisItems = [
  { name: "Reports", href: "/reports", icon: BarChart3, color: "#7CB89E", tourId: "nav-reports" },
  { name: "Strategies", href: "/strategies", icon: Target, color: "#C47A7A", tourId: "nav-strategies" },
  { name: "AI Pattern Detection", href: "/playbook", icon: Sparkles, color: "#C47A9B", tourId: "nav-playbook" },
  { name: "AI Analysis", href: "/ai-analysis", icon: BrainCircuit, color: "#8B5CF6", badge: "New", tourId: "nav-ai-analysis" },
];

const toolsItems = [
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy, color: "#F59E0B" },
  { name: "Resources", href: "/resources", icon: GraduationCap, color: "#5EAAA8", tourId: "nav-resources" },
  { name: "Lot Calculator", href: "/lot-calculator", icon: Calculator, color: "#6BB8C4", tourId: "nav-calculator" },
  { name: "Affiliate", href: "/affiliate", icon: Gift, color: "#4EBF94" },
];

const backtestingSubItems = [
  { name: "Dashboard", href: "/backtesting/dashboard", icon: LayoutDashboard, color: "#3B82F6" },
  { name: "Sessions", href: "/backtesting/sessions", icon: Activity, color: "#3B82F6" },
];

const bottomNavItems = [
  { name: "Support", href: "/support", icon: HelpCircle, color: "#8B8B8B" },
  { name: "Settings", href: "/settings", icon: Settings, color: "#8B8B8B" },
];

const preTrialAllowedPaths = ['/dashboard', '/settings', '/support', '/checkout'];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/daily-journal": "Daily Journal",
  "/notebook": "Notebook",
  "/reports": "Reports",
  "/reports/overview": "Overview",
  "/reports/performance": "Performance",
  "/reports/calendar": "Calendar",
  "/reports/compare": "Compare",
  "/reports/sub-reports": "Sub Reports",
  "/strategies": "Strategies",
  "/strategies/overview": "Overview",
  "/strategies/strategies": "All Strategies",
  "/strategies/reports": "Reports",
  "/strategies/compare": "Compare",
  "/playbook": "AI Pattern Detection",
  "/ai-analysis": "AI Analysis",
  "/leaderboard": "Leaderboard",
  "/backtesting": "Backtesting",
  "/backtesting/dashboard": "Backtesting Dashboard",
  "/backtesting/reports": "Backtesting Reports",
  "/backtesting/sessions": "Backtesting Sessions",
  "/lot-calculator": "Lot Calculator",
  "/affiliate": "Affiliate Program",
  "/settings": "Settings",
  "/support": "Support",
};

interface NavItemProps {
  item: { name: string; href: string; icon: React.ElementType; color: string; badge?: string; tourId?: string };
  showLabel?: boolean;
  active: boolean;
  isRestricted: boolean;
  onNavigate: () => void;
  onRestrictedClick: () => void;
}

const NavItem = memo(function NavItem({ item, showLabel = true, active, isRestricted, onNavigate, onRestrictedClick }: NavItemProps) {
  const Icon = item.icon;
  
  const handleClick = (e: React.MouseEvent) => {
    onNavigate();
    if (isRestricted) {
      e.preventDefault();
      onRestrictedClick();
    }
  };
  
  return (
    <Link
      href={isRestricted ? '/checkout' : item.href}
      onClick={handleClick}
      data-tour={item.tourId}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
        active 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50",
        !showLabel && "justify-center px-1.5"
      )}
    >
      {active && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ 
            backgroundColor: item.color,
            boxShadow: `0 0 12px 2px ${item.color}60, 0 0 20px 4px ${item.color}30`
          }}
        />
      )}
      
      <div className="relative flex-shrink-0 transition-all duration-200">
        <Icon 
          className={cn(
            "h-4 w-4 transition-all duration-200",
            !active && "group-hover:scale-110"
          )}
          style={{ color: active ? item.color : undefined }}
        />
      </div>
      
      {showLabel && (
        <span className="flex-1 truncate">{item.name}</span>
      )}

      {item.badge && showLabel && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/20">
          {item.badge}
        </span>
      )}
    </Link>
  );
});

const SectionLabel = memo(function SectionLabel({ label, isExpanded }: { label: string; isExpanded: boolean }) {
  if (!isExpanded) return null;
  return (
    <div className="px-3 mb-1.5 mt-4 first:mt-0">
      <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  );
});

interface SidebarContentProps {
  isExpanded: boolean;
  collapsed: boolean;
  mobileOpen: boolean;
  setCollapsed: (val: boolean) => void;
  setMobileOpen: (val: boolean) => void;
  backtestingOpen: boolean;
  setBacktestingOpen: (val: boolean) => void;
  subscriptionStatus: SubscriptionStatus | null;
  isPreTrial: boolean;
  showDemoAlert: boolean;
  setShowDemoAlert: (val: boolean) => void;
  setAddTrades: () => void;
  checkoutUrl: string;
  profileData: any;
  handleLogout: () => void;
  router: any;
  pathname: string;
}

const SidebarContent = memo(function SidebarContent({
  isExpanded,
  collapsed,
  mobileOpen,
  setCollapsed,
  setMobileOpen,
  backtestingOpen,
  setBacktestingOpen,
  subscriptionStatus,
  isPreTrial,
  showDemoAlert,
  setShowDemoAlert,
  setAddTrades,
  checkoutUrl,
  profileData,
  handleLogout,
  router,
  pathname,
}: SidebarContentProps) {
  const userInitials = profileData.fullName
    ? `${profileData.fullName.charAt(0)}${profileData.fullName.split(" ")[1]?.charAt(0) || ""}`
    : "U";

  const maskedEmail = profileData.email
    ? profileData.email.replace(/^(.{4}).*(@.*)$/, (_, a: string, b: string) => `${a}*****${b}`)
    : "";

  const handleMobileClose = useCallback(() => setMobileOpen(false), [setMobileOpen]);
  const handleRestrictedClick = useCallback(() => router.push('/checkout'), [router]);

  const renderNavItem = (item: typeof tradingItems[0], showLabel: boolean) => {
    const active = item.href === "/dashboard" 
      ? pathname === "/dashboard" || pathname === "/" 
      : pathname.startsWith(item.href);
    const restricted = isPreTrial && !preTrialAllowedPaths.some(allowed => item.href.startsWith(allowed));
    
    return (
      <NavItem
        key={item.name}
        item={item}
        showLabel={showLabel}
        active={active}
        isRestricted={restricted}
        onNavigate={handleMobileClose}
        onRestrictedClick={handleRestrictedClick}
      />
    );
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#4EBF94]/10 dark:bg-[#4EBF94]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-4 left-12 w-20 h-20 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-2xl pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 -right-8 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className={cn(
        "relative flex items-center h-14 z-10",
        !isExpanded ? "justify-center px-2" : "justify-between px-3"
      )}>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden group"
          onClick={() => setMobileOpen(false)}
        >
          <motion.div 
            className="relative flex-shrink-0"
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/images/logo-icon.png"
              width={28}
              height={28}
              alt="ProJournX"
              className="w-7 h-7 object-contain"
              unoptimized
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4EBF94]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
          
          {isExpanded && (
            <motion.div 
              className="flex flex-col"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-bold text-foreground tracking-tight text-[15px]">
                ProJournX
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                Trading Journal
              </span>
            </motion.div>
          )}
        </Link>
        
        {isExpanded && (
          <motion.button
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
            onClick={() => mobileOpen ? setMobileOpen(false) : setCollapsed(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </motion.button>
        )}
      </div>

      {!isExpanded && (
        <motion.button
          className="mx-auto mt-1 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
          onClick={() => setCollapsed(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </motion.button>
      )}

      <div className={cn("px-3 mt-3", !isExpanded && "mt-2 px-2")}>
        <motion.button
          data-tour="add-trade-btn"
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-md font-medium text-[13px] transition-all duration-200",
            "border border-[#4EBF94]/50 bg-[#4EBF94]/10 hover:bg-[#4EBF94]/20",
            "text-[#4EBF94]",
            !isExpanded && "w-8 h-8 mx-auto p-0"
          )}
          onClick={() => {
            if (isPreTrial) {
              router.push('/checkout');
              return;
            }
            if (subscriptionStatus?.demoMode) {
              setShowDemoAlert(true);
              return;
            }
            setAddTrades();
            setMobileOpen(false);
          }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {isExpanded && <span>Add Trade</span>}
        </motion.button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide relative" data-tour-scroll="sidebar">
        
        <SectionLabel label="Trading" isExpanded={isExpanded} />
        <div className="space-y-0.5 mb-1">
          {tradingItems.map((item) => renderNavItem(item, isExpanded))}
        </div>

        <div className="mb-2 mt-3" data-tour="nav-backtesting">
            {isExpanded && (
              <div className="px-3 mb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">
                  Backtesting
                </span>
              </div>
            )}
            <div className={cn(
              "relative rounded-lg overflow-hidden",
              isExpanded && "mx-1 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20"
            )}>
              {isExpanded && (
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              )}
              
              <button
                onClick={() => setBacktestingOpen(!backtestingOpen)}
                aria-expanded={backtestingOpen}
                className={cn(
                  "relative w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
                  "text-blue-400 hover:text-blue-300",
                  !isExpanded && "justify-center rounded-md hover:bg-blue-500/10"
                )}
              >
                <CandlestickChart 
                  className="h-[17px] w-[17px] flex-shrink-0"
                  style={{ color: '#3B82F6' }}
                />
                {isExpanded && (
                  <>
                    <span className="flex-1 text-left">Backtesting</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-blue-500 to-blue-600 text-white uppercase tracking-wide">
                      Pro
                    </span>
                    <motion.div
                      animate={{ rotate: backtestingOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4 text-blue-400/60" />
                    </motion.div>
                  </>
                )}
              </button>
              
              <AnimatePresence>
                {backtestingOpen && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-2 px-1 space-y-0.5">
                      {backtestingSubItems.map((item) => renderNavItem(item, true))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>

        <SectionLabel label="Analysis" isExpanded={isExpanded} />
        <div className="space-y-0.5 mb-1">
          {analysisItems.map((item) => renderNavItem(item, isExpanded))}
        </div>

        <SectionLabel label="Tools" isExpanded={isExpanded} />
        <div className="space-y-0.5 mb-1">
          {toolsItems.map((item) => renderNavItem(item, isExpanded))}
        </div>

      </nav>

      <div className="mt-auto relative z-10">
        <div className="px-4 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        
        <div className="py-2 px-2 space-y-0.5">
          {bottomNavItems.map((item) => renderNavItem(item, isExpanded))}
        </div>

        <div className={cn("px-2 pb-2", !isExpanded && "px-1")}>
          {subscriptionStatus?.isSubscribed ? (
            <div className={cn(
              "relative rounded-xl overflow-hidden",
              isExpanded ? "px-3 py-2.5" : "p-2"
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 dark:from-amber-900/30 dark:via-amber-800/20 dark:to-amber-900/30 rounded-xl" />
              <div className="absolute inset-0 border border-amber-500/40 dark:border-amber-500/20 rounded-xl" />
              <div className={cn(
                "relative flex items-center gap-2.5",
                !isExpanded && "justify-center"
              )}>
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-3 w-3 text-white" />
                </div>
                {isExpanded && (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Pro Member
                  </span>
                )}
              </div>
            </div>
          ) : subscriptionStatus?.isOnTrial ? (
            <Link
              href={checkoutUrl}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative block rounded-xl cursor-pointer group overflow-hidden",
                !isExpanded && "rounded-lg"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-400/15 to-emerald-500/20 dark:from-emerald-900/30 dark:via-emerald-800/20 dark:to-emerald-900/30 rounded-xl" />
              <div className="absolute inset-0 border border-emerald-500/40 dark:border-emerald-500/20 rounded-xl" />
              <div className={cn(
                "relative flex items-center gap-2.5",
                isExpanded ? "px-3 py-2.5" : "p-2 justify-center"
              )}>
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                {isExpanded && (
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Free Trial
                    </span>
                    <span className="text-[10px] text-emerald-500/70 dark:text-emerald-400/70">
                      {subscriptionStatus.trialDaysLeft} {subscriptionStatus.trialDaysLeft === 1 ? 'day' : 'days'} left
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <Link
              href={checkoutUrl}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative block rounded-xl cursor-pointer group overflow-hidden",
                !isExpanded && "rounded-lg"
              )}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1218]" />
              <div className="absolute inset-0 rounded-xl border border-[#4EBF94]/40 group-hover:border-[#4EBF94]/60 transition-colors" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#4EBF94]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#4EBF94]/20 transition-colors" />
              <div className={cn(
                "relative flex items-center gap-3 p-3",
                !isExpanded && "justify-center p-2"
              )}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4EBF94]/20 to-[#4EBF94]/5 flex items-center justify-center flex-shrink-0 border border-[#4EBF94]/30">
                  <Crown className="h-4 w-4 text-[#4EBF94]" />
                </div>
                {isExpanded && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-semibold text-white">Go Pro</p>
                      <span className="px-1.5 py-0.5 rounded-full bg-[#4EBF94]/20 text-[8px] font-medium text-[#4EBF94] border border-[#4EBF94]/30">
                        20% OFF
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-0.5">Unlock all features</p>
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>

        <div className={cn("p-2 pt-0", !isExpanded && "px-1")}>
          {profileData.fullName && (
            <motion.div 
              className={cn(
                "relative rounded-lg overflow-hidden transition-all duration-200 cursor-pointer",
                isExpanded && "rounded-xl"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/20 to-transparent" />
                  <div className="absolute inset-0 border border-border rounded-xl" />
                </>
              )}
              
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 p-2.5",
                  !isExpanded && "justify-center p-1.5"
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "relative rounded-lg bg-gradient-to-br from-[#4EBF94]/40 to-[#4EBF94]/10 flex items-center justify-center ring-1 ring-[#4EBF94]/30",
                    isExpanded ? "w-8 h-8" : "w-7 h-7"
                  )}>
                    <span className={cn(
                      "font-bold text-[#4EBF94]",
                      isExpanded ? "text-xs" : "text-[10px]"
                    )}>
                      {userInitials}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#4EBF94] rounded-full border-2 border-sidebar" />
                </div>
                
                {isExpanded && (
                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {profileData.fullName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {maskedEmail}
                    </p>
                  </div>
                )}
              </Link>
            </motion.div>
          )}
          
          <motion.button
            className={cn(
              "group w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 mt-1 text-[12px] font-medium transition-all duration-200",
              "text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
              !isExpanded && "justify-center px-1.5"
            )}
            onClick={handleLogout}
            whileHover={{ x: isExpanded ? 2 : 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110" />
            {isExpanded && <span>Log out</span>}
          </motion.button>
        </div>
      </div>
    </div>
  );
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [backtestingOpen, setBacktestingOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(true);
  const [showDemoAlert, setShowDemoAlert] = useState<boolean>(false);

  const { profileData, setAccounts } = useAccountDetails();
  const checkoutUrl = "/checkout";
  const { setAddTrades, setAddAcc } = calendarPopUp();
  const { isOpen: isTourOpen, showWelcome, startTour, completeTour, skipTour, dismissWelcome, initFromStorage } = useTourStore();

  // Auto-expand sidebar when tour is active, restore when tour ends
  const [preTourCollapsed, setPreTourCollapsed] = useState<boolean | null>(null);
  const [preTourMobileOpen, setPreTourMobileOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (isTourOpen) {
      // Save current state before expanding
      setPreTourCollapsed(collapsed);
      setPreTourMobileOpen(mobileOpen);
      // Expand sidebar for tour
      setCollapsed(false);
      // Also open mobile sidebar on smaller screens
      if (window.innerWidth < 1024) {
        setMobileOpen(true);
      }
    } else if (preTourCollapsed !== null) {
      // Restore previous state after tour ends
      setCollapsed(preTourCollapsed);
      if (preTourMobileOpen !== null) {
        setMobileOpen(preTourMobileOpen);
      }
      setPreTourCollapsed(null);
      setPreTourMobileOpen(null);
    }
  }, [isTourOpen]);
  
  // Pages that don't require subscription (checkout, settings, support)
  const publicPages = ['/checkout', '/settings', '/support'];

  useEffect(() => {
    setAccounts();
  }, []);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscription/status', { 
          cache: 'no-store',
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
        } else {
          // Non-OK response (401, 500, etc.) - treat as no access
          setSubscriptionStatus({ hasAccess: false, isSubscribed: false, isOnTrial: false, trialDaysLeft: 0, status: 'none' });
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        // Network error - treat as no access for safety
        setSubscriptionStatus({ hasAccess: false, isSubscribed: false, isOnTrial: false, trialDaysLeft: 0, status: 'none' });
      } finally {
        setSubscriptionLoading(false);
      }
    };
    fetchSubscriptionStatus();
    
    // Listen for custom event to re-fetch (triggered after trial activation)
    const handleRefreshSubscription = () => {
      console.log('[Layout] Received refresh-subscription event');
      fetchSubscriptionStatus();
    };
    window.addEventListener('refresh-subscription', handleRefreshSubscription);
    
    return () => {
      window.removeEventListener('refresh-subscription', handleRefreshSubscription);
    };
  }, [pathname]); // Re-fetch on navigation to catch trial expiration

  // Redirect unpaid users based on their status
  useEffect(() => {
    if (subscriptionLoading) return;
    
    const isPublicPage = publicPages.some(page => pathname.startsWith(page));
    if (isPublicPage) return;
    
    // If user doesn't have access, check if they can start trial
    if (!subscriptionStatus || !subscriptionStatus.hasAccess) {
      // Pre-trial users can access dashboard, settings, support, and checkout
      const preTrialAllowedPages2 = ['/dashboard', '/settings', '/support', '/checkout'];
      const isPreTrialAllowedPage = preTrialAllowedPages2.some(page => pathname.startsWith(page));
      
      // Any restricted page access -> send to checkout
      if (!isPreTrialAllowedPage) {
        router.push('/checkout');
      }
    }
  }, [subscriptionStatus, subscriptionLoading, pathname, router]);

  useLayoutEffect(() => {
    const stored = localStorage.getItem('projournx_settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        const storedIsDark = settings.theme !== 'light';
        setIsDarkMode(storedIsDark);
        if (storedIsDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch {}
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useLayoutEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'dark' | 'light' }>;
      setIsDarkMode(customEvent.detail.theme === 'dark');
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/backtesting')) {
      setBacktestingOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pre-trial flag - users who can start trial but haven't yet
  const isPreTrial = subscriptionStatus?.canStartTrial === true && !subscriptionStatus?.hasAccess;
  
  // Check if a path is restricted for pre-trial users
  const isRestrictedPath = (href: string) => {
    return !preTrialAllowedPaths.some(allowed => href.startsWith(allowed));
  };

  const allNavItems = [
    ...tradingItems,
    ...analysisItems,
    ...toolsItems,
    ...backtestingSubItems,
    ...bottomNavItems,
  ];

  const filteredNavItems = searchQuery
    ? allNavItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allNavItems;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const getPageTitle = () => {
    const exactMatch = pageTitles[pathname];
    if (exactMatch) return exactMatch;
    const matchingKey = Object.keys(pageTitles).find((key) =>
      pathname.startsWith(key),
    );
    return matchingKey ? pageTitles[matchingKey] : "Dashboard";
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const isExpanded = !collapsed || mobileOpen;

  const handleLogout = useCallback(async () => {
    try {
      const response = await axios.post("/api/logout");
      if (response.data.success) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  // Memoized sidebar props to prevent unnecessary re-renders
  const sidebarProps: SidebarContentProps = {
    isExpanded,
    collapsed,
    mobileOpen,
    setCollapsed,
    setMobileOpen,
    backtestingOpen,
    setBacktestingOpen,
    subscriptionStatus,
    isPreTrial,
    showDemoAlert,
    setShowDemoAlert,
    setAddTrades,
    checkoutUrl,
    profileData,
    handleLogout,
    router,
    pathname,
  };

  // Show loading while checking subscription (only for protected pages)
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));
  if (subscriptionLoading && !isPublicPage) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Subscription access flags (isPreTrial is defined earlier for SidebarContent)
  const hasSubscriptionAccess = subscriptionStatus?.hasAccess || false;
  const isDemoMode = subscriptionStatus?.demoMode === true;
  
  // Pre-trial users can access specific pages with restricted features
  const preTrialAllowedPages2 = ['/dashboard', '/settings', '/support', '/checkout'];
  const isPreTrialAllowedPage = preTrialAllowedPages2.some(page => pathname.startsWith(page));
  
  // For unpaid users (not pre-trial), NEVER show sidebar, popups, or app shell
  // This prevents paywall bypass via modals or sidebar navigation
  if (!hasSubscriptionAccess && !isPreTrial) {
    // Expired users: On protected pages show redirect, on public pages show bare children
    if (!isPublicPage) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Redirecting...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }
  
  // Pre-trial users on non-allowed pages: show redirect
  if (isPreTrial && !isPreTrialAllowedPage && !isPublicPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Page Loading Indicator */}
      <Suspense fallback={null}>
        <PageLoading />
      </Suspense>

      {/* Popups */}
      <AddtradesMain />
      <DeleteAccPopup />
      <EditAccPopup />
      <AddAccPopup />
      <EditTradePopUp />
      <CalendarPopup />
      <AlertBox />
      <DjImgPopup />

      {/* Demo Mode Alert Modal */}
      <AnimatePresence>
        {showDemoAlert && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setShowDemoAlert(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm px-4"
            >
              <div className="bg-background border border-violet-500/30 rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500/20 via-purple-500/15 to-fuchsia-500/20 p-6">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-center text-white mb-2">Demo Mode</h3>
                  <p className="text-sm text-zinc-300 text-center">
                    This feature is not available in demo mode. Sign up to start tracking your trades.
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  <Link
                    href="/signup"
                    className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold text-center transition-all hover:shadow-lg hover:shadow-emerald-500/30"
                    onClick={() => setShowDemoAlert(false)}
                  >
                    Sign Up Now
                  </Link>
                  <button
                    onClick={() => setShowDemoAlert(false)}
                    className="w-full py-2.5 px-4 rounded-xl text-zinc-400 text-sm font-medium text-center hover:text-white hover:bg-white/5 transition-all"
                  >
                    Continue Exploring
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[20%] -translate-x-1/2 z-[101] w-full max-w-md"
            >
              <div className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted font-mono">ESC</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {filteredNavItems.length > 0 ? (
                    filteredNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Icon className="h-4 w-4" style={{ color: item.color }} />
                          <span className="text-sm">{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop (Floating Design) */}
      <aside
        className={cn(
          "fixed left-3 top-[25px] z-50 hidden lg:flex flex-col transition-all duration-300 ease-out",
          "h-[calc(100vh-50px)]",
          collapsed ? "w-[52px]" : "w-[220px]",
        )}
      >
        <div className={cn(
          "h-full rounded-2xl overflow-hidden relative",
          "bg-sidebar/95 backdrop-blur-2xl",
          "border border-sidebar-border",
          "shadow-2xl shadow-black/10 dark:shadow-black/40"
        )}>
          {/* Layered gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.02] via-transparent to-foreground/[0.02] dark:from-white/[0.04] dark:via-transparent dark:to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#4EBF94]/[0.01] via-transparent to-violet-500/[0.01] dark:from-[#4EBF94]/[0.02] dark:to-violet-500/[0.02] pointer-events-none" />
          
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none" />
          
          <SidebarContent {...sidebarProps} />
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex lg:hidden h-screen w-[264px] flex-col transition-transform duration-300 ease-out p-2",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn(
          "h-full rounded-2xl overflow-hidden relative",
          "bg-sidebar/98 backdrop-blur-2xl",
          "border border-sidebar-border",
          "shadow-2xl shadow-black/10 dark:shadow-black/40"
        )}>
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.02] via-transparent to-foreground/[0.02] dark:from-white/[0.04] dark:via-transparent dark:to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#4EBF94]/[0.01] via-transparent to-violet-500/[0.01] dark:from-[#4EBF94]/[0.02] dark:to-violet-500/[0.02] pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none" />
          
          <SidebarContent {...sidebarProps} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain transition-all duration-300",
          "lg:ml-[64px]",
          !collapsed && "lg:ml-[232px]",
        )}
      >
        {/* Demo Mode Banner */}
        {subscriptionStatus?.demoMode && <DemoModeBanner />}
        
        {/* Announcement Banner */}
        {!subscriptionStatus?.demoMode && <AnnouncementBanner />}
        
        {/* Prop Firm Phase Advancement Notification */}
        {!subscriptionStatus?.demoMode && <PhaseAdvancementNotification />}

        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold text-foreground">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Currency Dropdown */}
            <CurrencyDropdown />

            {/* Accounts Dropdown */}
            <AccountsDropdown />

            {/* Date Range */}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Last 30 days</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className={pathname === "/daily-journal" || pathname === "/notebook" ? "p-0" : "p-4 lg:p-6"}>
          {children}
        </main>
      </div>

      {/* Onboarding Tour */}
      <WelcomeModal
        isOpen={showWelcome}
        onStartTour={startTour}
        onSkip={dismissWelcome}
      />
      <OnboardingTour
        steps={platformTourSteps}
        isOpen={isTourOpen}
        onComplete={completeTour}
        onSkip={skipTour}
      />
    </div>
  );
}
