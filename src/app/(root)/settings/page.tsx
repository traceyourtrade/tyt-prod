"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, faShield, faCrown, faWallet, faPercent, faGear,
  faChevronRight, faXmark
} from "@fortawesome/free-solid-svg-icons";

import Profile from "@/components/settings/Profile";
import Subscription from "@/components/settings/Subscription";
import Security from "@/components/settings/Security";
import Account from "@/components/settings/Account";
import CommissionNfees from "@/components/settings/CommisionNFees";
import GlobalSettings from "@/components/settings/GlobalSettings";
import useAccountDetails from "@/store/accountdetails";

type NavItem = { name: string; icon: any; id: string };

const Settings = () => {
  const [active, setActive] = useState("profile");
  const [showNav, setShowNav] = useState(false);
  const { setAccounts } = useAccountDetails();

  useEffect(() => { setAccounts(); }, [setAccounts]);

  const navItems: NavItem[] = [
    { name: "Profile", icon: faUser, id: "profile" },
    { name: "Security", icon: faShield, id: "security" },
    { name: "Subscription", icon: faCrown, id: "subscription" },
    { name: "Accounts", icon: faWallet, id: "accounts" },
    { name: "Commissions & Fees", icon: faPercent, id: "fees" },
    { name: "Global Settings", icon: faGear, id: "global" },
  ];

  const activeItem = navItems.find(item => item.id === active);

  const handleNavClick = (id: string) => {
    setActive(id);
    setShowNav(false);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Mobile: Section selector button (opens overlay) */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowNav(true)}
          className="flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626]"
        >
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={activeItem?.icon || faUser} className="text-primary w-4" />
            <span className="font-medium text-gray-900 dark:text-white">{activeItem?.name || "Profile"}</span>
          </div>
          <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-sm" />
        </button>
      </div>

      {/* Mobile: Navigation overlay */}
      {showNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNav(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#141414] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-[#262626]">
              <span className="font-semibold text-gray-900 dark:text-white">Settings</span>
              <button 
                onClick={() => setShowNav(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
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
            </nav>
          </div>
        </div>
      )}

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
          {active === "fees" && <CommissionNfees />}
          {active === "global" && <GlobalSettings />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
