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
  GraduationCap,
  BrainCircuit,
  Trophy,
  CandlestickChart,
  ChevronDown,
  Command,
  Zap,
  Crown,
  Clock,
} from "lucide-react"

interface SubscriptionStatus {
  hasAccess: boolean
  isSubscribed: boolean
  isOnTrial: boolean
  trialDaysLeft: number
  status: 'subscribed' | 'trial' | 'expired' | 'none'
}

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
  paymentUrl?: string
}

const tradingItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Daily Journal", href: "/daily-journal", icon: BookOpen },
  { name: "Notebook", href: "/notebook", icon: FileText },
]

const analysisItems = [
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Strategies", href: "/strategies", icon: Target },
  { name: "Playbook", href: "/playbook", icon: Sparkles },
  { name: "AI Analysis", href: "/ai-analysis", icon: BrainCircuit, badge: "New" },
]

const toolsItems = [
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Resources", href: "/resources", icon: GraduationCap },
  { name: "Lot Calculator", href: "/lot-calculator", icon: Calculator },
]

const backtestingItems = [
  { name: "Dashboard", href: "/backtesting/dashboard", icon: CandlestickChart },
  { name: "Sessions", href: "/backtesting/sessions", icon: BarChart3 },
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
  user,
  paymentUrl = "https://projournx.com/pricing"
}: SidebarProps) {
  const pathname = usePathname()
  const [backtestingOpen, setBacktestingOpen] = React.useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<SubscriptionStatus | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = React.useState(true)
  const sidebarRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation()
    }

    sidebar.addEventListener('wheel', handleWheel, { passive: true })
    
    return () => {
      sidebar.removeEventListener('wheel', handleWheel)
    }
  }, [])

  React.useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      console.log('[Sidebar] Fetching subscription status...')
      try {
        const response = await fetch('/api/subscription/status')
        console.log('[Sidebar] Subscription status response:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('[Sidebar] Subscription data:', data)
          setSubscriptionStatus(data)
        } else {
          console.log('[Sidebar] Subscription API error:', response.status)
        }
      } catch (error) {
        console.error('[Sidebar] Failed to fetch subscription status:', error)
      } finally {
        console.log('[Sidebar] Setting isLoadingSubscription to false')
        setIsLoadingSubscription(false)
      }
    }

    fetchSubscriptionStatus()
  }, [])

  React.useEffect(() => {
    if (pathname.startsWith('/backtesting')) {
      setBacktestingOpen(true)
    } else {
      setBacktestingOpen(false)
    }
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const NavItem = ({ item, collapsed: isCollapsed }: { item: { name: string; href: string; icon: React.ElementType; badge?: string }; collapsed: boolean }) => {
    const Icon = item.icon
    const active = isActive(item.href)
    
    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4EBF94]/50",
          active 
            ? "bg-gradient-to-r from-[#4EBF94]/20 via-[#4EBF94]/10 to-transparent text-white" 
            : "text-white/50 hover:text-white hover:bg-white/[0.06]",
          isCollapsed && "justify-center px-2"
        )}
      >
        {active && (
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#4EBF94]"
            layoutId="activeIndicator"
            style={{
              boxShadow: "0 0 12px 2px rgba(78,191,148,0.6), 0 0 24px 4px rgba(78,191,148,0.3)"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        
        <div className={cn(
          "relative flex-shrink-0 transition-all duration-200",
          active && "text-[#4EBF94]"
        )}>
          <Icon className={cn(
            "h-[18px] w-[18px] transition-all duration-200",
            !active && "group-hover:scale-110 group-hover:text-white"
          )} />
        </div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              className="flex-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>

        {item.badge && !isCollapsed && (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/20">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  const SectionLabel = ({ label }: { label: string }) => (
    <AnimatePresence>
      {!collapsed && (
        <motion.div 
          className="px-3 mb-2 mt-4 first:mt-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.2em]">
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <aside 
      ref={sidebarRef}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-out overscroll-contain",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Floating container with glassmorphism */}
      <div className={cn(
        "absolute inset-2 rounded-2xl overflow-hidden",
        "bg-[#0a0e14]/90 backdrop-blur-2xl",
        "border border-white/[0.08]",
        "shadow-2xl shadow-black/40"
      )}>
        {/* Layered gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#4EBF94]/[0.03] via-transparent to-violet-500/[0.02] pointer-events-none" />
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} />
        
        {/* Inner glow on edges */}
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none" />
      </div>
      
      {/* Content container */}
      <div className="relative flex flex-col h-full m-2">
        {/* Logo Section with animated orbs */}
        <div className={cn(
          "relative flex items-center h-16 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {/* Animated gradient orbs */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#4EBF94]/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute -top-2 left-8 w-16 h-16 bg-violet-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
          
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group relative z-10">
            <motion.div 
              className="relative flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-black/30 bg-gradient-to-br from-white/10 to-transparent">
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
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4EBF94]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                  <span className="text-[10px] text-white/30 font-medium tracking-wide">
                    Trading Journal
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          
          {!collapsed && (
            <motion.button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
              onClick={onToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {collapsed && (
          <motion.button
            className="mx-auto mt-1 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
            onClick={onToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        )}

        {/* Add Trade Button */}
        <div className={cn("px-3 mt-4", collapsed && "mt-2")}>
          <motion.button
            className={cn(
              "group relative w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[13px] transition-all duration-300 overflow-hidden",
              "bg-gradient-to-r from-[#4EBF94] via-[#45B08A] to-[#3AA07A]",
              "text-white",
              "hover:shadow-[0_8px_32px_rgba(78,191,148,0.35)]",
              collapsed ? "px-0" : "px-4"
            )}
            onClick={() => onAddTrades?.()}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            
            <motion.div
              className="relative z-10"
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </motion.div>
            
            <AnimatePresence>
              {!collapsed && (
                <motion.span 
                  className="relative z-10"
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

        {/* Quick search hint */}
        {!collapsed && (
          <motion.div 
            className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center gap-2 cursor-pointer hover:bg-white/[0.05] transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Command className="h-3.5 w-3.5 text-white/30" />
            <span className="text-[11px] text-white/30 flex-1">Quick search...</span>
            <span className="text-[10px] text-white/20 px-1.5 py-0.5 rounded bg-white/[0.05] font-mono">K</span>
          </motion.div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide overscroll-contain">
          {/* Scroll fade top */}
          <div className="sticky top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#0a0e14]/90 to-transparent pointer-events-none -mb-4 z-10" />
          
          {/* Trading Section */}
          <SectionLabel label="Trading" />
          <div className="space-y-0.5 mb-2">
            {tradingItems.map((item) => (
              <NavItem key={item.name} item={item} collapsed={collapsed} />
            ))}
          </div>

          {/* Analysis Section */}
          <SectionLabel label="Analysis" />
          <div className="space-y-0.5 mb-2">
            {analysisItems.map((item) => (
              <NavItem key={item.name} item={item} collapsed={collapsed} />
            ))}
          </div>

          {/* Tools Section */}
          <SectionLabel label="Tools" />
          <div className="space-y-0.5 mb-2">
            {toolsItems.map((item) => (
              <NavItem key={item.name} item={item} collapsed={collapsed} />
            ))}
          </div>

          {/* Backtesting Section - Collapsible */}
          <div className="mb-2">
            <button
              onClick={() => setBacktestingOpen(!backtestingOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                "text-white/50 hover:text-white hover:bg-white/[0.06]",
                pathname.startsWith('/backtesting') && "text-white bg-white/[0.04]",
                collapsed && "justify-center px-2"
              )}
            >
              <CandlestickChart className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Backtesting</span>
                  <motion.div
                    animate={{ rotate: backtestingOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  </motion.div>
                </>
              )}
            </button>
            
            <AnimatePresence>
              {backtestingOpen && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-4 mt-1 space-y-0.5 border-l border-white/[0.06] ml-5">
                    {backtestingItems.map((item) => (
                      <NavItem key={item.name} item={item} collapsed={false} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scroll fade bottom */}
          <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0a0e14]/90 to-transparent pointer-events-none -mt-4" />
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto">
          <div className="px-4 mb-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          
          <div className="py-2 px-2 space-y-0.5">
            {bottomNavItems.map((item) => (
              <NavItem key={item.name} item={item} collapsed={collapsed} />
            ))}
          </div>

          {/* Go Pro / Subscription Status */}
          <div className="px-2 pb-2 overflow-hidden">
              {subscriptionStatus?.isSubscribed ? (
                <motion.div 
                  className={cn(
                    "relative rounded-xl overflow-hidden",
                    collapsed ? "p-2" : "px-3 py-2.5"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-900/30 via-amber-800/20 to-amber-900/30 rounded-xl" />
                  <div className="absolute inset-0 border border-amber-500/20 rounded-xl" />
                  <div className={cn(
                    "relative flex items-center gap-2.5",
                    collapsed && "justify-center"
                  )}>
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                      <Crown className="h-3 w-3 text-amber-950" />
                    </div>
                    {!collapsed && (
                      <span className="text-[11px] font-semibold text-amber-400">
                        Pro Member
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : subscriptionStatus?.isOnTrial ? (
                <motion.a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "relative block rounded-xl overflow-hidden cursor-pointer group",
                    collapsed && "p-1"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent group-hover:from-amber-500/30 group-hover:via-orange-500/20 transition-all duration-200" />
                  <div className="absolute inset-0 border border-amber-500/30 rounded-xl" />
                  <div className={cn(
                    "relative flex items-center gap-2 p-2.5",
                    collapsed && "justify-center"
                  )}>
                    <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-amber-400">Trial: {subscriptionStatus.trialDaysLeft} days left</p>
                        <p className="text-[9px] text-white/40">Upgrade to Pro</p>
                      </div>
                    )}
                  </div>
                </motion.a>
              ) : (
                <motion.a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "relative block rounded-xl cursor-pointer group isolate",
                    collapsed && "p-1"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
                  <div className={cn(
                    "relative flex items-center gap-3 p-3",
                    collapsed && "justify-center p-2"
                  )}>
                    <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 ring-1 ring-white/30">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">Go Pro</p>
                          <span className="px-1.5 py-0.5 rounded bg-white/25 text-[9px] font-bold text-white">
                            SAVE 20%
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mt-0.5">Unlock all features</p>
                      </div>
                    )}
                  </div>
                </motion.a>
              )}
          </div>

          {/* User Card */}
          <div className="p-2 pt-0">
            {user && (
              <motion.div 
                className={cn(
                  "relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer",
                  collapsed && "p-1"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Card background with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
                <div className="absolute inset-0 border border-white/[0.06] rounded-xl" />
                
                <div className={cn(
                  "relative flex items-center gap-3 p-3",
                  collapsed && "justify-center p-2"
                )}>
                  {/* Avatar with activity ring */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4EBF94] to-emerald-600 animate-pulse opacity-30 blur-sm" />
                    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#4EBF94]/40 to-[#4EBF94]/10 flex items-center justify-center ring-2 ring-[#4EBF94]/30">
                      <span className="text-sm font-bold text-[#4EBF94]">
                        {user.initials}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4EBF94] rounded-full border-2 border-[#0a0e14]">
                      <Zap className="w-1.5 h-1.5 text-[#0a0e14] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div 
                        className="overflow-hidden flex-1 min-w-0"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <p className="text-[13px] font-semibold text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-white/30 truncate">
                          {user.email}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
            
            {/* Logout button */}
            <motion.button
              className={cn(
                "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 mt-1 text-[13px] font-medium transition-all duration-200",
                "text-white/30 hover:text-red-400 hover:bg-red-500/10",
                collapsed && "justify-center px-2"
              )}
              onClick={onLogout}
              whileHover={{ x: collapsed ? 0 : 3 }}
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
      </div>
    </aside>
  )
}
