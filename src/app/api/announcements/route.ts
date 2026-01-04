import { NextResponse } from "next/server";
import { getAnnouncementModel } from "@/lib/db/models/Announcement";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        
        let userSubscriptionStatus = "free";
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as { subscriptionStatus?: string };
                userSubscriptionStatus = decoded.subscriptionStatus === "active" ? "subscribers" : "free";
            } catch {
                userSubscriptionStatus = "free";
            }
        }
        
        const AnnouncementModel = await getAnnouncementModel();
        
        const now = new Date();
        
        const announcements = await AnnouncementModel.find({
            isActive: true,
            $and: [
                {
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: null },
                        { expiresAt: { $gt: now } }
                    ]
                },
                {
                    $or: [
                        { targetAudience: "all" },
                        { targetAudience: userSubscriptionStatus }
                    ]
                }
            ]
        }).sort({ createdAt: -1 }).lean();
        
        const formattedAnnouncements = announcements.map((ann: any) => ({
            id: ann._id.toString(),
            title: ann.title,
            message: ann.message,
            type: ann.type,
            createdAt: ann.createdAt
        }));
        
        return NextResponse.json({ announcements: formattedAnnouncements });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json({ announcements: [] });
    }
}
