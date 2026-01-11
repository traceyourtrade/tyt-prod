import mongoose, { Schema, Document, Model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectMainDB } from "@/lib/db/connect";

export interface IUserToken {
  token: string;
  createdAt: Date;
}

export interface IUserAccount {
  accountName: string;
  accountBalance?: number;
  accountType: string;
  broker: string;
  description?: string;
  checked?: boolean;
  isPropFirm?: boolean;
  date?: Date;
  tradeData?: any[];
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

export interface IUserNotification {
  notify: string;
  date?: string;
}

export interface IUserSubscription {
  isSubscribed: boolean;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'cancelled' | 'halted' | 'pending' | 'expired' | 'inactive';
  subscriptionExpiry?: Date;
  trialEndsAt?: Date;
  trialActivatedAt?: Date;
  trialUsed: boolean;
  hasEverSubscribed?: boolean;
  razorpayCustomerId?: string;
  billingPeriod?: 'monthly' | 'yearly';
  autosyncGrandfathered?: boolean;
}

export interface IPublicProfileSettings {
  isPublic: boolean;
  showEquityCurve: boolean;
  showMonthlyPnL: boolean;
  showWinRate: boolean;
  showProfitFactor: boolean;
  showTotalTrades: boolean;
  showTotalPnL: boolean;
  hideDollarAmounts: boolean;
  customUsername?: string;
}

export interface IUser extends Document {
  uniqueId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: number;
  countryCode: string;
  country: string;
  bio?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  signUpVerificationToken?: string;
  password: string;
  cpassword: string;
  date: Date;
  accountValue: number;
  tokens: IUserToken[];
  accounts: IUserAccount[];
  otherData: IOtherData;
  notifications: IUserNotification[];
  subscription: IUserSubscription;
  referralCode: string;
  referredBy?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  publicProfile: IPublicProfileSettings;

  // Methods
  generateAuthToken(): Promise<string>;
  addNotification(notify: string, date: string): Promise<IUserNotification[]>;
  addAccount(
    accountName: string,
    accountBalance: number,
    accountType: string,
    broker: string,
    description: string,
    accountId: string,
    isPropFirm?: boolean
  ): Promise<IUserAccount[]>;
  addAutoSyncAccount(
    accountName: string,
    accountType: string,
    broker: string,
    description: string,
    investorId: string,
    investorPw: string,
    serverName: string,
    accountId: string,
    isPropFirm?: boolean
  ): Promise<IUserAccount[]>;
  updateAccountBalance(accountId: string, newBalance: number): Promise<IUserAccount | null>;
}

const userSchema = new Schema<IUser>({
  uniqueId: { type: String, required: true },
  fullName: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  countryCode: { type: String, required: true },
  country: { type: String, required: true },
  bio: String,
  profilePicture: String,
  isEmailVerified: { type: Boolean, required: true, default: false },
  signUpVerificationToken: String,
  password: { type: String, required: true },
  cpassword: { type: String, required: true },
  date: { type: Date, default: Date.now },
  accountValue: { type: Number, default: 0 },
  tokens: [
    {
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now, required: true },
    },
  ],
  accounts: [
    {
      accountName: { type: String, required: true },
      accountBalance: { type: Number },
      accountType: { type: String, required: true },
      broker: { type: String, required: true },
      description: { type: String },
      checked: { type: Boolean, default: true },
      isPropFirm: { type: Boolean, default: false },
      date: { type: Date, default: Date.now },
      tradeData: { type: Array, default: [] },
      accountId: { type: String },
      investorId: { type: String },
      investorPw: { type: String },
      serverName: { type: String }
    }
  ],
  otherData: {
    rfe: {
      type: [String],
      default: [
        "Select",
        "Target Hit",
        "SL Hit",
        "Trailed Stop",
        "News Volatility",
        "Exit due to emotional discomfort",
        "Reversal signal on HTF"
      ]
    },
    btm: {
      type: [String],
      default: [
        "Select",
        "Calm",
        "Excited",
        "FOMO",
        "Overconfident",
        "Hesitant"
      ]
    },
    dtm: {
      type: [String],
      default: [
        "Select",
        "Focused",
        "Anxious",
        "Hopeful",
        "Rushed",
        "Revengeful"
      ]
    },
    atm: {
      type: [String],
      default: [
        "Select",
        "Satisfied",
        "Regretful",
        "Angry",
        "Proud",
        "Frustrated"
      ]
    },
    strategy: {
      type: [String],
      default: ["Select"]
    }
  },
  notifications: [
    {
      notify: { type: String, required: true },
      date: { type: String }
    }
  ],
  subscription: {
    isSubscribed: { type: Boolean, default: false },
    subscriptionId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'cancelled', 'halted', 'pending', 'expired', 'inactive'],
      default: 'inactive'
    },
    subscriptionExpiry: { type: Date },
    trialEndsAt: { type: Date },
    trialActivatedAt: { type: Date },
    trialUsed: { type: Boolean, default: false },
    hasEverSubscribed: { type: Boolean, default: false },
    razorpayCustomerId: { type: String },
    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    autosyncGrandfathered: { type: Boolean, default: false }
  },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String, index: true },
  resetPasswordToken: String,
  resetPasswordExpires: Number,
  publicProfile: {
    isPublic: { type: Boolean, default: false },
    showEquityCurve: { type: Boolean, default: true },
    showMonthlyPnL: { type: Boolean, default: true },
    showWinRate: { type: Boolean, default: true },
    showProfitFactor: { type: Boolean, default: true },
    showTotalTrades: { type: Boolean, default: true },
    showTotalPnL: { type: Boolean, default: true },
    hideDollarAmounts: { type: Boolean, default: false },
    customUsername: { type: String, sparse: true }
  }
}, { collection: "users" });

