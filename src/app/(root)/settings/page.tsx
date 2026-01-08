"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Shield, Crown, Wallet, Settings as SettingsIcon, AlertTriangle, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

import Profile from "@/components/settings/Profile";
import Subscription from "@/components/settings/Subscription";
import Security from "@/components/settings/Security";
import Account from "@/components/settings/Account";
import GlobalSettings from "@/components/settings/GlobalSettings";
import DangerZone from "@/components/settings/DangerZone";
import useAccountDetails from "@/store/accountdetails";

type NavItem = { 
  name: string; 
  icon: React.ElementType; 
  id: string;
  description: string;
  color?: string;
};

const navItems: NavItem[] = [
  { name: "Profile", icon: User, id: "profile", description: "Personal information & avatar" },
  { name: "Security", icon: Shield, id: "security", description: "Password & authentication" },
  { name: "Subscription", icon: Crown, id: "subscription", description: "Plan & billing" },
  { name: "Accounts", icon: Wallet, id: "accounts", description: "Trading accounts" },
  { name: "Preferences", icon: SettingsIcon, id: "global", description: "Theme & notifications" },
  { name: "Danger Zone", icon: AlertTriangle, id: "danger", description: "Delete account", color: "red" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const Settings = () => {
  const [active, setActive] = useState("profile");
  const { setAccounts } = useAccountDetails();

  useEffect(() => { setAccounts(); }, [setAccounts]);

  const activeItem = navItems.find(item => item.id === active);

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-6 mb-6",
          "bg-gradient-to-br from-primary/5 via-card to-card",
          "dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800",
          "border-border dark:border-white/[0.08]"
        )}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 dark:bg-blue-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>
      </motion.div>

      {/* Mobile Navigation - Horizontal Pills */}
      <div className="lg:hidden mb-6 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const isDanger = item.color === "red";
            
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                  isActive 
                    ? isDanger
                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <motion.nav 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-64 flex-shrink-0"
        >
          <div className={cn(
            "sticky top-24 rounded-2xl border overflow-hidden",
            "bg-card dark:bg-zinc-900/50",
            "border-border dark:border-white/[0.08]"
          )}>
            <div className="p-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                const isDanger = item.color === "red";
                
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setActive(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all relative group",
                      isActive 
                        ? isDanger
                          ? "bg-red-500/10 text-red-500"
                          : "bg-primary/10 text-primary"
                        : isDanger
                          ? "text-muted-foreground hover:bg-red-500/5 hover:text-red-500"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full",
                          isDanger ? "bg-red-500" : "bg-primary"
                        )}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                      isActive
                        ? isDanger
                          ? "bg-red-500/20"
                          : "bg-primary/20"
                        : "bg-muted group-hover:bg-muted"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive ? (isDanger ? "text-red-500" : "text-primary") : "text-foreground"
                      )}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      isActive && "translate-x-0.5"
                    )} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.nav>

        {/* Content Area */}
        <motion.div 
          className="flex-1 min-w-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {active === "profile" && <Profile />}
              {active === "subscription" && <Subscription />}
              {active === "security" && <Security />}
              {active === "accounts" && <Account />}
              {active === "global" && <GlobalSettings />}
              {active === "danger" && <DangerZone />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
