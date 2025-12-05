"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Sparkles,
} from "lucide-react"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onAddTrades?: () => void
  onLogout?: () => void
  user?: {
    name: string
    email: string
    initials: string
  }
}

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

export function Sidebar({ 
  collapsed, 
  onToggle, 
  onAddTrades, 
  onLogout,
  user 
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-card/80 backdrop-blur-xl border-r border-border/50 transition-all duration-300 ease-out",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-border/50",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
              <LineChart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-profit rounded-full border-2 border-card" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-foreground tracking-tight">
                Projournx
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Trading Journal
              </span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            onClick={onToggle}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse button when collapsed */}
      {collapsed && (
        <button
          className="mx-auto mt-3 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          onClick={onToggle}
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      {/* Add Trade Button */}
      <div className={cn("px-3 mt-4", collapsed && "mt-2")}>
        <button
          className={cn(
            "group relative w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
            "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground",
            "hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
            "active:translate-y-0 active:shadow-md",
            collapsed ? "px-0" : "px-4"
          )}
          onClick={() => {
            onAddTrades?.()
            document.body.classList.add("no-scroll")
          }}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>Add Trade</span>}
          <div className="absolute inset-0 rounded-xl bg-primary-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        <div className={cn("mb-2", collapsed && "hidden")}>
          <span className="px-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Menu
          </span>
        </div>
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

      {/* Bottom Section */}
      <div className="mt-auto">
        {/* Bottom Navigation */}
        <div className="py-2 px-3 border-t border-border/50">
          <div className={cn("mb-2", collapsed && "hidden")}>
            <span className="px-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              General
            </span>
          </div>
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
          {user && (
            <div className={cn(
              "flex items-center gap-3 rounded-xl p-2.5 mb-2 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
              collapsed && "justify-center p-2"
            )}>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                  <span className="text-sm font-bold text-primary">
                    {user.initials}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-profit rounded-full border-2 border-card" />
              </div>
              {!collapsed && (
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <button
            className={cn(
              "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "text-muted-foreground hover:text-loss hover:bg-loss/10",
              collapsed && "justify-center px-0"
            )}
            onClick={onLogout}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
