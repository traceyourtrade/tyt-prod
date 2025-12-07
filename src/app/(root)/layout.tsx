"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import axios from "axios"
import "../globals.css"
import PageLoading from "@/components/ui/page-loading"

import { cn } from "@/lib/utils"
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
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

import DeleteAccPopup from "@/components/dashboard-components/popups/DeleteAccPopup"
import EditAccPopup from "@/components/dashboard-components/popups/EditAccPopup"
import AddAccPopup from "@/components/dashboard-components/popups/AddAccPopup"
import AddtradesMain from "@/components/trades-popup/add-trades/AddTradesMain"
import EditTradePopUp from "@/components/trades-popup/edit-trades/EditTradePopUp"
import CalendarPopup from "@/components/dashboard-components/popups/CalendarPopUp"
import AlertBox from "@/components/dashboard-components/popups/AlertBox"
import DjImgPopup from "@/components/dashboard-components/popups/DjImgPopup"
import AccountsDropdown from "@/components/dashboard-components/AccountsDropdown"
import CurrencyDropdown from "@/components/dashboard-components/CurrencyDropdown"

import useAccountDetails from "@/store/accountdetails"
import calendarPopUp from "@/store/calendarPopUp"

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Daily Journal", href: "/daily-journal", icon: BookOpen },
  { name: "Notebook", href: "/notebook", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Strategies", href: "/strategies", icon: Target },
  { name: "Playbook", href: "/playbook", icon: Sparkles },
  { name: "Lot Calculator", href: "/lot-calculator", icon: Calculator },
]

