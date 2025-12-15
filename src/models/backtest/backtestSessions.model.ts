// models/backtest/backtestSessions.model.ts
import { connectAccountsDB } from '@/lib/db/connect';
import mongoose, { Schema, Document } from 'mongoose';

export interface IBacktestSession extends Document {
  uniqueId: string;
  sessionId: number;
  sessionInfo: {
    name: string;
    symbol: string;
    currentBalance: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    totalPnl: number;
    winRate: number;
    riskReward: number;
    monthGainLoss: number;
    weekGainLoss: number;
    dailyGainLoss: number;
  };
  filters: {
    type: string[];
    assets: string[];
    side: string[];
    tags: string[];
    session: string[];
    strategy: string[];
    day: string[];
    time: string[];
    timezone: string[];
    backtestingDate: string[];
  };
  appliedFilters: Array<{
    type: string;
    value: string;
  }>;
  trades: Array<{
    id: number;
    type: string;
    entry: number;
    exit: number;
    lotSize: number;
    pnl: number;
    reason: string;
    timestamp: number;
  }>;
  activeTab: string;
  rowsPerPage: number;
  currentPage: number;
  createdAt: Date;
  updatedAt: Date;
}

const BacktestSessionSchema = new Schema<IBacktestSession>(
  {
    uniqueId: { type: String, required: true, index: true },
    sessionId: { type: Number, required: true, index: true },
    sessionInfo: {
      name: { type: String, required: true },
      symbol: { type: String, required: true },
      currentBalance: { type: String, required: true },
      startDate: { type: String, required: true },
      endDate: { type: String, required: true },
      daysRemaining: { type: Number, required: true },
      totalPnl: { type: Number, required: true },
      winRate: { type: Number, required: true },
      riskReward: { type: Number, required: true },
      monthGainLoss: { type: Number, required: true },
      weekGainLoss: { type: Number, required: true },
      dailyGainLoss: { type: Number, required: true }
    },
    // UNCOMMENTED AND REFINED THESE SECTIONS
    filters: {
      type: { type: [String], default: [] },
      assets: { type: [String], default: [] },
      side: { type: [String], default: [] },
      tags: { type: [String], default: [] },
      session: { type: [String], default: [] },
      strategy: { type: [String], default: [] },
      day: { type: [String], default: [] },
      time: { type: [String], default: [] },
      timezone: { type: [String], default: [] },
      backtestingDate: { type: [String], default: [] }
    },
    appliedFilters: [{
      type: { type: String },
      value: { type: String }
    }],
    trades: [{
      id: { type: Number },
      type: { type: String },
      entry: { type: Number },
      exit: { type: Number },
      lotSize: { type: Number },
      pnl: { type: Number },
      reason: { type: String },
      timestamp: { type: Number }
    }],
    activeTab: { type: String, default: 'Dashboard' },
    rowsPerPage: { type: Number, default: 10 },
    currentPage: { type: Number, default: 1 }
  },
  { timestamps: true }
);

BacktestSessionSchema.index({ uniqueId: 1, sessionId: 1 }, { unique: true });

export const getBacktestSessionsModel = async () => {
  try {
    const backtestConnection = await connectAccountsDB();
    if (backtestConnection.models.BacktestSession) {
      return backtestConnection.models.BacktestSession;
    }
    return backtestConnection.model<IBacktestSession>('BacktestSession', BacktestSessionSchema);
  } catch (error) {
    console.error("❌ Error getting backtest sessions model:", error);
    throw error;
  }
};