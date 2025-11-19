import mongoose, { Schema, Document, Model } from "mongoose";
import { connectAccountsDB } from "@/lib/db/connect";

export interface IASAccount extends Document {
  uniqueId: string;
  email: string;
  accountId: string;
  accountName: string;
  investorId: string;
  investorPw: string;
  server: string;
  vpsId: string;
  isActive: boolean;
  lastFetch?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const autoSyncAccountsSchema = new Schema<IASAccount>({
  uniqueId: { type: String, required: true },
  email: { type: String, required: true },
  accountId: { type: String, required: true },
  accountName: { type: String, required: true },
  investorId: { type: String, required: true },
  investorPw: { type: String, required: true },
  server: { type: String, required: true },
  vpsId: { type: String, required: true },
  isActive: { type: Boolean, required: true },
  lastFetch: { type: Date, default: null },
  status: { type: String, required: true, default: "yellow" }
}, {
  timestamps: true
});

autoSyncAccountsSchema.index({ accountId: 1 }, { unique: true });

export const getASAccountModel = async (): Promise<Model<IASAccount>> => {
  const conn = await connectAccountsDB();
  return conn.models.ASACC || conn.model<IASAccount>("ASACC", autoSyncAccountsSchema);
};