"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faTriangleExclamation,
  faDollarSign,
  faCaretDown
} from "@fortawesome/free-solid-svg-icons";
import notifications from "@/store/notifications";
import DashboardCustom from "@/components/dashboard-components/dasboard-range/DashboardCustom";
import DashboardDay from "@/components/dashboard-components/dasboard-range/DashboardDay";
import DashboardMonth from "@/components/dashboard-components/dasboard-range/DashboardMonth";
import DashboardWeek from "@/components/dashboard-components/dasboard-range/DashboardWeek";
import useAccountDetails from "@/store/accountdetails";
import HorizontalBar from "../dashboard-components/popups/HorizontalBar";


const DashboardMain = () => {

  const options = ["Monthly", "Weekly", "Daily", "Custom"];
  const [selected, setSelected] = useState("Monthly");
  const { setAccounts } = useAccountDetails();

  const [isCurrOpen, setCrr] = useState(false);

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);


  return (
    <>
      <div className="w-99/100 mx-auto h-auto flex items-start mt-2 justify-between">

        <div>
          <h1 className="text-white text-xl font-inter text-[24px] font-bold ml-2">
            Dashboard
          </h1>
          <p className="font-inter text-[14px] ml-2 text-[#a6a6a6] mt-1 mb-2" >Overview of your trading performance</p>
        </div>

        <div>
          <button
            className="flex items-center space-x-2 bg-[#252525] backdrop-blur-md border border-gray-600 rounded-lg px-3 py-2 text-white cursor-pointer transition-colors hover:bg-[#252525]/40 "
            onClick={() => { setCrr(!isCurrOpen) }}
          // ref={currButtonRef}
          >
            {selected}
            <FontAwesomeIcon icon={faCaretDown} className="text-white text-xs" />
          </button>

          {/* Currency Dropdown */}
          <div
            // ref={currDropdownRef}
            className={`absolute right-10 mt-5 w-48 bg-[#252525] backdrop-blur-md border border-gray-600 rounded-lg shadow-2xl transition-all duration-300 transform origin-top ${isCurrOpen
              ? "scale-100 opacity-100 visible"
              : "scale-95 opacity-0 invisible"
              }`}
          >
            <div className="p-2">
              {options.map((ele, index) => (
                <p
                  key={index}
                  className="w-full p-2 bg-[#252525] hover:bg-[#393939] cursor-pointer transition-colors rounded-xl"
                  onClick={() => setSelected(ele)}
                >
                  {ele}
                </p>
              ))}
            </div>
          </div>
        </div>

      </div>
      <HorizontalBar />

      {selected === "Daily" ? <DashboardDay /> :
        selected === "Weekly" ? <DashboardWeek /> :
          selected === "Monthly" ? <DashboardMonth /> :
            selected === "Custom" ? <DashboardCustom /> : ""}
    </>
  );
};

export default DashboardMain;




// export default HorizontalBar;

// Additional components from your CSS
const ProfileImageButtons = () => (
  <div className="text-xl absolute z-2 top-10vh right-16/100 w-12.5 flex items-center justify-between">
    <FontAwesomeIcon icon={faCircleExclamation} className="text-white cursor-pointer" />
    <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-white cursor-pointer" />
  </div>
);

const ProfileDarkMain = ({ show, children }: { show: boolean; children: React.ReactNode }) => (
  <div className={`w-screen h-screen fixed top-0 left-0 bg-[rgba(0,0,0,0.427)] z-1000 flex-col items-center justify-center ${show ? "flex" : "hidden"}`}>
    {children}
  </div>
);


// Add the keyframes animation to your global CSS or use a style tag
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes loadPlain {
      from { width: 0px; }
      to { width: 350px; }
    }
    .animate-loadPlain {
      animation: loadPlain 5s linear forwards;
    }
    .no-scroll {
      overflow: hidden;
      height: 100vh;
    }
  `}</style>
);

export { ProfileImageButtons, ProfileDarkMain, GlobalStyles };