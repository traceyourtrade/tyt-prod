"use client";
import { useEffect, useState } from "react";
import { User, Settings as SettingsIcon, ChevronRight } from "lucide-react";

import Profile from "@/components/settings/Profile";
import Subscription from "@/components/settings/Subscription";
import Security from "@/components/settings/Security";
import Account from "@/components/settings/Account";
import CommissionNfees from "@/components/settings/CommisionNFees";
import GlobalSettings from "@/components/settings/GlobalSettings";
import useAccountDetails from "@/store/accountdetails";

type SettingOption = {
  name: string;
};

const Settings = () => {
  const [settingCntxt, setSettingCntxt] = useState<string>("Profile");
  const { setAccounts } = useAccountDetails();

  useEffect(() => {
    setAccounts()
  }, [setAccounts])

  const userSetting: SettingOption[] = [
    { name: "Profile" }, 
    { name: "Security" }, 
    { name: "Subscription" }
  ];

  const generalSetting: SettingOption[] = [
    { name: "Accounts" },
    { name: "Commissions & Fees" },
    { name: "Global Settings" },
    { name: "Import History" },
    { name: "Trade Log" },
    { name: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Settings Sidebar */}
        <div className="w-64 flex-shrink-0 bg-card border border-border rounded-xl p-4">
          {/* User Settings */}
          <div className="mb-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg mb-3">
              <User className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">User Settings</span>
            </div>

            <div className="space-y-1">
              {userSetting.map((ele, index) => {
                const isActive = settingCntxt === ele.name;
                return (
                  <button
                    key={index}
                    onClick={() => setSettingCntxt(ele.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-primary/10 text-primary border-l-2 border-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ChevronRight className={`h-3 w-3 ${isActive ? 'text-primary' : ''}`} />
                    {ele.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* General Settings */}
          <div>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg mb-3">
              <SettingsIcon className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">General Settings</span>
            </div>

            <div className="space-y-1">
              {generalSetting.map((ele, index) => {
                const isActive = settingCntxt === ele.name;
                return (
                  <button
                    key={index}
                    onClick={() => setSettingCntxt(ele.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-primary/10 text-primary border-l-2 border-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ChevronRight className={`h-3 w-3 ${isActive ? 'text-primary' : ''}`} />
                    {ele.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
          {settingCntxt === "Profile" && <Profile />}
          {settingCntxt === "Subscription" && <Subscription />}
          {settingCntxt === "Security" && <Security />}
          {settingCntxt === "Accounts" && <Account />}
          {settingCntxt === "Commissions & Fees" && <CommissionNfees />}
          {settingCntxt === "Global Settings" && <GlobalSettings />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
