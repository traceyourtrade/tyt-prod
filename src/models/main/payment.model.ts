import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

export interface ITransaction extends Document {
    transactionId: string; // Internal unique ID
    userId: string;       // User's uniqueId
    email: string;
    subscriptionId?: string;
    paymentId?: string;
    orderId?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'captured' | 'failed' | 'refunded' | 'authenticated' | 'activated';
    source: 'checkout' | 'webhook';
    rawResponse: any;
    createdAt: Date;
    updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
    transactionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    subscriptionId: { type: String, index: true },
    paymentId: { type: String, index: true },
    orderId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['pending', 'captured', 'failed', 'refunded', 'authenticated', 'activated'],
        default: 'pending'
    },
    source: { type: String, enum: ['checkout', 'webhook'], required: true },
    rawResponse: { type: Schema.Types.Mixed },
}, {
    collection: "transactions",
    timestamps: true
});

export const getTransactionModel = async (): Promise<Model<ITransaction>> => {
    const conn = await connectMainDB();
    return conn.models.TRANSACTIONS || conn.model<ITransaction>("TRANSACTIONS", transactionSchema);
};
