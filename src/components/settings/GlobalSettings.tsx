"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faWallet, faCheck, faChevronDown, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

const GlobalSettings = () => {
  const [timezone, setTimezone] = useState("(GMT+05:30) Asia/Calcutta");
  const [currency, setCurrency] = useState("USD ($)");
  const [tzOpen, setTzOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifications, setNotifications] = useState({ email: true, push: false });

  const timezones = ["(GMT+05:30) Asia/Calcutta", "(GMT-04:00) America/New_York", "(GMT+00:00) Europe/London", "(GMT+08:00) Asia/Singapore"];
  const currencies = ["USD ($)", "INR (₹)", "EUR (€)", "GBP (£)"];

  const handleSave = () => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Global Settings</h2>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={faCheck} className="text-xs" />
          Save
        </button>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] divide-y divide-gray-100 dark:divide-[#262626]">
        <Dropdown
          icon={faClock}
          label="Timezone"
          value={timezone}
          options={timezones}
          isOpen={tzOpen}
          onToggle={() => { setTzOpen(!tzOpen); setCurrOpen(false); }}
          onSelect={(v) => { setTimezone(v); setTzOpen(false); }}
        />
        <Dropdown
          icon={faWallet}
          label="Currency"
          value={currency}
          options={currencies}
          isOpen={currOpen}
          onToggle={() => { setCurrOpen(!currOpen); setTzOpen(false); }}
          onSelect={(v) => { setCurrency(v); setCurrOpen(false); }}
        />
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Theme</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === "light" 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" 
                : "bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
            }`}
          >
            <FontAwesomeIcon icon={faSun} className="text-xs" />
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark" 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" 
                : "bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
            }`}
          >
            <FontAwesomeIcon icon={faMoon} className="text-xs" />
            Dark
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] divide-y divide-gray-100 dark:divide-[#262626]">
        <Toggle 
          label="Email notifications" 
          enabled={notifications.email} 
          onToggle={() => setNotifications({ ...notifications, email: !notifications.email })} 
        />
        <Toggle 
          label="Push notifications" 
          enabled={notifications.push} 
          onToggle={() => setNotifications({ ...notifications, push: !notifications.push })} 
        />
      </div>
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
      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg text-sm text-gray-900 dark:text-white"
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

const Toggle = ({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <button
      onClick={onToggle}
      className={`w-10 h-6 rounded-full transition-colors relative ${
        enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-[#262626]"
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
        enabled ? "right-1" : "left-1"
      }`} />
    </button>
  </div>
);

export default GlobalSettings;
