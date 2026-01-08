"use client";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, faShield, faCrown, faWallet, faGear, faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";

import Profile from "@/components/settings/Profile";
import Subscription from "@/components/settings/Subscription";
import Security from "@/components/settings/Security";
import Account from "@/components/settings/Account";
import GlobalSettings from "@/components/settings/GlobalSettings";
import DangerZone from "@/components/settings/DangerZone";
import useAccountDetails from "@/store/accountdetails";

type NavItem = { name: string; icon: any; id: string };

const Settings = () => {
  const [active, setActive] = useState("profile");
  const { setAccounts } = useAccountDetails();
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setAccounts(); }, [setAccounts]);

  const navItems: NavItem[] = [
    { name: "Profile", icon: faUser, id: "profile" },
    { name: "Security", icon: faShield, id: "security" },
    { name: "Subscription", icon: faCrown, id: "subscription" },
    { name: "Accounts", icon: faWallet, id: "accounts" },
    { name: "Preferences", icon: faGear, id: "global" },
    { name: "Danger Zone", icon: faTriangleExclamation, id: "danger" },
  ];

  const handleTabClick = (id: string, index: number) => {
    setActive(id);
    // Scroll the clicked tab into view
    if (tabsRef.current) {
      const tabs = tabsRef.current.children;
      if (tabs[index]) {
        (tabs[index] as HTMLElement).scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center' 
        });
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Mobile: Horizontal scrollable tabs */}
      <div 
        ref={tabsRef}
        className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 lg:hidden scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {navItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id, index)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              active === item.id
                ? "bg-primary text-white shadow-md"
                : "bg-gray-100 dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#252525]"
            }`}
          >
            <FontAwesomeIcon icon={item.icon} className="w-3.5" />
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      {/* Desktop: Sidebar + Content layout */}
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:block w-48 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 opacity-70" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {active === "profile" && <Profile />}
          {active === "subscription" && <Subscription />}
          {active === "security" && <Security />}
          {active === "accounts" && <Account />}
          {active === "global" && <GlobalSettings />}
          {active === "danger" && <DangerZone />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
