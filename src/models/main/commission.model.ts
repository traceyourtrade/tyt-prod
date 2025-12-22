import mongoose, { Schema, Model } from 'mongoose';
import { connectMainDB } from '@/lib/db/connect';

export interface ICommission {
  uniqueId: string;
  affiliateId: string;
  referralId: string;
  referredUserId: string;
  amount: number;
  currency: string;
  commissionRate: number;
  transactionAmount: number;
  transactionType: string;
  couponCode?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  paidAt?: Date;
  paymentReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommission>({
  uniqueId: { type: String, required: true, unique: true },
  affiliateId: { type: String, required: true, index: true },
  referralId: { type: String, required: true },
  referredUserId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  commissionRate: { type: Number, required: true },
  transactionAmount: { type: Number, required: true },
  transactionType: { type: String, required: true },
  couponCode: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'paid', 'rejected'], 
    default: 'pending' 
  },
  paidAt: { type: Date },
  paymentReference: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

commissionSchema.index({ affiliateId: 1, status: 1 });
commissionSchema.index({ status: 1, createdAt: -1 });

export const getCommissionModel = async (): Promise<Model<ICommission>> => {
  const conn = await connectMainDB();
  return conn.models.Commission || conn.model<ICommission>('Commission', commissionSchema);
};
