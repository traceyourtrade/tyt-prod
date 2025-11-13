"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import "./DashboardNav.css";
import useAccountDetails from "@/store/accountdetails";
import notebookStore from "@/store/notebookStore";
import calendarPopUp from "@/store/calendarPopUp";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faIndianRupeeSign, faPercent, faAsterisk, faCaretDown, faFile, faUserGear } from '@fortawesome/free-solid-svg-icons';

// Stores

interface Account {
  _id: string;
  accountName: string;
  checked: boolean;
}

interface DashboardNavProps {
  heading: string;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ heading }) => {
  let { id: userId } = useParams<{ id: string }>();
  if(userId === undefined){
    userId='SJCx5EJ3Zh2J';
  }
  const [isAccOpen, setAcc] = useState(false);
  const [isCurrOpen, setCrr] = useState(false);

  // Hook
  // Create refs for dropdowns and buttons
  const accDropdownRef = useRef<HTMLDivElement>(null);
  const currDropdownRef = useRef<HTMLDivElement>(null);
  const accButtonRef = useRef<HTMLLIElement>(null);
  const currButtonRef = useRef<HTMLLIElement>(null);

  // Custom click outside hook (defined inside the component)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both dropdowns and buttons
      if (
        accDropdownRef.current &&
        !accDropdownRef.current.contains(event.target as Node) &&
        accButtonRef.current &&
        !accButtonRef.current.contains(event.target as Node) &&
        currDropdownRef.current &&
        !currDropdownRef.current.contains(event.target as Node) &&
        currButtonRef.current &&
        !currButtonRef.current.contains(event.target as Node)
      ) {
        setAcc(false);
        setCrr(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { setAddAcc } = calendarPopUp();

  const { accounts, setAccounts, updateAccView, checkAll } = useAccountDetails();
  const accountList: Account[] = accounts as Account[];
  const { setNotes } = notebookStore();

  const [allSelected, setAllSelected] = useState(false);

  const handleAccountChange = (_id: string) => {
    const updatedAccounts = accountList.map(account =>
      account._id === _id ? { ...account, checked: !account.checked } : account
    );

    const allChecked = updatedAccounts.every(account => account.checked);
    setAllSelected(allChecked);
  };

  const handleAllAccountsChange = () => {
    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);
    
    // Check if token exists before calling checkAll
    const tokenn = Cookies.get("Trace Your Trades");
    if (tokenn) {
      checkAll(tokenn, newAllSelected);
    }
  };

  const tokenn = Cookies.get("Trace Your Trades") ||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODliMjE3OTFlZjQ5NWQyZGIyZGJjMmEiLCJpYXQiOjE3NjI5NjAwMzQsImV4cCI6MTc2MzM5MjAzNH0.CdTTCmSX6SW39nnnr_Uo0eyfsQnRURn8Wk-vd_YyOyc";

  const getAccDetails = async () => {
    if (userId && tokenn) {
      await setAccounts(userId, tokenn);
      await setNotes(userId, tokenn);
    }
  };

  useEffect(() => {
    getAccDetails();
    setAllSelected(accountList.every(account => account.checked === true));
  }, []);

  return (
    <>
      <div className="fixed top-0 right-0 z-20 w-full h-[70px] flex flex-row items-center justify-between bg-black transition-all duration-300 ease-in-out transform translate-z-0">
        <div className="flex flex-row items-center">
          <h2 className="text-[30px] font-bold ml-[30px] font-['Inter'] bg-gradient-to-r from-[#9054f9] to-[#e08c04] bg-clip-text text-transparent">
            {heading}
          </h2>
        </div>

        <div className="flex flex-row items-center">
          <ul className="flex flex-row items-center justify-end list-none w-auto min-w-[60%] h-auto">
            <li
              className="w-[70px] h-auto flex items-center justify-between p-[5px_10px] rounded-[10px] mr-[15px] cursor-pointer backdrop-filter backdrop-blur-[25px] border border-[rgba(255,255,255,0.347)] border-r-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
              onClick={() => { setCrr(!isCurrOpen); setAcc(false); }}
              ref={currButtonRef}
            >
                <FontAwesomeIcon icon={faDollarSign} />
              <span>
                <FontAwesomeIcon icon={faCaretDown} className="ml-[5px]" />
              </span>
            </li>

            <div
              className={`w-[250px] h-auto overflow-hidden flex flex-col absolute top-[60px] right-[130px] p-0 rounded-[10px] font-['Inter'] bg-[rgba(196,196,196,0.366)] shadow-[rgba(0,0,0,0.35)_0px_5px_15px] transition-all duration-500 ease-in-out ${isCurrOpen ? "accounts-visible" : "accounts-hidden"}`}
              ref={currDropdownRef}
            >
              <div className="w-[250px] h-auto backdrop-filter backdrop-blur-[25px]">
                <div className="w-[100%] flex items-center justify-between p-[10px] pl-[20px] cursor-pointer rounded-none font-['Inter'] text-white hover:bg-[#dfdfdf80]">
                  <span>Dollar</span>
                  <FontAwesomeIcon icon={faDollarSign} />
                </div>
                <div className="w-[100%] flex items-center justify-between p-[10px] pl-[20px] cursor-pointer rounded-none font-['Inter'] text-white hover:bg-[#dfdfdf80]">
                  <span>Rupees</span>
                  <FontAwesomeIcon icon={faIndianRupeeSign} />
                </div>
                <div className="w-[100%] flex items-center justify-between p-[10px] pl-[20px] cursor-pointer rounded-none font-['Inter'] text-white hover:bg-[#dfdfdf80]">
                  <span>Percentage</span>
                  <FontAwesomeIcon icon={faPercent} />
                </div>
                <div className="w-[100%] flex items-center justify-between p-[10px] pl-[20px] cursor-pointer rounded-none font-['Inter'] text-white hover:bg-[#dfdfdf80]">
                  <span>R factor</span>
                  <FontAwesomeIcon icon={faAsterisk} />
                </div>
              </div>
            </div>

            <li
              className="w-[150px] p-[5.5px_10px] rounded-[10px] flex flex-row items-center justify-between cursor-pointer mr-[15px] backdrop-filter backdrop-blur-[25px] border border-[rgba(255,255,255,0.347)] border-r-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-white"
              onClick={() => { setAcc(!isAccOpen); setCrr(false); }}
              ref={accButtonRef}
            >
                <FontAwesomeIcon icon={faFile} className="mr-[5px]" />
              <span>
                Accounts
              </span>
              <FontAwesomeIcon icon={faCaretDown} className="ml-[15px]" />
            </li>

            <div
              className={`w-[250px] h-auto overflow-hidden flex flex-col absolute top-[60px] right-[70px] p-0 rounded-[10px] font-['Inter'] bg-[rgba(196,196,196,0.366)] shadow-[rgba(0,0,0,0.35)_0px_5px_15px] transition-all duration-500 ease-in-out ${isAccOpen ? "accounts-visible" : "accounts-hidden"}`}
              ref={accDropdownRef}
            >
              <div className="w-[250px] h-auto backdrop-filter backdrop-blur-[25px]">
                {accountList.length === 0 ? (
                  <>
                    <div className="mt-[10px] text-[14px]">
                      <p className="text-center py-[20px]">No accounts added</p>
                    </div>
                    <div onClick={() => { setAddAcc(); }} className="mt-[10px] pt-[8px] border-t border-[#ddd] flex items-center text-white cursor-pointer text-[14px] hover:bg-[#dfdfdf80]">
                      <FontAwesomeIcon icon={faUserGear} className="mr-[8px] ml-[40px]" />
                      <span>Add Accounts</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pt-[8px] pb-[8px] border-b border-[#ddd] flex items-center pl-[10px] text-[14px] mt-[7px] text-white">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleAllAccountsChange}
                        className="mr-[8px] accent-[#9d83dd] cursor-pointer"
                      />
                      <span>All Accounts</span>
                    </div>
                    <div className="mt-[10px] text-[14px]">
                      {accountList.map((ele) => (
                        <label key={ele._id} className="flex items-center py-[6px_0] cursor-pointer w-full pl-[10px] text-white hover:bg-[#dfdfdf80]">
                          <input
                            type="checkbox"
                            checked={ele.checked}
                            onChange={() => { 
                              handleAccountChange(ele._id); 
                              if (tokenn) {
                                updateAccView(ele.accountName, tokenn); 
                              }
                            }}
                          />
                          <span>{ele.accountName}</span>
                        </label>
                      ))}
                    </div>
                    <div onClick={() => { setAddAcc(); }} className="mt-[10px] pt-[8px] border-t border-[#ddd] flex items-center text-white cursor-pointer text-[14px] hover:bg-[#dfdfdf80]">
                      <i className="fa-solid fa-user-gear mr-[8px] ml-[40px]"></i>
                      <span>Manage Accounts</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* <img className="w-[35px] h-[35px] mr-[20px] rounded-[50%]" src={Profile} alt="" /> */}
          </ul>
        </div>
      </div>
    </>
  );
};

export default DashboardNav;