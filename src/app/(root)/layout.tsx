"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import axios from "axios"
import "../globals.css"

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

import useAccountDetails from "@/store/accountdetails"
import calendarPopUp from "@/store/calendarPopUp"

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Daily Journal", href: "/daily-journal", icon: BookOpen },
  { name: "Notebook", href: "/notebook", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Strategies", href: "/strategies", icon: Target },
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
  
  const { profileData } = useAccountDetails()
  const { setAddTrades, setAddAcc } = calendarPopUp()
  
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
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className={cn(
        "flex items-center h-[72px] px-5",
        collapsed && !mobileOpen ? "justify-center px-3" : "justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group" onClick={() => setMobileOpen(false)}>
          {(collapsed && !mobileOpen) ? (
            <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Image 
                src="/images/lightning-icon.png" 
                width={40} 
                height={40} 
                alt="ProJournX" 
                className="w-10 h-10 object-contain"
                unoptimized
              />
            </div>
          ) : (
            <Image 
              src="/images/logo-dark.png?v=2" 
              width={150} 
              height={40} 
              alt="ProJournX" 
              className="h-9 w-auto"
              unoptimized
            />
          )}
        </Link>
        {(!collapsed || mobileOpen) && (
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-all duration-200"
            onClick={() => mobileOpen ? setMobileOpen(false) : setCollapsed(true)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && !mobileOpen && (
        <div className="px-3 mb-2">
          <button
            className="w-full h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition-all duration-200"
            onClick={() => setCollapsed(false)}
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}

      {/* Add Trade Button */}
      <div className={cn("px-4 mb-6", collapsed && !mobileOpen && "px-3 mb-4")}>
        <button
          className={cn(
            "group relative w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden",
            "bg-primary text-white",
            "shadow-lg shadow-primary/20",
            "hover:shadow-xl hover:shadow-primary/30 hover:brightness-110",
            "active:scale-[0.98] active:shadow-md",
            collapsed && !mobileOpen ? "px-0 py-3" : "px-5"
          )}
          onClick={() => {
            setAddTrades()
            setMobileOpen(false)
            document.body.classList.add("no-scroll")
          }}
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <Plus className={cn(
            "relative z-10 transition-all duration-300",
            collapsed && !mobileOpen ? "h-5 w-5" : "h-4 w-4",
            "group-hover:rotate-90"
          )} />
          {(!collapsed || mobileOpen) && (
            <span className="relative z-10 font-semibold tracking-wide">Add Trade</span>
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 scrollbar-hide">
        {(!collapsed || mobileOpen) && (
          <div className="px-3 mb-3">
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em]">
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
                    "group relative flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                    collapsed && !mobileOpen && "justify-center px-0 py-3"
                  )}
                >
                  {active && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                  )}
                  <div className={cn(
                    "flex items-center justify-center transition-all duration-200",
                    collapsed && !mobileOpen && "w-full",
                    active && collapsed && !mobileOpen && "bg-primary/10 rounded-lg p-2"
                  )}>
                    <Icon className={cn(
                      "flex-shrink-0 transition-all duration-200",
                      collapsed && !mobileOpen ? "h-5 w-5" : "h-[18px] w-[18px]",
                      active ? "text-primary" : "group-hover:text-foreground"
                    )} />
                  </div>
                  {(!collapsed || mobileOpen) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto">
        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* General Navigation */}
        <div className="py-3 px-3">
          {(!collapsed || mobileOpen) && (
            <div className="px-3 mb-3">
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em]">
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
                      "group relative flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                      active 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                      collapsed && !mobileOpen && "justify-center px-0 py-3"
                    )}
                  >
                    {active && !collapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                    )}
                    <div className={cn(
                      "flex items-center justify-center transition-all duration-200",
                      collapsed && !mobileOpen && "w-full",
                      active && collapsed && !mobileOpen && "bg-primary/10 rounded-lg p-2"
                    )}>
                      <Icon className={cn(
                        "flex-shrink-0 transition-all duration-200",
                        collapsed && !mobileOpen ? "h-5 w-5" : "h-[18px] w-[18px]",
                        active ? "text-primary" : "group-hover:text-foreground"
                      )} />
                    </div>
                    {(!collapsed || mobileOpen) && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* User Profile Section */}
        <div className={cn(
          "p-3",
          (!collapsed || mobileOpen) && "pt-0"
        )}>
          {profileData.fullName && (
            <Link 
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl p-3 mb-2 transition-all duration-200",
                "bg-gradient-to-r from-white/[0.03] to-white/[0.01]",
                "hover:from-white/[0.06] hover:to-white/[0.03]",
                "border border-white/[0.04] hover:border-white/[0.08]",
                collapsed && !mobileOpen && "justify-center p-2.5"
              )}
            >
              <div className="relative flex-shrink-0">
                <div className={cn(
                  "rounded-xl bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center",
                  "ring-1 ring-primary/20",
                  collapsed && !mobileOpen ? "w-9 h-9" : "w-10 h-10"
                )}>
                  <span className={cn(
                    "font-bold text-primary",
                    collapsed && !mobileOpen ? "text-sm" : "text-base"
                  )}>
                    {userInitials}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f0f0f]" />
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-white transition-colors">
                    {profileData.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {maskedEmail}
                  </p>
                </div>
              )}
            </Link>
          )}
          
          <button
            className={cn(
              "group w-full flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
              "text-muted-foreground/70 hover:text-red-400 hover:bg-red-500/10",
              collapsed && !mobileOpen && "justify-center px-0 py-3"
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn(
              "flex-shrink-0 transition-all duration-200",
              collapsed && !mobileOpen ? "h-5 w-5" : "h-[18px] w-[18px]"
            )} />
            {(!collapsed || mobileOpen) && <span>Log out</span>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
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
          "bg-[#0c0c0c] border-r border-white/[0.06]",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 flex lg:hidden h-screen w-[280px] flex-col transition-transform duration-300 ease-out",
          "bg-[#0c0c0c] border-r border-white/[0.06]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-[72px]",
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
            {/* Accounts Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex gap-2"
              onClick={() => setAddAcc()}
            >
              <DollarSign className="h-4 w-4" />
              <span>Accounts</span>
              <ChevronDown className="h-3 w-3" />
            </Button>

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
