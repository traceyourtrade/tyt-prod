"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faShield, 
  faCrown, 
  faWallet, 
  faPercent, 
  faGear, 
  faClockRotateLeft, 
  faListCheck, 
  faCircleQuestion,
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";

import Profile from "@/components/settings/Profile";
import Subscription from "@/components/settings/Subscription";
import Security from "@/components/settings/Security";
import Account from "@/components/settings/Account";
import CommissionNfees from "@/components/settings/CommisionNFees";
import GlobalSettings from "@/components/settings/GlobalSettings";
import useAccountDetails from "@/store/accountdetails";

type SettingOption = {
  name: string;
  icon: any;
  description?: string;
};

const Settings = () => {
  const [settingCntxt, setSettingCntxt] = useState<string>("Profile");
  const { setAccounts } = useAccountDetails();

  useEffect(() => {
    setAccounts()
  }, [setAccounts])

  const userSetting: SettingOption[] = [
    { name: "Profile", icon: faUser, description: "Manage your profile" }, 
    { name: "Security", icon: faShield, description: "Password & authentication" }, 
    { name: "Subscription", icon: faCrown, description: "Plan & billing" }
  ];

  const generalSetting: SettingOption[] = [
    { name: "Accounts", icon: faWallet, description: "Trading accounts" },
    { name: "Commissions & Fees", icon: faPercent, description: "Fee settings" },
    { name: "Global Settings", icon: faGear, description: "App preferences" },
    { name: "Import History", icon: faClockRotateLeft, description: "Import logs" },
    { name: "Trade Log", icon: faListCheck, description: "Activity history" },
    { name: "FAQ", icon: faCircleQuestion, description: "Help & support" },
  ];

  const NavItem = ({ item, isActive, onClick }: { item: SettingOption; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
        isActive 
          ? "bg-emerald-500/15 border border-emerald-500/30" 
          : "hover:bg-[#1e1e1e] border border-transparent"
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
        isActive ? "bg-emerald-500/20" : "bg-[#1e1e1e] group-hover:bg-[#252525]"
      }`}>
        <FontAwesomeIcon 
          icon={item.icon} 
          className={`text-sm ${isActive ? "text-emerald-400" : "text-gray-400 group-hover:text-gray-300"}`} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`block text-sm font-medium truncate ${isActive ? "text-emerald-400" : "text-gray-300"}`}>
          {item.name}
        </span>
        {item.description && (
          <span className="block text-xs text-gray-500 truncate">{item.description}</span>
        )}
      </div>
      <FontAwesomeIcon 
        icon={faChevronRight} 
        className={`text-[10px] transition-colors ${isActive ? "text-emerald-400" : "text-gray-600"}`} 
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex gap-6">
          <div className="w-72 flex-shrink-0">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 sticky top-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 px-3 py-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">User Settings</span>
                </div>
                <div className="space-y-1">
                  {userSetting.map((item, index) => (
                    <NavItem 
                      key={index} 
                      item={item} 
                      isActive={settingCntxt === item.name}
                      onClick={() => setSettingCntxt(item.name)}
                    />
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#2a2a2a] my-4" />

              <div>
                <div className="flex items-center gap-2 px-3 py-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">General Settings</span>
                </div>
                <div className="space-y-1">
                  {generalSetting.map((item, index) => (
                    <NavItem 
                      key={index} 
                      item={item} 
                      isActive={settingCntxt === item.name}
                      onClick={() => setSettingCntxt(item.name)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden min-h-[calc(100vh-180px)]">
            {settingCntxt === "Profile" && <Profile />}
            {settingCntxt === "Subscription" && <Subscription />}
            {settingCntxt === "Security" && <Security />}
            {settingCntxt === "Accounts" && <Account />}
            {settingCntxt === "Commissions & Fees" && <CommissionNfees />}
            {settingCntxt === "Global Settings" && <GlobalSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
