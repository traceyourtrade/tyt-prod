"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronRight, 
  Calendar, 
  Sun, 
  Moon, 
  Bell,
  Search,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopBarProps {
  sidebarCollapsed: boolean
  onThemeToggle?: () => void
  isDarkMode?: boolean
  user?: {
    name: string
    initials: string
  }
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/daily-journal": "Daily Journal",
  "/notebook": "Notebook",
  "/reports": "Reports",
  "/reports/overview": "Reports / Overview",
  "/reports/performance": "Reports / Performance",
  "/reports/calendar": "Reports / Calendar",
  "/reports/compare": "Reports / Compare",
  "/reports/sub-reports": "Reports / Sub Reports",
  "/strategies": "Strategies",
  "/strategies/overview": "Strategies / Overview",
  "/strategies/strategies": "Strategies / All Strategies",
  "/strategies/reports": "Strategies / Reports",
  "/strategies/compare": "Strategies / Compare",
  "/settings": "Settings",
  "/support": "Support",
}

export function TopBar({ 
  sidebarCollapsed, 
  onThemeToggle, 
  isDarkMode = false,
  user 
}: TopBarProps) {
  const pathname = usePathname()
  
  const getPageTitle = () => {
    const exactMatch = pageTitles[pathname]
    if (exactMatch) return exactMatch
    
    const matchingKey = Object.keys(pageTitles).find(key => pathname.startsWith(key))
    return matchingKey ? pageTitles[matchingKey] : "Dashboard"
  }

  const pageTitle = getPageTitle()
  const breadcrumbs = pageTitle.split(" / ")

  return (
    <header 
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 transition-all duration-300",
        sidebarCollapsed ? "ml-[72px]" : "ml-64"
      )}
    >
      {/* Left side - Page title & breadcrumbs */}
      <div className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span 
              className={cn(
                index === breadcrumbs.length - 1 
                  ? "text-page-title text-xl" 
                  : "text-sm text-muted-foreground"
              )}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <Search className="h-5 w-5" />
        </Button>

        {/* Date Range Picker placeholder */}
        <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
          <Calendar className="h-4 w-4" />
          <span>Last 30 days</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={onThemeToggle}>
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User Avatar */}
        {user && (
          <Button variant="ghost" size="icon" className="ml-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {user.initials}
              </span>
            </div>
          </Button>
        )}
      </div>
    </header>
  )
}
