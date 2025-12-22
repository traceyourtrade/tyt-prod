import mongoose, { Schema, Model } from 'mongoose';
import { connectMainDB } from '@/lib/db/connect';

export interface IAffiliateCoupon {
  uniqueId: string;
  affiliateId: string;
  code: string;
  discountPercent: number;
  discountType: 'percentage' | 'fixed';
  usageLimit?: number;
  usageCount: number;
  status: 'active' | 'inactive' | 'expired';
  expiresAt?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const affiliateCouponSchema = new Schema<IAffiliateCoupon>({
  uniqueId: { type: String, required: true, unique: true },
  affiliateId: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercent: { type: Number, required: true, min: 0, max: 100 },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    default: 'percentage' 
  },
  usageLimit: { type: Number },
  usageCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'expired'], 
    default: 'active' 
  },
  expiresAt: { type: Date },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

affiliateCouponSchema.index({ affiliateId: 1, status: 1 });

export const getAffiliateCouponModel = async (): Promise<Model<IAffiliateCoupon>> => {
  const conn = await connectMainDB();
  return conn.models.AffiliateCoupon || conn.model<IAffiliateCoupon>('AffiliateCoupon', affiliateCouponSchema);
};
