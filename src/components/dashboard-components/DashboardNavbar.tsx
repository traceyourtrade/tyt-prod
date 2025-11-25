"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import "./DashboardNav.css";
import useAccountDetails from "@/store/accountdetails";
import notebookStore from "@/store/notebookStore";
import calendarPopUp from "@/store/calendarPopUp";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faIndianRupeeSign, faPercent, faAsterisk, faCaretDown, faFile, faUserGear,faFileInvoice } from '@fortawesome/free-solid-svg-icons';

interface Account {
  _id: string;
  accountName: string;
  checked: boolean;
}

interface DashboardNavProps {
  heading: string;
}

const DashboardNav = ({ heading }: DashboardNavProps) => {
  const params = useParams();
  const userId = params.userId as string;
  
  const [isAccOpen, setAcc] = useState(false);
  const [isCurrOpen, setCrr] = useState(false);
  const [allSelected, setAllSelected] = useState(false);

  // Refs
  const accDropdownRef = useRef<HTMLDivElement>(null);
  const currDropdownRef = useRef<HTMLDivElement>(null);
  const accButtonRef = useRef<HTMLLIElement>(null);
  const currButtonRef = useRef<HTMLLIElement>(null);

  // Store hooks
  const { setAddAcc } = calendarPopUp();
  const { accounts, setAccounts, updateAccView, checkAll } = useAccountDetails();
  const { setNotes } = notebookStore();


  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  const handleAccountChange = (_id: string) => {
    const updatedAccounts = accounts.map(account =>
      account._id === _id ? { ...account, checked: !account.checked } : account
    );

    const allChecked = updatedAccounts.every(account => account.checked);
    setAllSelected(allChecked);
  };

  const handleAllAccountsChange = () => {
    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);
    checkAll( newAllSelected);
  };

  const getAccDetails = async () => {
    setAccounts();
    setNotes();
  };

  useEffect(() => {
    getAccDetails();
    setAllSelected(accounts.every(account => account.checked === true));
  }, []);

  return (
    <div className="w-80% mt-[-20px] h-16 flex items-center justify-end bg-black transition-all duration-300 px-4">
     

      {/* Right Section - Navigation Items */}
      <div className="flex items-center">
        <ul className="flex items-center space-x-4">
          {/* Currency Selector */}
          <li className="relative">
            <button
              className="flex items-center space-x-2 bg-[#000] backdrop-blur-md border border-gray-600 rounded-lg px-3 py-2 text-white cursor-pointer transition-colors hover:bg-gray-700/60"
              onClick={() => { setCrr(!isCurrOpen); setAcc(false); }}
              ref={currButtonRef}
            >
              <FontAwesomeIcon icon={faDollarSign} className="text-white" />
              <FontAwesomeIcon icon={faCaretDown} className="text-white text-xs" />
            </button>

            {/* Currency Dropdown */}
            <div
              ref={currDropdownRef}
              className={`absolute top-12 right-0 w-48 bg-gray-800/90 backdrop-blur-md border border-gray-600 rounded-lg shadow-2xl transition-all duration-300 transform origin-top ${
                isCurrOpen
                  ? "scale-100 opacity-100 visible"
                  : "scale-95 opacity-0 invisible"
              }`}
            >
              <div className="p-2">
                <button className="w-full flex items-center justify-between px-3 py-2 text-white hover:bg-gray-700/60 rounded-md transition-colors">
                  Dollar <FontAwesomeIcon icon={faDollarSign} />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 text-white hover:bg-gray-700/60 rounded-md transition-colors">
                  Rupees <FontAwesomeIcon icon={faIndianRupeeSign} />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 text-white hover:bg-gray-700/60 rounded-md transition-colors">
                  Percentage <FontAwesomeIcon icon={faPercent} />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 text-white hover:bg-gray-700/60 rounded-md transition-colors">
                  R factor <FontAwesomeIcon icon={faAsterisk} />
                </button>
              </div>
            </div>
          </li>

          {/* Accounts Selector */}
          <li className="relative">
            <button
              className="flex items-center space-x-2 bg-[#000] backdrop-blur-md border border-gray-600 rounded-lg px-3 py-2 text-white cursor-pointer transition-colors hover:bg-gray-700/60"
              onClick={() => { setAcc(!isAccOpen); setCrr(false); }}
              ref={accButtonRef}
            >
              <FontAwesomeIcon icon={faFileInvoice} />
              <span>Accounts</span>
              <FontAwesomeIcon icon={faCaretDown} className="text-xs" />
            </button>

            {/* Accounts Dropdown */}
            <div
              ref={accDropdownRef}
              className={`absolute top-12 right-0 w-64 bg-gray-800/90 backdrop-blur-md border border-gray-600 rounded-lg shadow-2xl transition-all duration-300 transform origin-top ${
                isAccOpen
                  ? "scale-100 opacity-100 visible"
                  : "scale-95 opacity-0 invisible"
              }`}
            >
              <div className="p-3">
                {accounts.length === 0 ? (
                  <>
                    <div className="text-center py-4 text-gray-300">
                      No accounts added
                    </div>
                    <button
                      onClick={() => setAddAcc()}
                      className="w-full flex items-center px-3 py-2 text-gray-300 hover:bg-gray-700/60 rounded-md transition-colors mt-2"
                    >
                      <FontAwesomeIcon icon={faUserGear} className="mr-3" />
                      <span>Add Accounts</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* All Accounts Checkbox */}
                    <div className="flex items-center px-2 py-2 border-b border-gray-600 mb-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleAllAccountsChange}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="ml-3 text-white text-sm font-medium">All Accounts</span>
                    </div>

                    {/* Account List */}
                    <div className="max-h-48 overflow-y-auto">
                      {accounts.map((account) => (
                        <label
                          key={account._id}
                          className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-700/60 rounded-md transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={account.checked}
                            onChange={() => {
                              handleAccountChange(account._id);
                              updateAccView(account.accountName);
                            }}
                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                          />
                          <span className="ml-3 text-white text-sm">{account.accountName}</span>
                        </label>
                      ))}
                    </div>

                    {/* Manage Accounts */}
                    <button
                      onClick={() => setAddAcc()}
                      className="w-full flex items-center px-2 py-3 text-gray-300 hover:bg-gray-700/60 rounded-md transition-colors mt-2 border-t border-gray-600"
                    >
                      <FontAwesomeIcon icon={faUserGear} className="mr-3 ml-2" />
                      <span>Manage Accounts</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>

          
        </ul>
      </div>
    </div>
  );
};

export default DashboardNav;