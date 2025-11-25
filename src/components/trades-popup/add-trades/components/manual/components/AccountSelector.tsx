'use client';

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDotCircle,
  faChevronDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

interface Account {
  _id: string;
  accountName: string;
  accountType: string;
  disabled?: boolean;
}

interface AccountSelectorProps {
  selectedAccount: Account | null;
  showAccountDropdown: boolean;
  toggleAccountDropdown: () => void;
  handleAccountSelect: (account: Account) => void;
  accounts: Account[];
}

const getFilteredAccounts = (accounts: Account[]) => {
  const filtered = accounts.filter((acc) => acc.accountType === "Manual");
  return filtered.length
    ? filtered
    : [
        {
          _id: "no-accounts",
          accountName: "No accounts available",
          disabled: true,
        },
      ];
};

const AccountSelector: React.FC<AccountSelectorProps> = ({
  selectedAccount,
  showAccountDropdown,
  toggleAccountDropdown,
  handleAccountSelect,
  accounts,
}) => {
  return (
    <div className="flex items-center gap-[24px] mb-[12px]">
      <label className="w-[90px] text-[12px] font-[500] text-white">Account</label>
      <div className="relative w-full">
        <button 
          className="w-full px-[16px] py-[12px] bg-[#2a2a2a] text-white border-none rounded-[8px] text-[14px] flex justify-between items-center cursor-pointer font-[500]"
          onClick={toggleAccountDropdown}
        >
          <span className="flex items-center">
            <FontAwesomeIcon icon={faDotCircle} className="text-[12px] mr-[8px]" />
            <span>
              {selectedAccount
                ? selectedAccount.accountName
                : "Select Accounts"}
            </span>
          </span>
          <FontAwesomeIcon icon={faChevronDown} className="text-[12px]" />
        </button>

        {showAccountDropdown && (
          <div className="absolute top-full left-0 w-full bg-[#2a2a2a] rounded-[8px] mt-[4px] shadow-lg z-10">
            {getFilteredAccounts(accounts).map((account) => (
              <div
                key={account._id}
                onClick={() => !account.disabled && handleAccountSelect(account)}
                className={`px-[16px] py-[12px] cursor-pointer flex items-center border-b border-[#333333] text-[#cccccc] text-[12px] ${
                  account.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FontAwesomeIcon
                  icon={selectedAccount?._id === account._id ? faCheck : faDotCircle}
                  className={`text-[12px] mr-[8px] ${
                    selectedAccount?._id === account._id ? "text-[#4d6aff]" : "text-[#cccccc]"
                  }`}
                />
                {account.accountName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSelector;