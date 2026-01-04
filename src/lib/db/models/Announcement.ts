import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

export interface IAnnouncement extends Document {
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "urgent";
    targetAudience: "all" | "subscribers" | "free";
    createdBy: string;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ["info", "warning", "success", "urgent"],
        default: "info"
    },
    targetAudience: {
        type: String,
        enum: ["all", "subscribers", "free"],
        default: "all"
    },
    createdBy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
}, { timestamps: true });

export const getAnnouncementModel = async (): Promise<Model<IAnnouncement>> => {
    const conn = await connectMainDB();
    return conn.models.ANNOUNCEMENTS || conn.model<IAnnouncement>("ANNOUNCEMENTS", announcementSchema);
};
