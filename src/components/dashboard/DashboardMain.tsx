"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCircleExclamation, 
  faTriangleExclamation 
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
  const {setAccounts} = useAccountDetails();

  useEffect(()=>{
    setAccounts();
  },[setAccounts]);


  return (
    <>
      <div className="w-99/100 mx-auto h-auto flex items-start mb-5 mt-12.5">

        <div className="dash-reports-dark relative flex gap-2.5">

          {options.map((option) => (
            <button
              key={option}
              className={`font-inter text-sm mr-6.25 relative top-0 left-1.25 cursor-pointer w-22.5 border-none py-0 px-1.25 pb-1.25 rounded bg-black text-[#c2c2c2] text-sm ${
                selected === option ? "text-white" : ""
              }`}
              onClick={() => setSelected(option)}
            >
              {option}
              {selected === option && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-1.25 h-0.5 w-20 bg-[#5a33b6] rounded-lg"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "tween", stiffness: 300 }}
                />
              )}
            </button>
          ))}

        </div>

      </div>
          <HorizontalBar/>

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