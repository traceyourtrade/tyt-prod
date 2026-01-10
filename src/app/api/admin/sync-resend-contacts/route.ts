import { NextRequest, NextResponse } from "next/server";
import { getUserModel } from "@/models/main/user.model";
import { syncContactWithSubscription } from "@/lib/resend";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const User = await getUserModel();
    const users = await User.find({}).select('email fullName subscription date').lean();
    
    console.log(`[SYNC] Starting bulk sync of ${users.length} users to Resend (rate limited to 1 req/sec)...`);
    
    let synced = 0;
    let failed = 0;
    const errors: { email: string; error: string }[] = [];

    for (const user of users) {
      try {
        await syncContactWithSubscription({
          email: user.email,
          fullName: user.fullName,
          subscription: user.subscription || {
            isSubscribed: false,
            subscriptionStatus: 'pending',
            trialEndsAt: undefined,
            trialUsed: false
          },
          date: user.date || new Date()
        });
        synced++;
        
        if (synced % 25 === 0) {
          console.log(`[SYNC] Progress: ${synced}/${users.length} synced, ${failed} failed`);
        }
      } catch (err) {
        failed++;
        errors.push({
          email: user.email,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
      
      // Wait 600ms between each user to stay well under Resend's 2 req/sec limit
      // (syncContactWithSubscription may make 2 API calls: update + create)
      await delay(600);
    }

    console.log(`[SYNC] Complete: ${synced} synced, ${failed} failed out of ${users.length} total`);

    return NextResponse.json({
      success: true,
      total: users.length,
      synced,
      failed,
      errors: errors.slice(0, 20)
    });
  } catch (error) {
    console.error("[SYNC] Bulk sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
