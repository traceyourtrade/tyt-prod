import mongoose, { Schema, Document, Model } from "mongoose";
import { connectAccountsDB } from "@/lib/db/connect";

export interface IAutoSyncTradeData {
  [key: string]: any;
}

export interface IAutoSync extends Document {
  uniqueId: string;
  email: string;
  accountName: string;
  accountId: string;
  tradeId: string;
  tradeData: IAutoSyncTradeData[];
  createdAt: Date;
  updatedAt: Date;
}

const autoSyncSchema = new Schema<IAutoSync>({
  uniqueId: { type: String, required: true },
  email: { type: String, required: true },
  accountName: { type: String, required: true },
  accountId: { type: String, required: true },
  tradeId: { type: String, required: true },
  tradeData: { type: [Schema.Types.Mixed] }
}, {
  timestamps: true
});

// Indexes
autoSyncSchema.index({ tradeId: 1 }, { unique: true });
autoSyncSchema.index({ uniqueId: 1 });
autoSyncSchema.index({ accountId: 1 });

export const getAutoSyncModel = async (): Promise<Model<IAutoSync>> => {
  const conn = await connectAccountsDB();
  return conn.models.AUTOSYNC || conn.model<IAutoSync>("AUTOSYNC", autoSyncSchema);
};