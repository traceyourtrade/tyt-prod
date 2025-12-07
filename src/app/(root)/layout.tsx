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
    <div className="h-full flex flex-col">
      {/* Sidebar Header with Logo */}
      <div className={cn(
        "flex items-center h-14 px-4 border-b border-white/[0.06]",
        collapsed && !mobileOpen ? "justify-center" : "justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group" onClick={() => setMobileOpen(false)}>
          {(collapsed && !mobileOpen) && (
            <div className="w-8 h-8 flex items-center justify-center">
              <Image 
                src="/images/lightning-icon.png" 
                width={28} 
                height={28} 
                alt="ProJournX" 
                className="w-7 h-7 object-contain"
                unoptimized
              />
            </div>
          )}
          {(!collapsed || mobileOpen) && (
            <>
              <Image 
                src="/images/logo-dark.png" 
                width={32} 
                height={32} 
                alt="ProJournX" 
                className="h-8 w-8 object-contain"
                unoptimized
              />
              <span className="font-semibold text-foreground text-sm tracking-tight">
                ProJournX
              </span>
            </>
          )}
        </Link>
        {(!collapsed || mobileOpen) && (
          <button
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            onClick={() => mobileOpen ? setMobileOpen(false) : setCollapsed(true)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Collapse button when collapsed */}
      {collapsed && !mobileOpen && (
        <button
          className="mx-auto mt-3 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      {/* Add Trades Button - Premium Floating Pill CTA */}
      <div className={cn("px-3 mt-6", collapsed && !mobileOpen && "mt-4 px-2")}>
        <button
          className={cn(
            "group relative w-full flex items-center justify-center gap-2.5 py-3 font-medium text-sm transition-all duration-300 ease-out",
            "rounded-full",
            "bg-gradient-to-b from-[#3B82F6] to-[#2563EB]",
            "text-white",
            "shadow-[0_4px_20px_rgba(59,130,246,0.35)]",
            "hover:shadow-[0_8px_30px_rgba(59,130,246,0.5)]",
            "hover:-translate-y-0.5",
            "active:translate-y-0 active:shadow-[0_2px_10px_rgba(59,130,246,0.3)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151515]",
            collapsed && !mobileOpen ? "px-0 w-11 h-11 mx-auto" : "px-5"
          )}
          onClick={() => {
            setAddTrades()
            setMobileOpen(false)
          }}
        >
          <Plus className={cn(
            "h-[18px] w-[18px] transition-transform duration-300 ease-out",
            "group-hover:rotate-90"
          )} />
          {(!collapsed || mobileOpen) && (
            <span className="tracking-wide">Add Trade</span>
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-2 scrollbar-hide">
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
                    "group relative flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all duration-200 ease-out",
                    "rounded-md",
                    active 
                      ? "bg-white/[0.08] text-white" 
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]",
                    collapsed && !mobileOpen && "justify-center px-2",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                  )}
                  <Icon className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-all duration-200",
                    "group-hover:scale-110",
                    active ? "text-white" : "text-white/60 group-hover:text-white"
                  )} />
                  {(!collapsed || mobileOpen) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="py-2 px-2 border-t border-white/[0.06]">
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
                    "group relative flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all duration-200 ease-out",
                    "rounded-md",
                    active 
                      ? "bg-white/[0.08] text-white" 
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]",
                    collapsed && !mobileOpen && "justify-center px-2",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                  )}
                  <Icon className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-all duration-200",
                    "group-hover:scale-110",
                    active ? "text-white" : "text-white/60 group-hover:text-white"
                  )} />
                  {(!collapsed || mobileOpen) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User Section */}
      <div className="p-2 border-t border-white/[0.06]">
        {profileData.fullName && (
          <Link 
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-md p-2 mb-1 transition-all duration-200 ease-out",
              "hover:bg-white/[0.04]",
              collapsed && !mobileOpen && "justify-center",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            )}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {userInitials}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#4EBF94] rounded-full border-2 border-[#151515]" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">
                  {profileData.fullName}
                </p>
                <p className="text-[11px] text-white/40 truncate">
                  {maskedEmail}
                </p>
              </div>
            )}
          </Link>
        )}
        
        <button
          className={cn(
            "group w-full flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200 ease-out",
            "text-white/60 hover:text-red-400 hover:bg-red-500/10",
            collapsed && !mobileOpen && "justify-center px-2",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/50"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-all duration-200 group-hover:scale-110" />
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
          "bg-[#151515] border-r border-border/50",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 flex lg:hidden h-screen w-[240px] flex-col transition-transform duration-300 ease-out",
          "bg-[#151515] border-r border-border/50",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-[68px]",
        !collapsed && "lg:ml-[240px]"
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
