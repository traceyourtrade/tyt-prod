// changes 12-13-25

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
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

import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";

const tradingItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "#6B8ACD" },
  { name: "Daily Journal", href: "/daily-journal", icon: BookOpen, color: "#9B8AC4" },
  { name: "Notebook", href: "/notebook", icon: FileText, color: "#C9A86C" },
];

const analysisItems = [
  { name: "Reports", href: "/reports", icon: BarChart3, color: "#7CB89E" },
  { name: "Strategies", href: "/strategies", icon: Target, color: "#C47A7A" },
  { name: "Playbook", href: "/playbook", icon: Sparkles, color: "#C47A9B" },
  { name: "AI Analysis", href: "/ai-analysis", icon: BrainCircuit, color: "#8B5CF6", badge: "New" },
];

const toolsItems = [
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy, color: "#F59E0B" },
  { name: "Resources", href: "/resources", icon: GraduationCap, color: "#5EAAA8" },
  { name: "Lot Calculator", href: "/lot-calculator", icon: Calculator, color: "#6BB8C4" },
];

const backtestingSubItems = [
  { name: "Dashboard", href: "/backtesting/dashboard", icon: LayoutDashboard, color: "#E879F9" },
  { name: "Sessions", href: "/backtesting/sessions", icon: Activity, color: "#E879F9" },
];