const bottomNavItems = [
  { name: "Support", href: "/support", icon: HelpCircle },
  { name: "Settings", href: "/settings", icon: Settings },
]

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
  "/lot-calculator": "Lot Calculator",
  "/settings": "Settings",
  "/support": "Support",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true)
  
  const { profileData, setAccounts } = useAccountDetails()
  const { setAddTrades, setAddAcc } = calendarPopUp()
  
  useEffect(() => {
    setAccounts()
  }, [])
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const getPageTitle = () => {
    const exactMatch = pageTitles[pathname]
    if (exactMatch) return exactMatch
    const matchingKey = Object.keys(pageTitles).find(key => pathname.startsWith(key))
    return matchingKey ? pageTitles[matchingKey] : "Dashboard"
  }

  const handleLogout = async () => {
    try {
      const response = await axios.post('/api/logout')
      if (response.data.success) {
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const userInitials = profileData.fullName 
    ? `${profileData.fullName.charAt(0)}${profileData.fullName.split(" ")[1]?.charAt(0) || ""}`
    : "U"

  const maskedEmail = profileData.email 
    ? profileData.email.replace(/^(.{4}).*(@.*)$/, (_, a, b) => `${a}*****${b}`)
    : ""

  const SidebarContent = () => (
    <div className="relative h-full flex flex-col">
      {/* Glassmorphic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-white/[0.02] pointer-events-none rounded-inherit" />
      {/* Subtle inner glow on the right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#4EBF94]/20 via-white/5 to-[#4EBF94]/20 pointer-events-none" />
      
      {/* Sidebar Header with Logo */}
      <div className={cn(
        "relative flex items-center h-16 px-4",
        collapsed && !mobileOpen ? "justify-center" : "justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group" onClick={() => setMobileOpen(false)}>
          {/* Collapsed: Custom Lightning Bolt Image */}
          {(collapsed && !mobileOpen) && (
            <div className="w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-all duration-300 ring-1 ring-white/10 rounded-xl">
              <Image 
                src="/images/lightning-icon.png" 
                width={32} 
                height={32} 
                alt="ProJournX" 
                className="w-8 h-8 object-contain"
                unoptimized
              />
            </div>
          )}
          {/* Expanded: Full Logo */}
          {(!collapsed || mobileOpen) && (
            <>
              <div className="relative">
                <Image 
                  src="/images/logo-dark.png" 
                  width={40} 
                  height={40} 
                  alt="ProJournX" 
                  className="h-10 w-10 object-contain ring-1 ring-white/10 rounded-xl"
                  unoptimized
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4EBF94]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white tracking-tight text-[15px]">
                  ProJournX
                </span>
                <span className="text-[10px] text-white/40 font-medium tracking-wide">
                  Trading Journal
                </span>
              </div>
            </>
          )}
        </Link>
        {(!collapsed || mobileOpen) && (
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4EBF94]/50"
            onClick={() => mobileOpen ? setMobileOpen(false) : setCollapsed(true)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Collapse button when collapsed (desktop only) */}
      {collapsed && !mobileOpen && (
        <button
          className="mx-auto mt-2 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4EBF94]/50"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      {/* Add Trades Button - Premium Gradient */}
      <div className={cn("px-3 mt-4", collapsed && !mobileOpen && "mt-2")}>
        <button
          className={cn(
            "group relative w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden",
            "bg-gradient-to-r from-[#4EBF94] to-[#3AAE83]",
            "text-white shadow-lg shadow-[#4EBF94]/25",
            "hover:shadow-xl hover:shadow-[#4EBF94]/35 hover:-translate-y-0.5",
            "active:translate-y-0 active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            collapsed && !mobileOpen ? "px-0" : "px-4"
          )}
          onClick={() => {
            setAddTrades()
            setMobileOpen(false)
          }}
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <Plus className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:rotate-90" />
          {(!collapsed || mobileOpen) && (
            <span className="relative z-10 tracking-wide">Add Trade</span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="px-4 mt-5 mb-2">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 scrollbar-hide">
        {(!collapsed || mobileOpen) && (
          <div className="mb-3 px-3">
            <span className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em]">
              Menu
            </span>
          </div>
        )}
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4EBF94]/50",
                    active 
                      ? "bg-gradient-to-r from-[#4EBF94]/15 to-transparent text-[#4EBF94]" 
                      : "text-white/60 hover:text-white hover:bg-white/5",
                    collapsed && !mobileOpen && "justify-center px-0"
                  )}
                >
                  {/* Active indicator - left glow bar */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#4EBF94] shadow-[0_0_12px_2px_rgba(78,191,148,0.5)]" />
                  )}
                  <Icon className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200",
                    active ? "text-[#4EBF94]" : "group-hover:scale-110"
                  )} />
                  {(!collapsed || mobileOpen) && <span>{item.name}</span>}
                  {/* Hover glow effect */}
                  {!active && (
                    <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.03] transition-colors duration-200" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="px-4 mb-2">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Bottom Navigation */}
      <div className="py-2 px-3">
        {(!collapsed || mobileOpen) && (
          <div className="mb-3 px-3">
            <span className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em]">
              General
            </span>
          </div>
        )}
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4EBF94]/50",
                    active 
                      ? "bg-gradient-to-r from-[#4EBF94]/15 to-transparent text-[#4EBF94]" 
                      : "text-white/60 hover:text-white hover:bg-white/5",
                    collapsed && !mobileOpen && "justify-center px-0"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#4EBF94] shadow-[0_0_12px_2px_rgba(78,191,148,0.5)]" />
                  )}
                  <Icon className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-transform",
                    active ? "text-[#4EBF94]" : "group-hover:scale-110"
                  )} />
                  {(!collapsed || mobileOpen) && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User Section - Premium Card */}
      <div className="p-3 border-t border-white/[0.06]">
        {profileData.fullName && (
          <Link 
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl p-2.5 mb-2 transition-all duration-200 cursor-pointer",
              "bg-gradient-to-r from-white/[0.04] to-transparent",
              "hover:from-white/[0.08] hover:to-white/[0.02]",
              "border border-white/[0.04] hover:border-white/[0.08]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4EBF94]/50",
              collapsed && !mobileOpen && "justify-center p-2"
            )}
          >
            {/* Avatar with glow ring */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4EBF94]/30 to-[#4EBF94]/10 flex items-center justify-center ring-2 ring-[#4EBF94]/20 shadow-lg shadow-[#4EBF94]/10">
                <span className="text-sm font-bold text-[#4EBF94]">
                  {userInitials}
                </span>
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4EBF94] rounded-full border-2 border-[#0C1117] shadow-[0_0_8px_rgba(78,191,148,0.6)]" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profileData.fullName}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {maskedEmail}
                </p>
              </div>
            )}
          </Link>
        )}
        
        {/* Logout button */}
        <button
          className={cn(
            "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "text-white/40 hover:text-red-400 hover:bg-red-500/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50",
            collapsed && !mobileOpen && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110" />
          {(!collapsed || mobileOpen) && <span>Log out</span>}
        </button>
      </div>
    </div>
  )

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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 hidden lg:flex h-screen flex-col transition-all duration-300 ease-out",
          "bg-[#0C1117]/95 backdrop-blur-xl",
          "border-r border-white/[0.08]",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 flex lg:hidden h-screen w-[260px] flex-col transition-transform duration-300 ease-out",
          "bg-[#0C1117] backdrop-blur-xl",
          "border-r border-white/[0.08]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-[68px]",
        !collapsed && "lg:ml-[260px]"
      )}>
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
            <Button variant="outline" size="sm" className="hidden md:flex gap-2">
              <Calendar className="h-4 w-4" />
              <span>Last 30 days</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
