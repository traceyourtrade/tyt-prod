import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

export type LeaderboardCategory = 
  | "consistency" 
  | "rMultiple" 
  | "winRate" 
  | "profitFactor";

export type LeaderboardPeriod = "weekly" | "monthly" | "allTime";

export interface ILeaderboardEntry extends Document {
  uniqueId: string;
  displayName: string;
  avatarUrl: string | null;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  score: number;
  rank: number;
  tradeCount: number;
  previousRank: number | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface ILeaderboardSettings extends Document {
  uniqueId: string;
  optedIn: boolean;
  displayName: string;
  useAnonymousName: boolean;
  showInWeekly: boolean;
  showInMonthly: boolean;
  showInAllTime: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leaderboardEntrySchema = new Schema<ILeaderboardEntry>({
  uniqueId: { type: String, required: true },
  displayName: { type: String, required: true },
  avatarUrl: { type: String, default: null },
  category: { 
    type: String, 
    required: true,
    enum: ["consistency", "rMultiple", "winRate", "profitFactor"]
  },
  period: {
    type: String,
    required: true,
    enum: ["weekly", "monthly", "allTime"]
  },
  score: { type: Number, required: true, default: 0 },
  rank: { type: Number, required: true, default: 0 },
  tradeCount: { type: Number, required: true, default: 0 },
  previousRank: { type: Number, default: null }
}, {
  timestamps: true
});

const leaderboardSettingsSchema = new Schema<ILeaderboardSettings>({
  uniqueId: { type: String, required: true, unique: true },
  optedIn: { type: Boolean, default: false },
  displayName: { type: String, required: true },
  useAnonymousName: { type: Boolean, default: false },
  showInWeekly: { type: Boolean, default: true },
  showInMonthly: { type: Boolean, default: true },
  showInAllTime: { type: Boolean, default: true }
}, {
  timestamps: true
});

leaderboardEntrySchema.index({ category: 1, period: 1, rank: 1 });
leaderboardEntrySchema.index({ uniqueId: 1 });
leaderboardSettingsSchema.index({ uniqueId: 1 }, { unique: true });

export const getLeaderboardEntryModel = async (): Promise<Model<ILeaderboardEntry>> => {
  const conn = await connectMainDB();
  return conn.models.LEADERBOARD_ENTRIES || conn.model<ILeaderboardEntry>("LEADERBOARD_ENTRIES", leaderboardEntrySchema);
};

export const getLeaderboardSettingsModel = async (): Promise<Model<ILeaderboardSettings>> => {
  const conn = await connectMainDB();
  return conn.models.LEADERBOARD_SETTINGS || conn.model<ILeaderboardSettings>("LEADERBOARD_SETTINGS", leaderboardSettingsSchema);
};
