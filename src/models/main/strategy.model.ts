import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

export interface IStrategyRule {
    id: string;
    text: string;
}

export interface IStrategy extends Document {
    uniqueId: string;
    strategy: string;
    description?: string;
    tags?: string[];
    imgLink?: string;
    rules?: IStrategyRule[];
    isDefault: boolean;
    createdDate: Date;
}

const strategyRuleSchema = new Schema<IStrategyRule>({
    id: { type: String, required: true },
    text: { type: String, required: true }
}, { _id: false });

const strategySchema = new Schema<IStrategy>({
    uniqueId: { type: String, required: true },
    strategy: { type: String, required: true },
    description: String,
    tags: [String],
    imgLink: String,
    rules: [strategyRuleSchema],
    isDefault: { type: Boolean, default: false },
    createdDate: { type: Date, default: Date.now }
});

// Compound index to ensure unique strategy names per user
strategySchema.index({ uniqueId: 1, strategy: 1 }, { unique: true });

export const getStrategyModel = async (): Promise<Model<IStrategy>> => {
    const conn = await connectMainDB();
    return conn.models.STRATEGIES || conn.model<IStrategy>("STRATEGIES", strategySchema);
};