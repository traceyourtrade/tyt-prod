import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserModel } from "@/models/main/user.model";
import { getSubscriptionStatus } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decoded: { _id: string; demoMode?: boolean };
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY as string) as { _id: string; demoMode?: boolean };
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    if (decoded.demoMode === true) {
      return NextResponse.json({
        hasAccess: true,
        isSubscribed: false,
        isOnTrial: false,
        trialDaysLeft: 0,
        canStartTrial: false,
        status: 'demo',
        demoMode: true,
        email: 'demo@projournx.com'
      });
    }

    const User = await getUserModel();
    const user = await User.findById(decoded._id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const status = getSubscriptionStatus(user);

    return NextResponse.json({
      ...status,
      email: user.email,
      subscriptionExpiry: user.subscription?.subscriptionExpiry,
      trialEndsAt: user.subscription?.trialEndsAt,
      trialActivatedAt: user.subscription?.trialActivatedAt,
      billingPeriod: user.subscription?.billingPeriod || 'monthly'
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ error: "Failed to get subscription status" }, { status: 500 });
  }
}
