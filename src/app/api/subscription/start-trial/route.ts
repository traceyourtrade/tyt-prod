import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserModel } from "@/models/main/user.model";
import { activateTrial, isTrialEligible, getSubscriptionStatus } from "@/lib/subscription";

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Demo users cannot start a trial" }, { status: 403 });
    }

    const User = await getUserModel();
    const user = await User.findById(decoded._id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check eligibility
    if (!isTrialEligible(user)) {
      return NextResponse.json({ 
        error: "Not eligible for free trial",
        reason: user.subscription?.trialUsed ? "Trial already used" : "Already subscribed before"
      }, { status: 403 });
    }

    // Activate the trial
    const trialEndsAt = activateTrial(user);
    const savedUser = await user.save();

    console.log(`[START-TRIAL] Trial activated for user ${savedUser.uniqueId}, ends at ${trialEndsAt}`);

    // Re-fetch user to get updated subscription status
    const updatedUser = await User.findById(decoded._id);
    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to reload user" }, { status: 500 });
    }

    // Return updated subscription status from fresh user data
    const status = getSubscriptionStatus(updatedUser);

    return NextResponse.json({
      success: true,
      message: "Free trial activated successfully",
      trialEndsAt: updatedUser.subscription?.trialEndsAt,
      ...status,
      email: updatedUser.email
    });
  } catch (error) {
    console.error("Start trial error:", error);
    return NextResponse.json({ error: "Failed to start trial" }, { status: 500 });
  }
}
