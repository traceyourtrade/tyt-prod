"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faWallet, faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";

const GlobalSettings = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("(GMT+05:30) Asia/Calcutta");

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setIsOpenCurr(false);
  };

  const handleSelect = (timezone: string) => {
    setSelectedTimezone(timezone);
    setIsOpen(false);
  };

  const [isOpenCurr, setIsOpenCurr] = useState<boolean>(false);
  const [selectedTimezoneCurr, setSelectedTimezoneCurr] = useState<string>("DOLLAR");

  const toggleDropdownCurr = () => {
    setIsOpenCurr(!isOpenCurr);
    setIsOpen(false);
  };

  const handleSelectCurr = (timezone: string) => {
    setSelectedTimezoneCurr(timezone);
    setIsOpenCurr(false);
  };

  return (
    <div className="flex flex-row items-center justify-between w-[98%] h-[80vh]">
      <div className="w-1/2 h-[80vh]">
        <h2 className="ml-[5%] mt-[20px] text-white">GLOBAL SETTINGS</h2>
        <p className="text-[12px] font-[550] ml-[5%] text-[#bebebe]">Set your Display Settings</p>

        <div className="w-[90%] bg-[rgba(122,122,122,0.214)] p-[15px] rounded-[20px] ml-[5%] mt-[50px]">
          <div className="flex items-center gap-[10px] cursor-pointer" onClick={toggleDropdown}>
            <div>
              <FontAwesomeIcon icon={faClock} className="text-[#7d55c7] text-[18px] ml-[10px]" />
              <span className="font-bold text-[16px] ml-[10px]">TIMEZONE</span>
              <p className="text-[10px] text-[#bebebe] ml-[40px]">Select the Timezone, you want your data to be displayed in</p>
            </div>
          </div>
          <div className="flex justify-between items-center bg-[#b6b6b657] p-[12px] rounded-[8px] cursor-pointer mt-[10px]" onClick={toggleDropdown}>
            {selectedTimezone}
            <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} />
          </div>
          {isOpen && (
            <div className="bg-[rgba(0,0,0,0.366)] backdrop-blur-[8px] rounded-[8px] mt-[5px] overflow-hidden">
              {["(GMT+05:30) Asia/Calcutta", "(GMT-04:00) America/New_York", "(GMT+00:00) Europe/London"].map((tz, index) => (
                <div key={index} className="p-[10px] cursor-pointer transition-colors duration-300 hover:bg-[#b6b6b671]" onClick={() => handleSelect(tz)}>
                  {tz}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-[90%] bg-[rgba(122,122,122,0.214)] p-[15px] rounded-[20px] ml-[5%] mt-[50px]">
          <div className="flex items-center gap-[10px] cursor-pointer" onClick={toggleDropdownCurr}>
            <div>
              <FontAwesomeIcon icon={faWallet} className="text-[#7d55c7] text-[18px] ml-[10px]" />
              <span className="font-bold text-[16px] ml-[10px]">CURRENCY</span>
              <p className="text-[10px] text-[#bebebe] ml-[40px]">Select the currency, you want your data to be displayed in</p>
            </div>
          </div>
          <div className="flex justify-between items-center bg-[#b6b6b657] p-[12px] rounded-[8px] cursor-pointer mt-[10px]" onClick={toggleDropdownCurr}>
            {selectedTimezoneCurr}
            <FontAwesomeIcon icon={isOpenCurr ? faChevronUp : faChevronDown} />
          </div>
          {isOpenCurr && (
            <div className="bg-[rgba(0,0,0,0.366)] backdrop-blur-[8px] rounded-[8px] mt-[5px] overflow-hidden">
              {["DOLLAR", "RUPEES"].map((tz, index) => (
                <div key={index} className="p-[10px] cursor-pointer transition-colors duration-300 hover:bg-[#b6b6b671]" onClick={() => handleSelectCurr(tz)}>
                  {tz}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-1/2 h-[80vh]">
        <button className="w-[100px] h-auto text-[16px] px-[10px] py-[5px] font-inter font-[550] border-none rounded-[25px] bg-[rgba(215,170,248,0.622)] relative cursor-pointer top-[60vh] left-[70%]">
          SAVE
        </button>
      </div>
    </div>
  );
};

export default GlobalSettings;