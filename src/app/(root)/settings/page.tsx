"use client";
import { useEffect, useState } from "react";

// Settings components
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
  const {setAccounts} = useAccountDetails();
useEffect(()=>{
    setAccounts()
},[])
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
    <div className="flex flex-row items-center justify-between w-full h-auto min-h-[85vh] font-inter mt-[30px]">
      {/* Setting sidebar */}
      <div className="w-[250px] h-[80vh] bg-[rgba(114,113,113,0.268)] rounded-[25px]">
        <div className="flex flex-col items-center justify-start w-full h-auto">
          <button className="font-inter w-[70%] max-w-[150px] mx-auto my-[20px] text-[12px] px-[10px] py-[6px] rounded-[25px] text-white bg-[#111] border-none outline-none cursor-pointer font-[550]">
            <i className="fa-solid fa-user relative left-[-5px] top-[2px] text-[10px] overflow-hidden"></i> User Settings
          </button>

          <div className="w-[80%] h-[18vh] overflow-auto overflow-x-hidden">
            {userSetting.map((ele, index) => {
              const isActive = settingCntxt === ele.name;
              return (
                <p 
                  key={index} 
                  onClick={() => setSettingCntxt(ele.name)}
                  className={`font-[550] text-[#bebebe] mx-auto my-[5px] px-[10px] py-[5px] rounded-[25px] text-[13px] cursor-pointer hover:bg-[rgba(122,122,122,0.214)] hover:text-white hover:scale-102 ${
                    isActive ? "bg-[rgba(122,122,122,0.214)] text-white" : ""
                  }`}
                >
                  <i className="fa-solid fa-chevron-right mx-[10px]"></i> {ele.name}
                </p>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center justify-start w-full h-auto">
          <button className="font-inter w-[70%] max-w-[150px] mx-auto my-[20px] text-[12px] px-[10px] py-[6px] rounded-[25px] text-white bg-[#111] border-none outline-none cursor-pointer font-[550]">
            <i className="fa-solid fa-user relative left-[-5px] top-[2px] text-[10px] overflow-hidden"></i> General Settings
          </button>

          <div className="w-[80%] h-[40vh] overflow-auto overflow-x-hidden">
            {generalSetting.map((ele, index) => {
              const isActive = settingCntxt === ele.name;
              return (
                <p 
                  key={index} 
                  onClick={() => setSettingCntxt(ele.name)}
                  className={`font-[550] text-[#bebebe] mx-auto my-[5px] px-[10px] py-[5px] rounded-[25px] text-[13px] cursor-pointer hover:bg-[rgba(122,122,122,0.214)] hover:text-white hover:scale-102 ${
                    isActive ? "bg-[rgba(122,122,122,0.214)] text-white" : ""
                  }`}
                >
                  <i className="fa-solid fa-chevron-right mx-[10px]"></i> {ele.name}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-[calc(100%-280px)] h-[80vh] bg-[rgba(114,113,113,0.268)] rounded-[25px] flex items-center justify-center text-white">
        {settingCntxt === "Profile" && <Profile />}
        {settingCntxt === "Subscription" && <Subscription />}
        {settingCntxt === "Security" && <Security />}
        {settingCntxt === "Accounts" && <Account />}
        {settingCntxt === "Commissions & Fees" && <CommissionNfees />}
        {settingCntxt === "Global Settings" && <GlobalSettings />}
      </div>
    </div>
  );
};

export default Settings;