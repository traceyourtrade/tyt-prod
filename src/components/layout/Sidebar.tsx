"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
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
  User,
  LineChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
  { name: "Journal", href: "/daily-journal", icon: BookOpen },
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
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LineChart className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground whitespace-nowrap">
              Projournx
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 flex-shrink-0 text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "absolute right-2"
          )}
          onClick={onToggle}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-300",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Add Trades Button */}
      <div className="px-3 py-4">
        <Button
          className={cn(
            "w-full justify-start gap-2 bg-primary hover:bg-primary/90",
            collapsed && "justify-center px-0"
          )}
          onClick={() => {
            onAddTrades?.()
            document.body.classList.add("no-scroll")
          }}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>Add Trade</span>}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 scrollbar-thin">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="py-2 px-3 border-t border-sidebar-border">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        {user && (
          <div className={cn(
            "flex items-center gap-3 rounded-lg p-2 mb-2",
            collapsed && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary">
                {user.initials}
              </span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}
        
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>
    </aside>
  )
}
