import mongoose, { Schema, Model } from 'mongoose';
import { connectMainDB } from '@/lib/db/connect';

export interface IReferral {
  uniqueId: string;
  affiliateId: string;
  referredUserId: string;
  referralCode: string;
  couponCode?: string;
  status: 'clicked' | 'signed_up' | 'converted' | 'churned';
  conversionDate?: Date;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>({
  uniqueId: { type: String, required: true, unique: true },
  affiliateId: { type: String, required: true, index: true },
  referredUserId: { type: String, index: true },
  referralCode: { type: String, required: true },
  couponCode: { type: String },
  status: { 
    type: String, 
    enum: ['clicked', 'signed_up', 'converted', 'churned'], 
    default: 'clicked' 
  },
  conversionDate: { type: Date },
  ipAddress: { type: String },
  userAgent: { type: String },
  source: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

referralSchema.index({ affiliateId: 1, status: 1 });
referralSchema.index({ referralCode: 1 });

export const getReferralModel = async (): Promise<Model<IReferral>> => {
  const conn = await connectMainDB();
  return conn.models.Referral || conn.model<IReferral>('Referral', referralSchema);
};
