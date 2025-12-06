import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

export interface IPlaybookRule {
  field: string;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "between";
  value: string | number;
  value2?: number;
}

export interface IPlaybookStats {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalProfit: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  lastUpdated: Date;
}

export interface IPlaybookEntry extends Document {
  uniqueId: string;
  name: string;
  description?: string;
  strategy?: string;
  rules: IPlaybookRule[];
  optimalTimeStart?: string;
  optimalTimeEnd?: string;
  optimalDays?: string[];
  preferredSymbols?: string[];
  stats: IPlaybookStats;
  isAutoDetected: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const playbookRuleSchema = new Schema<IPlaybookRule>({
  field: { type: String, required: true },
  operator: { 
    type: String, 
    enum: ["equals", "contains", "greaterThan", "lessThan", "between"],
    required: true 
  },
  value: { type: Schema.Types.Mixed, required: true },
  value2: { type: Number }
});

const playbookStatsSchema = new Schema<IPlaybookStats>({
  totalTrades: { type: Number, default: 0 },
  winCount: { type: Number, default: 0 },
  lossCount: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  avgWin: { type: Number, default: 0 },
  avgLoss: { type: Number, default: 0 },
  profitFactor: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const playbookSchema = new Schema<IPlaybookEntry>({
  uniqueId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  strategy: { type: String },
  rules: [playbookRuleSchema],
  optimalTimeStart: { type: String },
  optimalTimeEnd: { type: String },
  optimalDays: [{ type: String }],
  preferredSymbols: [{ type: String }],
  stats: { type: playbookStatsSchema, default: () => ({}) },
  isAutoDetected: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

playbookSchema.index({ uniqueId: 1, name: 1 }, { unique: true });

export const getPlaybookModel = async (): Promise<Model<IPlaybookEntry>> => {
  const conn = await connectMainDB();
  return conn.models.PLAYBOOKS || conn.model<IPlaybookEntry>("PLAYBOOKS", playbookSchema);
};
