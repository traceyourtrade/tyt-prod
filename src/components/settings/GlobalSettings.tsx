"use client";
import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faWallet, faCheck, faChevronDown, faMoon, faSun, faBell, faEnvelope } from "@fortawesome/free-solid-svg-icons";

const STORAGE_KEY = "projournx_settings";

interface Settings {
  timezone: string;
  currency: string;
  theme: "dark" | "light";
  notifications: { email: boolean; push: boolean };
}

const defaultSettings: Settings = {
  timezone: "(GMT+05:30) Asia/Calcutta",
  currency: "INR (₹)",
  theme: "dark",
  notifications: { email: true, push: false }
};

const getStoredSettings = (): Settings => {
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
  const [settings, setSettings] = useState<Settings>(defaultSettings);
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

  const saveSettings = useCallback((newSettings: Settings) => {
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
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
        <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] h-40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
            Saved
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] divide-y divide-gray-100 dark:divide-[#262626]">
        <Dropdown
          icon={faClock}
          label="Timezone"
          value={settings.timezone}
          options={timezones}
          isOpen={tzOpen}
          onToggle={() => { setTzOpen(!tzOpen); setCurrOpen(false); }}
          onSelect={handleTimezoneChange}
        />
        <Dropdown
          icon={faWallet}
          label="Display Currency"
          value={settings.currency}
          options={currencies}
          isOpen={currOpen}
          onToggle={() => { setCurrOpen(!currOpen); setTzOpen(false); }}
          onSelect={handleCurrencyChange}
        />
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Appearance</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleThemeChange("light")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              settings.theme === "light" 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-sm" 
                : "bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]"
            }`}
          >
            <FontAwesomeIcon icon={faSun} className="text-xs" />
            Light
          </button>
          <button
            onClick={() => handleThemeChange("dark")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              settings.theme === "dark" 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-sm" 
                : "bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]"
            }`}
          >
            <FontAwesomeIcon icon={faMoon} className="text-xs" />
            Dark
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] divide-y divide-gray-100 dark:divide-[#262626]">
        <Toggle 
          icon={faEnvelope}
          label="Email Notifications" 
          description="Receive updates and alerts via email"
          enabled={settings.notifications.email} 
          onToggle={() => handleNotificationToggle('email')} 
        />
        <Toggle 
          icon={faBell}
          label="Push Notifications" 
          description="Get real-time browser notifications"
          enabled={settings.notifications.push} 
          onToggle={() => handleNotificationToggle('push')} 
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        Settings are saved automatically and persist across sessions
      </p>
    </div>
  );
};

const Dropdown = ({ icon, label, value, options, isOpen, onToggle, onSelect }: {
  icon: any;
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
}) => (
  <div className="relative p-4">
    <div className="flex items-center gap-3 mb-2">
      <FontAwesomeIcon icon={icon} className="text-gray-400 text-sm" />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors"
    >
      <span className="truncate">{value}</span>
      <FontAwesomeIcon icon={faChevronDown} className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && (
      <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              value === opt 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )}
  </div>
);

const Toggle = ({ icon, label, description, enabled, onToggle }: { 
  icon: any;
  label: string; 
  description: string;
  enabled: boolean; 
  onToggle: () => void;
}) => (
  <div className="flex items-center justify-between px-4 py-3.5">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center">
        <FontAwesomeIcon icon={icon} className="text-gray-400 text-sm" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`w-10 h-6 rounded-full transition-colors relative ${
        enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-[#262626]"
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
        enabled ? "right-1" : "left-1"
      }`} />
    </button>
  </div>
);

export default GlobalSettings;
