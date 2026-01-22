import mongoose, { Schema, Document, Model } from "mongoose";
import { connectAccountsDB } from "@/lib/db/connect";

export interface ITradeEnrichment extends Document {
    uniqueId: string;
    accountId: string;
    tradeId: string;
    jrData?: any;
    beforeURL?: string;
    afterURL?: string;
    Quality?: any;
    strategy?: string;
    rfe?: string;
    btm?: string;
    dtm?: string;
    atm?: string;
    RiskR?: string;
}

const tradeEnrichmentSchema = new Schema<ITradeEnrichment>(
    {
        uniqueId: { type: String, required: true },
        accountId: { type: String, required: true },
        tradeId: { type: String, required: true },
        jrData: { type: Schema.Types.Mixed },
        beforeURL: { type: String },
        afterURL: { type: String },
        Quality: { type: Schema.Types.Mixed },
        strategy: { type: String },
        rfe: { type: String },
        btm: { type: String },
        dtm: { type: String },
        atm: { type: String },
        RiskR: { type: String },
    },
    {
        timestamps: true,
    }
);

// Index for fast lookups by user, account, and trade
tradeEnrichmentSchema.index({ uniqueId: 1, accountId: 1, tradeId: 1 }, { unique: true });

export const getTradeEnrichmentModel = async (): Promise<Model<ITradeEnrichment>> => {
    const conn = await connectAccountsDB();
    return (
        conn.models.TRADE_ENRICHMENT || conn.model<ITradeEnrichment>("TRADE_ENRICHMENT", tradeEnrichmentSchema)
    );
};
