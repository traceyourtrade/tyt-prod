import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

export interface ISharedTrade extends Document {
  uniqueId: string;
  tradeId: string;
  accountId: string;
  shareToken: string;
  isPublic: boolean;
  allowedEmails: string[];
  hideAccountSize: boolean;
  hideDollarAmounts: boolean;
  expiresAt: Date | null;
  viewCount: number;
  comments: ITradeComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITradeComment {
  commentId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: Date;
}

const tradeCommentSchema = new Schema<ITradeComment>({
  commentId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, default: "" },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const sharedTradeSchema = new Schema<ISharedTrade>({
  uniqueId: { type: String, required: true },
  tradeId: { type: String, required: true },
  accountId: { type: String, required: true },
  shareToken: { type: String, required: true, unique: true },
  isPublic: { type: Boolean, default: true },
  allowedEmails: { type: [String], default: [] },
  hideAccountSize: { type: Boolean, default: false },
  hideDollarAmounts: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null },
  viewCount: { type: Number, default: 0 },
  comments: { type: [tradeCommentSchema], default: [] }
}, {
  timestamps: true
});

sharedTradeSchema.index({ shareToken: 1 }, { unique: true });
sharedTradeSchema.index({ uniqueId: 1 });
sharedTradeSchema.index({ tradeId: 1 });

export const getSharedTradeModel = async (): Promise<Model<ISharedTrade>> => {
  const conn = await connectMainDB();
  return conn.models.SHARED_TRADES || conn.model<ISharedTrade>("SHARED_TRADES", sharedTradeSchema);
};
