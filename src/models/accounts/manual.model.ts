import mongoose, { Schema, Document, Model } from "mongoose";
import { connectAccountsDB } from "@/lib/db/connect";

export interface IManualTradeData {
  [key: string]: any; // Mixed type for trade data
}

export interface IManual extends Document {
  uniqueId: string;
  email: string;
  accountName: string;
  accountId: string;
  tradeId: string;
  tradeData: IManualTradeData[];
  createdAt: Date;
  updatedAt: Date;
}

const manualSchema = new Schema<IManual>({
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
manualSchema.index({ tradeId: 1 }, { unique: true });
manualSchema.index({ uniqueId: 1 });
manualSchema.index({ accountId: 1 });

export const getManualModel = async (): Promise<Model<IManual>> => {
  const conn = await connectAccountsDB();
  return conn.models.MANUAL || conn.model<IManual>("MANUAL", manualSchema);
};