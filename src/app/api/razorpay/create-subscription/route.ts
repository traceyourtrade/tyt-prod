import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserModel } from "@/models/main/user.model";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decoded: { _id: string };
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY as string) as { _id: string };
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const User = await getUserModel();
    const user = await User.findById(decoded._id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planId = process.env.RAZORPAY_PLAN_ID;

    if (!keyId || !keySecret || !planId) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const subscriptionData = {
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        email: user.email,
        userId: user.uniqueId
      }
    };

    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(subscriptionData)
    });

    const subscription = await response.json();

    if (!response.ok) {
      console.error("Razorpay error:", subscription);
      return NextResponse.json({ error: subscription.error?.description || "Failed to create subscription" }, { status: 400 });
    }

    if (user.subscription) {
      user.subscription.razorpayCustomerId = subscription.customer_id;
    }
    await user.save();

    return NextResponse.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      keyId: keyId
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
