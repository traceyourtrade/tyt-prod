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
} from "lucide-react"
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

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-card/80 backdrop-blur-xl border-r border-border/50 transition-all duration-300 ease-out",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {/* Sidebar Header with Custom Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border/50",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300">
                {/* Custom Projournx Logo - Chart with upward trend */}
                <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6 text-primary-foreground">
                  <path d="M8 28L16 20L22 24L32 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M26 12H32V18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="16" cy="20" r="2.5" fill="currentColor" opacity="0.8" />
                </svg>
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-foreground tracking-tight text-[15px]">
                  Projournx
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                  Trading Journal
                </span>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapse button when collapsed */}
        {collapsed && (
          <button
            className="mx-auto mt-3 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        )}

        {/* Add Trades Button with Animations */}
        <div className={cn("px-3 mt-4", collapsed && "mt-2")}>
          <button
            className={cn(
              "group relative w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden",
              "bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground",
              "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1",
              "active:translate-y-0 active:shadow-lg active:scale-[0.98]",
              "animate-pulse-glow",
              collapsed ? "px-0" : "px-4"
            )}
            onClick={() => {
              setAddTrades()
              document.body.classList.add("no-scroll")
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />
            
            {/* Icon with animation */}
            <Plus className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
            
            {!collapsed && (
              <span className="relative z-10 tracking-wide">Add Trade</span>
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-xl bg-primary-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
          {!collapsed && (
            <div className="mb-2">
              <span className="px-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
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
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {/* Active indicator */}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                    )}
                    <Icon className={cn(
                      "h-[18px] w-[18px] flex-shrink-0 transition-transform",
                      active ? "text-primary" : "group-hover:scale-110"
                    )} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        <div className="py-2 px-3 border-t border-border/50">
          {!collapsed && (
            <div className="mb-2">
              <span className="px-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
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
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                    )}
                    <Icon className={cn(
                      "h-[18px] w-[18px] flex-shrink-0 transition-transform",
                      active ? "text-primary" : "group-hover:scale-110"
                    )} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-border/50">
          {profileData.fullName && (
            <Link 
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-xl p-2.5 mb-2 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
                collapsed && "justify-center p-2"
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                  <span className="text-sm font-bold text-primary">
                    {userInitials}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-profit rounded-full border-2 border-card" />
              </div>
              {!collapsed && (
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {profileData.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {maskedEmail}
                  </p>
                </div>
              )}
            </Link>
          )}
          
          <button
            className={cn(
              "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "text-muted-foreground hover:text-loss hover:bg-loss/10",
              collapsed && "justify-center px-0"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "ml-[68px]" : "ml-[260px]"
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setCollapsed(!collapsed)}
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
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

            {/* Date Range placeholder */}
            <Button variant="outline" size="sm" className="hidden md:flex gap-2">
              <Calendar className="h-4 w-4" />
              <span>Last 30 days</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
