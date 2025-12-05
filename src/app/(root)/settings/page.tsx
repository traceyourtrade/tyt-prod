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
  faChevronRight,
  faChevronLeft,
  faBars
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleNavClick = (name: string) => {
    setSettingCntxt(name);
    setSidebarOpen(false);
  };

  const NavItem = ({ item, isActive, onClick }: { item: SettingOption; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 lg:px-4 lg:py-3 rounded-xl text-left transition-all duration-200 group ${
        isActive 
          ? "bg-emerald-500/15 border border-emerald-500/30" 
          : "hover:bg-[#1e1e1e] border border-transparent"
      }`}
    >
      <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
        isActive ? "bg-emerald-500/20" : "bg-[#1e1e1e] group-hover:bg-[#252525]"
      }`}>
        <FontAwesomeIcon 
          icon={item.icon} 
          className={`text-xs lg:text-sm ${isActive ? "text-emerald-400" : "text-gray-400 group-hover:text-gray-300"}`} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`block text-sm font-medium truncate ${isActive ? "text-emerald-400" : "text-gray-300"}`}>
          {item.name}
        </span>
        <span className="hidden sm:block text-xs text-gray-500 truncate">{item.description}</span>
      </div>
      <FontAwesomeIcon 
        icon={faChevronRight} 
        className={`text-[10px] transition-colors flex-shrink-0 ${isActive ? "text-emerald-400" : "text-gray-600"}`} 
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 lg:mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-500 text-xs lg:text-sm mt-1">Manage your account and preferences</p>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={sidebarOpen ? faChevronLeft : faBars} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          <div className={`
            fixed lg:relative inset-y-0 left-0 z-50
            w-72 lg:w-72 flex-shrink-0
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="h-full lg:h-auto bg-[#141414] border-r lg:border border-[#2a2a2a] lg:rounded-2xl p-4 overflow-y-auto lg:sticky lg:top-6">
              <div className="flex items-center justify-between lg:hidden mb-4 pb-4 border-b border-[#2a2a2a]">
                <span className="text-sm font-semibold text-white">Settings Menu</span>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
              </div>

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
                      onClick={() => handleNavClick(item.name)}
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
                      onClick={() => handleNavClick(item.name)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden min-h-[calc(100vh-180px)] lg:min-h-[calc(100vh-180px)]">
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
