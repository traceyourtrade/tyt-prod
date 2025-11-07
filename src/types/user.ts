// /src/types/user.ts
export interface IUserToken {
  token: string;
  createdAt: Date;
}

export interface IUserNotification {
  notify: string;
  date: string;
}

export interface IUserAccount {
  accountName: string;
  accountBalance?: number;
  accountType: string;
  broker: string;
  description?: string;
  checked?: boolean;
  date?: Date;
  tradeData?: unknown[];
  accountId?: string;
  investorId?: string;
  investorPw?: string;
  serverName?: string;
}

export interface IOtherData {
  rfe: string[];
  btm: string[];
  dtm: string[];
  atm: string[];
  strategy: string[];
}
