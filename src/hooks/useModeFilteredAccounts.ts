"use client";

import { useMemo } from "react";
import useAccountDetails from "@/store/accountdetails";
import usePropFirmStore from "@/store/propFirmStore";

interface Account {
  checked?: boolean;
  accountName?: string;
  accountId?: string;
  accountBalance?: number;
  accountType?: string;
  broker?: string;
  description?: string;
  isPropFirm?: boolean;
  tradeData?: any[];
  [key: string]: any;
}

export function useModeFilteredAccounts() {
  const { accounts, selectedAccounts } = useAccountDetails();
  const { isEnabled: isPropFirmMode } = usePropFirmStore();

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc: Account) => {
      const isAccountPropFirm = acc.isPropFirm === true;
      return isPropFirmMode ? isAccountPropFirm : !isAccountPropFirm;
    });
  }, [accounts, isPropFirmMode]);

  const filteredSelectedAccounts = useMemo(() => {
    return selectedAccounts.filter((acc: Account) => {
      const isAccountPropFirm = acc.isPropFirm === true;
      return isPropFirmMode ? isAccountPropFirm : !isAccountPropFirm;
    });
  }, [selectedAccounts, isPropFirmMode]);

  return {
    accounts: filteredAccounts,
    selectedAccounts: filteredSelectedAccounts,
    isPropFirmMode,
  };
}

export default useModeFilteredAccounts;
