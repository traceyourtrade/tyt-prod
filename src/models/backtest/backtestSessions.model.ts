import { connectAccountsDB } from '@/lib/db/connect';
import mongoose, { Schema, Document } from 'mongoose';

export interface IBacktestTrade {
  id: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  exitPrice?: number;
  sl?: number;
  tp?: number;
  openedAt: number;
  closedAt?: number;
  pnl?: number;
  rr?: number;
  notes?: string;
  tags?: string[];
  status: 'open' | 'closed';
}

export interface IBacktestSession extends Document {
  uniqueId: string;
  sessionId: number;
  name: string;
  symbol: string;
  fromDate: string;
  toDate: string;
  initialBalance: number;
  currentBalance: number;
  progressPointer: number;
  status: 'active' | 'completed';
  description?: string;
  riskPerTrade?: number;
  trades: IBacktestTrade[];
  timeInvested: number;
  createdAt: Date;
  updatedAt: Date;
}

const BacktestTradeSchema = new Schema({
  id: { type: String, required: true },
  side: { type: String, enum: ['long', 'short'], required: true },
  size: { type: Number, required: true },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number },
  sl: { type: Number },
  tp: { type: Number },
  openedAt: { type: Number, required: true },
  closedAt: { type: Number },
  pnl: { type: Number },
  rr: { type: Number },
  notes: { type: String },
  tags: [{ type: String }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, { _id: false });

const BacktestSessionSchema = new Schema<IBacktestSession>(
  {
    uniqueId: { type: String, required: true, index: true },
    sessionId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    initialBalance: { type: Number, required: true, default: 10000 },
    currentBalance: { type: Number, required: true, default: 10000 },
    progressPointer: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    description: { type: String, default: '' },
    riskPerTrade: { type: Number },
    trades: [BacktestTradeSchema],
    timeInvested: { type: Number, default: 0 }
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
    console.error("Error getting backtest sessions model:", error);
    throw error;
  }
};
