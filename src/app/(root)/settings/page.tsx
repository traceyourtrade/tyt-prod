"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, faShield, faCrown, faWallet, faPercent, faGear,
  faChevronRight, faBars, faXmark
} from "@fortawesome/free-solid-svg-icons";

import Profile from "@/components/settings/Profile";
import Subscription from "@/components/settings/Subscription";
import Security from "@/components/settings/Security";
import Account from "@/components/settings/Account";
import CommissionNfees from "@/components/settings/CommisionNFees";
import GlobalSettings from "@/components/settings/GlobalSettings";
import useAccountDetails from "@/store/accountdetails";

type NavItem = { name: string; icon: any; };

const Settings = () => {
  const [active, setActive] = useState("Profile");
  const [mobileNav, setMobileNav] = useState(false);
  const { setAccounts } = useAccountDetails();

  useEffect(() => { setAccounts(); }, [setAccounts]);

  const navItems: NavItem[] = [
    { name: "Profile", icon: faUser },
    { name: "Security", icon: faShield },
    { name: "Subscription", icon: faCrown },
    { name: "Accounts", icon: faWallet },
    { name: "Commissions & Fees", icon: faPercent },
    { name: "Global Settings", icon: faGear },
  ];

  const handleNav = (name: string) => {
    setActive(name);
    setMobileNav(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileNav(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>

        <div className="flex gap-6">
          <nav className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActive(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active === item.name
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4 text-current opacity-70" />
                  <span className="truncate">{item.name}</span>
                  {active === item.name && (
                    <FontAwesomeIcon icon={faChevronRight} className="ml-auto w-3 opacity-50" />
                  )}
                </button>
              ))}
            </div>
          </nav>

          <main className="flex-1 min-w-0">
            {active === "Profile" && <Profile />}
            {active === "Subscription" && <Subscription />}
            {active === "Security" && <Security />}
            {active === "Accounts" && <Account />}
            {active === "Commissions & Fees" && <CommissionNfees />}
            {active === "Global Settings" && <GlobalSettings />}
          </main>
        </div>
      </div>

      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNav(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#141414] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Settings</span>
              <button onClick={() => setMobileNav(false)} className="p-1 text-gray-500">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNav(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active === item.name
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
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
    </div>
  );
};

export default Settings;
