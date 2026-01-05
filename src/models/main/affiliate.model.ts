import mongoose, { Schema, Model } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

export interface IAffiliate {
  uniqueId: string;
  userId: string;
  referralCode: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  tier: "bronze" | "silver" | "gold" | "platinum";
  commissionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  paymentMethod?: string;
  paymentDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const affiliateSchema = new Schema<IAffiliate>(
  {
    uniqueId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    referralCode: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze",
    },
    commissionRate: { type: Number, default: 20 },
    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    paidEarnings: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    paymentMethod: { type: String },
    paymentDetails: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "affiliates" },
);

export const getAffiliateModel = async (): Promise<Model<IAffiliate>> => {
  const conn = await connectMainDB();
  const model =
    conn.models.Affiliate ||
    conn.model<IAffiliate>("Affiliate", affiliateSchema);

  // Drop stale promoCode index if it exists (from older schema version)
  try {
    const indexes = await model.collection.indexes();
    const hasPromoCodeIndex = indexes.some(
      (idx: any) => idx.name === "promoCode_1",
    );
    if (hasPromoCodeIndex) {
      console.log("Dropping stale promoCode index from affiliates collection");
      await model.collection.dropIndex("promoCode_1");
    }
  } catch (e) {
    // Index may not exist, ignore error
  }

  return model;
};