// 🔒 Hash passwords before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


// 🔑 JWT Generator
userSchema.methods.generateAuthToken = async function (): Promise<string> {
  const token = jwt.sign(
    { _id: this._id.toString() },
    process.env.SECRET_KEY as string,
    { expiresIn: "5d" }
  );

  this.tokens.push({ token, createdAt: new Date() });

  // Keep only last 2 tokens
  if (this.tokens.length > 2) {
    this.tokens = this.tokens.slice(-2);
  }

  await this.save();
  return token;
};

// Adding notification
userSchema.methods.addNotification = async function (notify: string, date: string): Promise<IUserNotification[]> {
  try {
    this.notifications = this.notifications.concat({ notify, date });
    await this.save();
    return this.notifications;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Adding FileUpload and manual accounts
userSchema.methods.addAccount = async function (
  accountName: string,
  accountBalance: number,
  accountType: string,
  broker: string,
  description: string,
  accountId: string,
  isPropFirm: boolean = false
): Promise<IUserAccount[]> {
  try {
    this.accounts = this.accounts.concat({
      accountName,
      accountBalance,
      accountType,
      broker,
      description,
      accountId,
      isPropFirm
    });
    await this.save();
    return this.accounts;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Adding autosync account
userSchema.methods.addAutoSyncAccount = async function (
  accountName: string,
  accountType: string,
  broker: string,
  description: string,
  investorId: string,
  investorPw: string,
  serverName: string,
  accountId: string,
  isPropFirm: boolean = false
): Promise<IUserAccount[]> {
  try {
    this.accounts = this.accounts.concat({
      accountName,
      accountBalance: 0,
      accountType,
      broker,
      description,
      accountId,
      investorId,
      investorPw,
      serverName,
      isPropFirm
    });
    await this.save();
    return this.accounts;
  } catch (error) {
    console.error("Error adding account:", error);
    throw error;
  }
};

// Update account balance
userSchema.methods.updateAccountBalance = async function (
  accountId: string,
  newBalance: number
): Promise<IUserAccount | null> {
  try {
    const account = this.accounts.find((acc: IUserAccount) => acc.accountId === accountId);
    if (account) {
      account.accountBalance = newBalance;
      await this.save();
      return account;
    }
    return null;
  } catch (error) {
    console.error("Error updating account balance:", error);
    throw error;
  }
};

// ✅ Export function to get model
export const getUserModel = async (): Promise<Model<IUser>> => {
  const conn = await connectMainDB();
  return conn.models.USERS || conn.model<IUser>("USERS", userSchema);
};