"use client";
import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sun, Moon, Clock, DollarSign, Bell, Mail, Check, ChevronDown, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "projournx_settings";

interface SettingsData {
  timezone: string;
  currency: string;
  theme: "dark" | "light";
  notifications: { email: boolean; push: boolean };
}

const defaultSettings: SettingsData = {
  timezone: "(GMT+05:30) Asia/Calcutta",
  currency: "INR (₹)",
  theme: "dark",
  notifications: { email: true, push: false }
};

const getStoredSettings = (): SettingsData => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {}
  return defaultSettings;
};

const GlobalSettings = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [tzOpen, setTzOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  const timezones = [
    "(GMT+05:30) Asia/Calcutta",
    "(GMT-04:00) America/New_York",
    "(GMT-07:00) America/Los_Angeles",
    "(GMT+00:00) Europe/London",
    "(GMT+01:00) Europe/Paris",
    "(GMT+08:00) Asia/Singapore",
    "(GMT+09:00) Asia/Tokyo",
    "(GMT+11:00) Australia/Sydney"
  ];
  const currencies = ["USD ($)", "INR (₹)", "EUR (€)", "GBP (£)", "JPY (¥)", "AUD ($)", "SGD ($)"];

  useLayoutEffect(() => {
    setMounted(true);
    const storedSettings = getStoredSettings();
    setSettings(storedSettings);
    if (storedSettings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const saveSettings = useCallback((newSettings: SettingsData) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const handleThemeChange = useCallback((theme: "dark" | "light") => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    saveSettings({ ...settings, theme });
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
  }, [settings, saveSettings]);

  const handleTimezoneChange = useCallback((tz: string) => {
    setTzOpen(false);
    saveSettings({ ...settings, timezone: tz });
  }, [settings, saveSettings]);

  const handleCurrencyChange = useCallback((curr: string) => {
    setCurrOpen(false);
    saveSettings({ ...settings, currency: curr });
  }, [settings, saveSettings]);

  const handleNotificationToggle = useCallback((key: 'email' | 'push') => {
    const newNotifications = { ...settings.notifications, [key]: !settings.notifications[key] };
    saveSettings({ ...settings, notifications: newNotifications });
  }, [settings, saveSettings]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="w-24 h-5 bg-muted rounded animate-pulse" />
            <div className="w-48 h-4 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/5"
          )}>
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Preferences</h2>
            <p className="text-sm text-muted-foreground">Customize your experience</p>
          </div>
        </div>
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "rounded-2xl border overflow-hidden",
          "bg-card dark:bg-zinc-900/50",
          "border-border dark:border-white/[0.08]"
        )}
      >
        <div className="p-6">
          <h3 className="font-medium text-foreground mb-4">Appearance</h3>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleThemeChange("light")}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all text-center",
                settings.theme === "light"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30 bg-muted/30"
              )}
            >
              <div className={cn(
                "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3",
                settings.theme === "light" ? "bg-primary/20" : "bg-muted"
              )}>
                <Sun className={cn(
                  "w-6 h-6",
                  settings.theme === "light" ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <p className={cn(
                "font-medium",
                settings.theme === "light" ? "text-primary" : "text-foreground"
              )}>
                Light
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Bright and clean</p>
              {settings.theme === "light" && (
                <motion.div
                  layoutId="themeCheck"
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleThemeChange("dark")}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all text-center",
                settings.theme === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30 bg-muted/30"
              )}
            >
              <div className={cn(
                "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3",
                settings.theme === "dark" ? "bg-primary/20" : "bg-muted"
              )}>
                <Moon className={cn(
                  "w-6 h-6",
                  settings.theme === "dark" ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <p className={cn(
                "font-medium",
                settings.theme === "dark" ? "text-primary" : "text-foreground"
              )}>
                Dark
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Easy on the eyes</p>
              {settings.theme === "dark" && (
                <motion.div
                  layoutId="themeCheck"
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={cn(
          "rounded-2xl border overflow-hidden",
          "bg-card dark:bg-zinc-900/50",
          "border-border dark:border-white/[0.08]"
        )}
      >
        <Dropdown
          icon={Clock}
          label="Timezone"
          description="Set your local timezone"
          value={settings.timezone}
          options={timezones}
          isOpen={tzOpen}
          onToggle={() => { setTzOpen(!tzOpen); setCurrOpen(false); }}
          onSelect={handleTimezoneChange}
        />
        <div className="h-px bg-border" />
        <Dropdown
          icon={DollarSign}
          label="Display Currency"
          description="Choose your preferred currency"
          value={settings.currency}
          options={currencies}
          isOpen={currOpen}
          onToggle={() => { setCurrOpen(!currOpen); setTzOpen(false); }}
          onSelect={handleCurrencyChange}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "rounded-2xl border overflow-hidden",
          "bg-card dark:bg-zinc-900/50",
          "border-border dark:border-white/[0.08]"
        )}
      >
        <div className="p-6">
          <h3 className="font-medium text-foreground mb-4">Notifications</h3>
          <div className="space-y-4">
            <Toggle 
              icon={Mail}
              label="Email Notifications" 
              description="Receive updates and alerts via email"
              enabled={settings.notifications.email} 
              onToggle={() => handleNotificationToggle('email')} 
            />
            <Toggle 
              icon={Bell}
              label="Push Notifications" 
              description="Get real-time browser notifications"
              enabled={settings.notifications.push} 
              onToggle={() => handleNotificationToggle('push')} 
            />
          </div>
        </div>
      </motion.div>

      <p className="text-xs text-muted-foreground text-center">
        Settings are saved automatically
      </p>
    </motion.div>
  );
};

const Dropdown = ({ 
  icon: Icon, 
  label, 
  description,
  value, 
  options, 
  isOpen, 
  onToggle, 
  onSelect 
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
}) => (
  <div className="relative p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <button 
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all",
        "bg-muted/50 border border-border hover:border-muted-foreground/30",
        isOpen && "ring-2 ring-primary/20 border-primary"
      )}
    >
      <span className="text-foreground truncate">{value}</span>
      <ChevronDown className={cn(
        "w-4 h-4 text-muted-foreground transition-transform",
        isOpen && "rotate-180"
      )} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-6 right-6 top-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-20 max-h-56 overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={cn(
                "w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2",
                value === opt 
                  ? "bg-primary/10 text-primary" 
                  : "text-foreground hover:bg-muted"
              )}
            >
              {value === opt && <Check className="w-4 h-4" />}
              <span className={value === opt ? "" : "pl-6"}>{opt}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Toggle = ({ 
  icon: Icon, 
  label, 
  description, 
  enabled, 
  onToggle 
}: { 
  icon: React.ElementType;
  label: string; 
  description: string;
  enabled: boolean; 
  onToggle: () => void;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        "w-12 h-7 rounded-full relative transition-colors",
        enabled ? "bg-primary" : "bg-muted"
      )}
    >
      <motion.div 
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow"
      />
    </motion.button>
  </div>
);

export default GlobalSettings;
