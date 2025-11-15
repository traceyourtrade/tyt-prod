import { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
  name: string;
  img: string;
  url:string;
}

interface ProfileData {
  fullName: string;
  email: string;
}

interface SidebarProps {
  sideExpand: boolean;
  expandFun: () => void;
  menuItems: MenuItem[];
  currentUrl: string;
  setCurrentUrl: (url: string) => void;
  getInitials: () => string;
  profileData: ProfileData;
  maskEmail: (email: string) => string;
  logoutFun: () => void;
  setAddTrades: () => void;
  updatePath: (url:string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sideExpand,
  expandFun,
  menuItems,
  currentUrl,
  setCurrentUrl,
  getInitials,
  profileData,
  maskEmail,
  logoutFun,
  setAddTrades,updatePath
}) => {
  return (
    <div className="w-20 h-[85vh] flex flex-row items-center justify-center top-30">
      {/* Sidebar Toggle Button */}
      {/* <div 
        onClick={expandFun} 
        className={`w-5 h-5 fixed text-white z-10 top-24 ml-12 rounded-full bg-[#ffffff47] flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out ${sideExpand ? "ml-80 rotate-180" : ""}`}
      >
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
      </div> */}

      {/* Sidebar */}
      <div 
        className={`fixed top-16 left-5 z-10 flex flex-col items-center justify-between text-white overflow-hidden pt-2 shadow-lg transition-all duration-500 ease-in-out ${
          sideExpand ? "w-48 h-[calc(100vh-100px)]" : "w-11 h-[calc(100vh-100px)]"
        } rounded-3xl`}
        style={{
          background: '#171717',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.347)',
          borderRight: '1px solid rgba(255, 255, 255, 0.2)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          backgroundImage: 'linear-gradient(179deg, rgba(144, 84, 249, 0.25) 0%, rgba(162, 97, 193, 0) 31%, rgba(212, 132, 40, 0) 75%, rgba(224, 140, 4, 0.18) 100%)'
        }}
      >
        {/* Top Section */}
        <div className="w-4/5 mx-auto flex flex-col items-center justify-center">
          <Image 
            className="w-6 mx-auto my-2" 
            src="/images/Logo Dark.png"
            alt="logo" 
            width={120} 
            height={40}
          />
          <div 
            className="flex items-center w-[90%] py-1 rounded-xl text-white font-['Inter'] font-[450] mt-1 transition-all duration-500 ease-in-out cursor-pointer hover:scale-105 hover:bg-[rgba(238, 16, 16, 1)]"
            style={{ background: "rgba(122, 122, 122, 0.31)", borderRadius: "12px", marginBottom: "20px" }}
            onClick={() => { 
              setAddTrades();
              document.body.classList.add("no-scroll"); 
            }}
          >
            <span className="text-[15px] text-white px-1">+</span>
            <span className="whitespace-nowrap transition-opacity duration-500 ease-in-out ml-4 text-xs font-['Inter'] font-[550]">ADD TRADES</span>
          </div>
          
          {/* Menu Items */}
          {menuItems.map((ele) => (
            <div 
              onClick={() => updatePath(ele.url)} 
              className={`flex items-center w-full py-1 rounded-lg text-white font-['Inter'] font-[450] mt-1 transition-all duration-100 ease-in-out cursor-pointer ${
                currentUrl === ele.name ? "bg-[rgba(122,122,122,0.31)]" : ""
              } ${
                sideExpand ? "hover:bg-[#d8d8d845] hover:scale-110 hover:w-[95%] hover:pl-1" : ""
              }`}
              key={ele.name}
            >
              <span className="ml-2">
                <Image 
                  className="w-[17px] h-auto relative -bottom-1 invert" 
                  src={ele.img} 
                  alt={ele.name} 
                  width={20} 
                  height={20}
                />
              </span>
              <span className="whitespace-nowrap transition-opacity duration-500 ease-in-out ml-4 text-xs font-['Inter']">
                {ele.name}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="w-4/5 mx-auto flex flex-col items-center justify-center">
          {/* Support & Settings */}
          <div 
            onClick={() => setCurrentUrl("Support")} 
            className={`flex items-center w-full py-1 rounded-lg text-white font-['Inter'] font-[450] mt-1 transition-all duration-100 ease-in-out cursor-pointer ${
              currentUrl === "Support" ? "bg-[#d8d8d845]" : ""
            } ${
              sideExpand ? "hover:bg-[#d8d8d845] hover:scale-110 hover:w-[95%] hover:pl-1" : ""
            }`}
          >
            <span className="ml-2">
              <Image 
                className="w-[17px] h-auto relative -bottom-1 invert" 
                src="/images/sidebar/help.png" 
                alt="Help" 
                width={20} 
                height={20}
              />
            </span>
            <span className="whitespace-nowrap transition-opacity duration-500 ease-in-out ml-4 text-xs font-['Inter']">
              Support
            </span>
          </div>
          
          <div 
            onClick={() => setCurrentUrl("Settings")} 
            className={`flex items-center w-full py-1 rounded-lg text-white font-['Inter'] font-[450] mt-1 transition-all duration-100 ease-in-out cursor-pointer ${
              currentUrl === "Settings" ? "bg-[#d8d8d845]" : ""
            } ${
              sideExpand ? "hover:bg-[#d8d8d845] hover:scale-110 hover:w-[95%] hover:pl-1" : ""
            }`}
          >
            <span className="ml-2">
              <Image 
                className="w-[17px] h-auto relative -bottom-1 invert" 
                src="/images/attributes/Settings.png"
                alt="Settings" 
                width={20} 
                height={20}
              />
            </span>
            <span className="whitespace-nowrap transition-opacity duration-500 ease-in-out ml-4 text-xs font-['Inter']">
              Settings
            </span>
          </div>

          {/* Divider */}
          <div className="w-full h-[2px] border-t border-dashed border-white mt-3"></div>

          {/* Profile Section */}
          <div 
            onClick={() => setCurrentUrl("Profile")} 
            className="flex items-center w-full py-1 rounded-xl text-[#222] font-['Inter'] font-[450] mt-3 mb-3 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full absolute overflow-hidden ml-1 border-2 border-[#555] flex items-center justify-center bg-cover bg-center bg-no-repeat">
              <p className="text-white text-xs font-['Inter'] tracking-wider">
                {getInitials()}
              </p>
            </div>
            <span className="ml-10 leading-3 text-white">
              <p className="text-xs font-[550]">{profileData.fullName || ""}</p>
              <div className="text-[10px]">
                {profileData.email ? maskEmail(profileData.email) : ""}
              </div>
            </span>
          </div>

          {/* Logout Button */}
          {sideExpand ? (
            <button 
              onClick={logoutFun} 
              className="w-4/5 rounded-3xl font-['Inter'] py-1 border-none text-white mb-7 font-[550] text-xs cursor-pointer"
              style={{ backgroundColor: "rgba(122, 122, 122, 0.214)" }}
            >
              LOGOUT
            </button>
          ) : (
            <button className="w-4/5 rounded-3xl font-['Inter'] py-1 border-none text-[#242424] bg-[#171717] mb-7 font-[550] text-xs opacity-0">
              L
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;