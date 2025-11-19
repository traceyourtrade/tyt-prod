import mongoose, { Schema, Document, Model } from "mongoose";
import { connectAccountsDB } from "@/lib/db/connect";

export interface IFileUploadTradeData {
  [key: string]: any;
}

export interface IFileUpload extends Document {
  uniqueId: string;
  email: string;
  accountName: string;
  accountId: string;
  tradeId: string;
  tradeData: IFileUploadTradeData[];
  createdAt: Date;
  updatedAt: Date;
}

const fileUploadSchema = new Schema<IFileUpload>({
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
fileUploadSchema.index({ tradeId: 1 }, { unique: true });
fileUploadSchema.index({ uniqueId: 1 });
fileUploadSchema.index({ accountId: 1 });

export const getFileUploadModel = async (): Promise<Model<IFileUpload>> => {
  const conn = await connectAccountsDB();
  return conn.models.FILEUPLOAD || conn.model<IFileUpload>("FILEUPLOAD", fileUploadSchema);
};