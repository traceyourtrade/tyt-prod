import mongoose, { Schema, Document, Model } from "mongoose";
import { connectAccountsDB } from "@/lib/db/connect";

export interface IOpenTradeData {
  [key: string]: any;
}

export interface IOpenTrade extends Document {
  uniqueId: string;
  email: string;
  accountName: string;
  accountId: string;
  tradeId: string;
  tradeData: IOpenTradeData[];
  createdAt: Date;
  updatedAt: Date;
}

const OpenTradeSchema = new Schema<IOpenTrade>({
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
OpenTradeSchema.index({ tradeId: 1 }, { unique: true });
OpenTradeSchema.index({ uniqueId: 1 });
OpenTradeSchema.index({ accountId: 1 });

export const getOpenTradeModel = async (): Promise<Model<IOpenTrade>> => {
  const conn = await connectAccountsDB();
  return conn.models.OPENTRADE || conn.model<IOpenTrade>("OPENTRADE", OpenTradeSchema);
};