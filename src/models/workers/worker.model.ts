import mongoose, { Schema, Document, Model } from "mongoose";
import { connectWorkersDB } from "@/lib/db/connect";

export interface IWorker extends Document {
    workerId: string;
    workerName: string;
    createdAt: Date;
}

const workerSchema = new Schema<IWorker>({
    workerId: { type: String, required: true, unique: true },
    workerName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const getWorkerModel = async (): Promise<Model<IWorker>> => {
    const conn = await connectWorkersDB();
    return conn.models.WORKERS || conn.model<IWorker>("WORKERS", workerSchema);
};
