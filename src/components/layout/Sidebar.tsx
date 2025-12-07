"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  Calculator,
  Sparkles,
  ChevronRight,
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
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "from-blue-500/20 to-blue-600/10" },
  { name: "Daily Journal", href: "/daily-journal", icon: BookOpen, color: "from-purple-500/20 to-purple-600/10" },
  { name: "Notebook", href: "/notebook", icon: FileText, color: "from-amber-500/20 to-amber-600/10" },
  { name: "Reports", href: "/reports", icon: BarChart3, color: "from-cyan-500/20 to-cyan-600/10" },
  { name: "Strategies", href: "/strategies", icon: Target, color: "from-rose-500/20 to-rose-600/10" },
  { name: "Playbook", href: "/playbook", icon: Sparkles, color: "from-emerald-500/20 to-emerald-600/10" },
  { name: "Lot Calculator", href: "/lot-calculator", icon: Calculator, color: "from-indigo-500/20 to-indigo-600/10" },
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
        "fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-out",
        "bg-gradient-to-b from-[#0C1117] via-[#0F1419] to-[#0C1117]",
        "dark:from-[#0C1117] dark:via-[#0F1419] dark:to-[#0C1117]",
        "border-r border-white/[0.06]",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Subtle inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Logo Section */}
      <div className={cn(
        "relative flex items-center h-16 px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <motion.div 
            className="relative flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-black/20">
              <Image 
                src="/images/logo-dark.png" 
                alt="ProJournX" 
                width={40} 
                height={40}
                className="w-full h-full object-contain dark:block hidden"
              />
              <Image 
                src="/images/logo-light.png" 
                alt="ProJournX" 
                width={40} 
                height={40}
                className="w-full h-full object-contain dark:hidden block"
              />
            </div>
            {/* Logo glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4EBF94]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
          
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className="font-bold text-white tracking-tight text-[15px]">
                  ProJournX
                </span>
                <span className="text-[10px] text-white/40 font-medium tracking-wide">
                  Trading Journal
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        
        {!collapsed && (
          <motion.button
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      {/* Collapse button when collapsed */}
      {collapsed && (
        <motion.button
          className="mx-auto mt-2 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      )}

      {/* Add Trade Button - Premium Gradient */}
      <div className={cn("px-3 mt-4", collapsed && "mt-2")}>
        <motion.button
          className={cn(
            "group relative w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden",
            "bg-gradient-to-r from-[#4EBF94] to-[#3AAE83]",
            "text-white shadow-lg shadow-[#4EBF94]/25",
            "hover:shadow-xl hover:shadow-[#4EBF94]/35",
            collapsed ? "px-0" : "px-4"
          )}
          onClick={() => {
            onAddTrades?.()
            document.body.classList.add("no-scroll")
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          {/* Icon with rotation on hover */}
          <motion.div
            className="relative z-10"
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="h-4.5 w-4.5" />
          </motion.div>
          
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                className="relative z-10 tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Add Trade
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Divider */}
      <div className="px-4 mt-5 mb-2">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 scrollbar-hide">
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              className="mb-3 px-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em]">
                Menu
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <ul className="space-y-1">
          {mainNavItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <motion.li 
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active 
                      ? "bg-gradient-to-r from-[#4EBF94]/15 to-transparent text-[#4EBF94]" 
                      : "text-white/60 hover:text-white hover:bg-white/5",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {/* Active indicator - left glow bar */}
                  {active && (
                    <motion.div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#4EBF94] shadow-[0_0_12px_2px_rgba(78,191,148,0.5)]"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Icon container with gradient background on active */}
                  <div className={cn(
                    "relative flex-shrink-0 p-1.5 rounded-lg transition-all duration-200",
                    active && `bg-gradient-to-br ${item.color}`
                  )}>
                    <Icon className={cn(
                      "h-[18px] w-[18px] transition-transform duration-200",
                      active ? "text-[#4EBF94]" : "group-hover:scale-110"
                    )} />
                  </div>
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {/* Hover glow effect */}
                  {!active && (
                    <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.03] transition-colors duration-200" />
                  )}
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto">
        {/* Divider */}
        <div className="px-4 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        
        {/* Bottom Navigation */}
        <div className="py-2 px-3">
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                className="mb-3 px-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em]">
                  General
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
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
                        ? "bg-gradient-to-r from-[#4EBF94]/15 to-transparent text-[#4EBF94]" 
                        : "text-white/60 hover:text-white hover:bg-white/5",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {active && (
                      <motion.div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#4EBF94] shadow-[0_0_12px_2px_rgba(78,191,148,0.5)]"
                        layoutId="activeIndicatorBottom"
                      />
                    )}
                    <Icon className={cn(
                      "h-[18px] w-[18px] flex-shrink-0 transition-transform",
                      active ? "text-[#4EBF94]" : "group-hover:scale-110"
                    )} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* User Section - Premium Card */}
        <div className="p-3 border-t border-white/[0.06]">
          {user && (
            <motion.div 
              className={cn(
                "flex items-center gap-3 rounded-xl p-2.5 mb-2 transition-all duration-200 cursor-pointer",
                "bg-gradient-to-r from-white/[0.04] to-transparent",
                "hover:from-white/[0.08] hover:to-white/[0.02]",
                "border border-white/[0.04] hover:border-white/[0.08]",
                collapsed && "justify-center p-2"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Avatar with glow ring */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4EBF94]/30 to-[#4EBF94]/10 flex items-center justify-center ring-2 ring-[#4EBF94]/20 shadow-lg shadow-[#4EBF94]/10">
                  <span className="text-sm font-bold text-[#4EBF94]">
                    {user.initials}
                  </span>
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4EBF94] rounded-full border-2 border-[#0C1117] shadow-[0_0_8px_rgba(78,191,148,0.6)]" />
              </div>
              
              <AnimatePresence>
                {!collapsed && (
                  <motion.div 
                    className="overflow-hidden flex-1 min-w-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <p className="text-sm font-semibold text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {user.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          
          {/* Logout button */}
          <motion.button
            className={cn(
              "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "text-white/40 hover:text-red-400 hover:bg-red-500/10",
              collapsed && "justify-center px-0"
            )}
            onClick={onLogout}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Log out
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </aside>
  )
}
