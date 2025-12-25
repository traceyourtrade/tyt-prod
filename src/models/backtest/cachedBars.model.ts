import { connectBacktestDB } from '@/lib/db/connect';
import mongoose, { Schema, Document } from 'mongoose';

export interface ICachedBars extends Document {
  market: string;
  symbol: string;
  resolution: string;
  fromTs: number;
  toTs: number;
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
  cachedAt: Date;
  expiresAt: Date;
}

const CachedBarsSchema = new Schema({
  market: { type: String, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  resolution: { type: String, required: true, index: true },
  fromTs: { type: Number, required: true, index: true },
  toTs: { type: Number, required: true, index: true },
  t: [{ type: Number }],
  o: [{ type: Number }],
  h: [{ type: Number }],
  l: [{ type: Number }],
  c: [{ type: Number }],
  v: [{ type: Number }],
  cachedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
}, {
  timestamps: true
});

CachedBarsSchema.index({ market: 1, symbol: 1, resolution: 1, fromTs: 1, toTs: 1 }, { unique: true });

let CachedBarsModel: mongoose.Model<ICachedBars>;

export async function getCachedBarsModel() {
  if (CachedBarsModel) {
    return CachedBarsModel;
  }
  
  const connection = await connectBacktestDB();
  
  if (connection.models.CachedBars) {
    CachedBarsModel = connection.models.CachedBars as mongoose.Model<ICachedBars>;
  } else {
    CachedBarsModel = connection.model<ICachedBars>('CachedBars', CachedBarsSchema);
  }
  
  return CachedBarsModel;
}
