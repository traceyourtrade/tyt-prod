import { connectMainDB } from '@/lib/db/connect';
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

export interface IChartLayout {
  id: string;
  name: string;
  symbol: string;
  resolution: string;
  content: string;
  timestamp: number;
}

export type MarketType = 'FOREX' | 'CRYPTO' | 'INDIAN_INDICES' | 'INDIAN_STOCK';

export interface IBacktestSession extends Document {
  uniqueId: string;
  sessionId: number;
  name: string;
  market: MarketType;
  symbol: string;
  fromDate: string;
  toDate: string;
  initialBalance: number;
  currentBalance: number;
  progressPointer: number;
  replayTimestamp: number;
  status: 'active' | 'completed';
  description?: string;
  riskPerTrade?: number;
  trades: IBacktestTrade[];
  timeInvested: number;
  chartLayouts: IChartLayout[];
  studyTemplates: Record<string, string>;
  drawingTemplates: Record<string, string>;
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

const ChartLayoutSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  symbol: { type: String },
  resolution: { type: String },
  content: { type: String, required: true },
  timestamp: { type: Number, required: true }
}, { _id: false });

const BacktestSessionSchema = new Schema<IBacktestSession>(
  {
    uniqueId: { type: String, required: true, index: true },
    sessionId: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    market: { type: String, enum: ['FOREX', 'CRYPTO', 'INDIAN_INDICES', 'INDIAN_STOCK'], default: 'FOREX' },
    symbol: { type: String, required: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    initialBalance: { type: Number, required: true, default: 10000 },
    currentBalance: { type: Number, required: true, default: 10000 },
    progressPointer: { type: Number, default: 0 },
    replayTimestamp: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    description: { type: String, default: '' },
    riskPerTrade: { type: Number },
    trades: [BacktestTradeSchema],
    timeInvested: { type: Number, default: 0 },
    chartLayouts: { type: [ChartLayoutSchema], default: [] },
    studyTemplates: { type: Map, of: String, default: {} },
    drawingTemplates: { type: Map, of: String, default: {} }
  },
  { timestamps: true }
);

BacktestSessionSchema.index({ uniqueId: 1, sessionId: 1 }, { unique: true });

export const getBacktestSessionsModel = async () => {
  try {
    const mainConnection = await connectMainDB();
    if (mainConnection.models.BacktestSession) {
      return mainConnection.models.BacktestSession;
    }
    return mainConnection.model<IBacktestSession>('BacktestSession', BacktestSessionSchema);
  } catch (error) {
    console.error("Error getting backtest sessions model:", error);
    throw error;
  }
};
