"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faWallet, faChevronDown, faCheck, faPalette, faBell } from "@fortawesome/free-solid-svg-icons";

const GlobalSettings = () => {
  const [selectedTimezone, setSelectedTimezone] = useState<string>("(GMT+05:30) Asia/Calcutta");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD ($)");
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const timezones = [
    "(GMT+05:30) Asia/Calcutta",
    "(GMT-04:00) America/New_York",
    "(GMT+00:00) Europe/London",
    "(GMT+08:00) Asia/Singapore",
    "(GMT+09:00) Asia/Tokyo"
  ];

  const currencies = [
    "USD ($)",
    "INR (₹)",
    "EUR (€)",
    "GBP (£)"
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const SettingCard = ({ 
    icon, 
    iconColor, 
    iconBg, 
    title, 
    description, 
    value, 
    options, 
    isOpen, 
    onToggle, 
    onSelect 
  }: { 
    icon: any;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    value: string;
    options: string[];
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (val: string) => void;
  }) => (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <FontAwesomeIcon icon={icon} className={`text-base sm:text-lg ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-sm sm:text-base">{title}</h3>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">{description}</p>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#252525] border border-[#2a2a2a] rounded-xl hover:bg-[#2a2a2a] transition-colors"
        >
          <span className="text-gray-300 text-sm font-medium truncate pr-2">{value}</span>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`text-gray-500 text-xs transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl z-10 overflow-hidden max-h-48 overflow-y-auto">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => onSelect(option)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                  value === option 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "text-gray-300 hover:bg-[#252525]"
                }`}
              >
                <span className="truncate pr-2">{option}</span>
                {value === option && (
                  <FontAwesomeIcon icon={faCheck} className="text-emerald-400 text-xs flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white">Global Settings</h2>
          <p className="text-gray-500 text-xs lg:text-sm mt-1">Configure your display preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <SettingCard
          icon={faClock}
          iconColor="text-gray-400"
          iconBg="bg-[#252525]"
          title="Timezone"
          description="Select the timezone for displaying your trade data"
          value={selectedTimezone}
          options={timezones}
          isOpen={timezoneOpen}
          onToggle={() => { setTimezoneOpen(!timezoneOpen); setCurrencyOpen(false); }}
          onSelect={(val) => { setSelectedTimezone(val); setTimezoneOpen(false); }}
        />

        <SettingCard
          icon={faWallet}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15"
          title="Currency"
          description="Select the currency for displaying monetary values"
          value={selectedCurrency}
          options={currencies}
          isOpen={currencyOpen}
          onToggle={() => { setCurrencyOpen(!currencyOpen); setTimezoneOpen(false); }}
          onSelect={(val) => { setSelectedCurrency(val); setCurrencyOpen(false); }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 lg:mt-6">
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#252525] flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faPalette} className="text-base sm:text-lg text-gray-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base">Theme</h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">Choose your preferred color theme</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium rounded-xl">
              <div className="w-4 h-4 rounded-full bg-[#141414] border-2 border-emerald-500 flex-shrink-0" />
              <span>Dark</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 bg-[#252525] border border-[#2a2a2a] text-gray-400 text-sm font-medium rounded-xl hover:bg-[#2a2a2a] transition-colors">
              <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400 flex-shrink-0" />
              <span>Light</span>
            </button>
          </div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#252525] flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faBell} className="text-base sm:text-lg text-gray-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base">Notifications</h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">Manage your notification preferences</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-[#252525] border border-[#2a2a2a] rounded-xl">
              <span className="text-gray-300 text-sm">Email notifications</span>
              <button className="w-10 h-6 bg-emerald-500 rounded-full relative flex-shrink-0">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
              </button>
            </div>
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-[#252525] border border-[#2a2a2a] rounded-xl">
              <span className="text-gray-300 text-sm">Push notifications</span>
              <button className="w-10 h-6 bg-[#2a2a2a] rounded-full relative flex-shrink-0">
                <div className="w-4 h-4 bg-gray-500 rounded-full absolute left-1 top-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