const bottomNavItems = [
  { name: "Support", href: "/support", icon: HelpCircle, color: "#8B8B8B" },
  { name: "Settings", href: "/settings", icon: Settings, color: "#8B8B8B" },
];

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
  "/playbook": "Playbook",
  "/ai-analysis": "AI Analysis",
  "/leaderboard": "Leaderboard",
  "/backtesting": "Backtesting",
  "/backtesting/dashboard": "Backtesting Dashboard",
  "/backtesting/reports": "Backtesting Reports",
  "/backtesting/sessions": "Backtesting Sessions",
  "/lot-calculator": "Lot Calculator",
  "/settings": "Settings",
  "/support": "Support",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [backtestingOpen, setBacktestingOpen] = useState<boolean>(false);

  const { profileData, setAccounts } = useAccountDetails();
  const { setAddTrades, setAddAcc } = calendarPopUp();

  useEffect(() => {
    setAccounts();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/backtesting')) {
      setBacktestingOpen(true);
    }
  }, [pathname]);

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

  const handleLogout = async () => {
    try {
      const response = await axios.post("/api/logout");
      if (response.data.success) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const userInitials = profileData.fullName
    ? `${profileData.fullName.charAt(0)}${profileData.fullName.split(" ")[1]?.charAt(0) || ""}`
    : "U";

  const maskedEmail = profileData.email
    ? profileData.email.replace(/^(.{4}).*(@.*)$/, (_, a, b) => `${a}*****${b}`)
    : "";

  const isExpanded = !collapsed || mobileOpen;

  const NavItem = ({ item, showLabel = true }: { item: { name: string; href: string; icon: React.ElementType; color: string; badge?: string }; showLabel?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
          active 
            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
            : "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50",
          !showLabel && "justify-center px-2"
        )}
      >
        {active && (
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
            style={{ 
              backgroundColor: item.color,
              boxShadow: `0 0 12px 2px ${item.color}60, 0 0 20px 4px ${item.color}30`
            }}
            layoutId="sidebarActiveIndicator"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        
        <div className="relative flex-shrink-0 transition-all duration-200">
          <Icon 
            className={cn(
              "h-[17px] w-[17px] transition-all duration-200",
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
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <>
      {isExpanded && (
        <div className="px-3 mb-1.5 mt-4 first:mt-0">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">
            {label}
          </span>
        </div>
      )}
    </>
  );

  const SidebarContent = () => (
    <div className="h-full flex flex-col relative">
      {/* Animated gradient orbs - subtle in both themes */}
      <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#4EBF94]/10 dark:bg-[#4EBF94]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-4 left-12 w-20 h-20 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-2xl pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 -right-8 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Logo Section */}
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
            <div className="w-9 h-9 rounded-lg overflow-hidden ring-1 ring-white/10 dark:ring-white/10 shadow-md shadow-black/5 dark:shadow-black/30 bg-sidebar-accent/50 dark:bg-white/5 flex items-center justify-center">
              <Image
                src="/images/logo-icon.png"
                width={28}
                height={28}
                alt="ProJournX"
                className="w-7 h-7 object-contain"
                unoptimized
              />
            </div>
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

      {/* Add Trade Button */}
      <div className={cn("px-3 mt-3", !isExpanded && "mt-2 px-2")}>
        <motion.button
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-md font-medium text-[13px] transition-all duration-200",
            "border border-[#4EBF94]/50 bg-[#4EBF94]/10 hover:bg-[#4EBF94]/20",
            "text-[#4EBF94]",
            !isExpanded && "w-9 h-9 mx-auto p-0"
          )}
          onClick={() => {
            setAddTrades();
            setMobileOpen(false);
          }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {isExpanded && <span>Add Trade</span>}
        </motion.button>
      </div>

      {/* Quick search hint */}
      {isExpanded && (
        <div className="mx-3 mt-2 px-2.5 py-1.5 rounded-md bg-muted/30 dark:bg-muted/50 border border-border flex items-center gap-2 cursor-pointer hover:bg-muted/50 dark:hover:bg-muted transition-colors">
          <Command className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground flex-1">Quick search...</span>
          <span className="text-[9px] text-muted-foreground/70 px-1 py-0.5 rounded bg-muted font-mono">K</span>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide relative">
        
        {/* Trading Section */}
        <SectionLabel label="Trading" />
        <div className="space-y-0.5 mb-1">
          {tradingItems.map((item) => (
            <NavItem key={item.name} item={item} showLabel={isExpanded} />
          ))}
        </div>

        {/* Backtesting Section - Premium Feature */}
        <div className="mb-2 mt-3">
          {isExpanded && (
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">
                Backtesting
              </span>
            </div>
          )}
          <div className={cn(
            "relative rounded-lg overflow-hidden",
            isExpanded && "mx-1 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-transparent border border-fuchsia-500/20"
          )}>
            {/* Premium glow effect */}
            {isExpanded && (
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-fuchsia-500/20 rounded-full blur-2xl pointer-events-none" />
            )}
            
            <button
              onClick={() => setBacktestingOpen(!backtestingOpen)}
              className={cn(
                "relative w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
                "text-fuchsia-400 hover:text-fuchsia-300",
                !isExpanded && "justify-center rounded-md hover:bg-fuchsia-500/10"
              )}
            >
              <CandlestickChart 
                className="h-[17px] w-[17px] flex-shrink-0"
                style={{ color: '#E879F9' }}
              />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">Backtesting</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white uppercase tracking-wide">
                    Pro
                  </span>
                  <motion.div
                    animate={{ rotate: backtestingOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-fuchsia-400/60" />
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
                    {backtestingSubItems.map((item) => (
                      <NavItem key={item.name} item={item} showLabel={true} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Analysis Section */}
        <SectionLabel label="Analysis" />
        <div className="space-y-0.5 mb-1">
          {analysisItems.map((item) => (
            <NavItem key={item.name} item={item} showLabel={isExpanded} />
          ))}
        </div>

        {/* Tools Section */}
        <SectionLabel label="Tools" />
        <div className="space-y-0.5 mb-1">
          {toolsItems.map((item) => (
            <NavItem key={item.name} item={item} showLabel={isExpanded} />
          ))}
        </div>

      </nav>

      {/* Bottom Section */}
      <div className="mt-auto relative z-10">
        <div className="px-4 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        
        <div className="py-2 px-2 space-y-0.5">
          {bottomNavItems.map((item) => (
            <NavItem key={item.name} item={item} showLabel={isExpanded} />
          ))}
        </div>

        {/* Premium User Card */}
        <div className="p-2 pt-0">
          {profileData.fullName && (
            <motion.div 
              className={cn(
                "relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer",
                !isExpanded && "p-1"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/20 to-transparent" />
              <div className="absolute inset-0 border border-border rounded-xl" />
              
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 p-3",
                  !isExpanded && "justify-center p-2"
                )}
              >
                {/* Avatar with activity ring */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4EBF94] to-emerald-600 opacity-30 blur-sm" />
                  <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#4EBF94]/40 to-[#4EBF94]/10 flex items-center justify-center ring-2 ring-[#4EBF94]/30">
                    <span className="text-sm font-bold text-[#4EBF94]">
                      {userInitials}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4EBF94] rounded-full border-2 border-sidebar flex items-center justify-center">
                    <Zap className="w-1.5 h-1.5 text-sidebar" />
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {profileData.fullName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {maskedEmail}
                    </p>
                  </div>
                )}
              </Link>
            </motion.div>
          )}
          
          {/* Logout button */}
          <motion.button
            className={cn(
              "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 mt-1 text-[13px] font-medium transition-all duration-200",
              "text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
              !isExpanded && "justify-center px-2"
            )}
            onClick={handleLogout}
            whileHover={{ x: isExpanded ? 3 : 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110" />
            {isExpanded && <span>Log out</span>}
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
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
          "fixed left-0 top-0 z-50 hidden lg:flex h-screen flex-col transition-all duration-300 ease-out p-1.5",
          collapsed ? "w-[68px]" : "w-[250px]",
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
          
          <SidebarContent />
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
          
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          "lg:ml-[68px]",
          !collapsed && "lg:ml-[250px]",
        )}
      >
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
            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hidden lg:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              <PanelLeft className="h-5 w-5" />
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
            <div className="hidden sm:block">
              <AccountsDropdown />
            </div>

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
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
