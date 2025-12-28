import { NextRequest, NextResponse } from "next/server";
import { getUserModel } from "@/models/main/user.model";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-admin-key");
    if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    const User = await getUserModel();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      fullName: user.fullName,
      subscription: user.subscription,
      createdAt: user.date
    });
  } catch (error) {
    console.error("Admin subscription check error:", error);
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-admin-key");
    if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, action, billingPeriod = 'monthly', months = 1 } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const User = await getUserModel();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === 'activate') {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);

      user.subscription = {
        isSubscribed: true,
        subscriptionId: `manual_${Date.now()}`,
        subscriptionStatus: 'active',
        subscriptionExpiry: expiry,
        trialUsed: true,
        billingPeriod: billingPeriod
      };
      await user.save();

      return NextResponse.json({
        success: true,
        message: `Subscription activated for ${email}`,
        subscription: user.subscription
      });
    } else if (action === 'cancel') {
      if (user.subscription) {
        user.subscription.isSubscribed = false;
        user.subscription.subscriptionStatus = 'cancelled';
        await user.save();
      }

      return NextResponse.json({
        success: true,
        message: `Subscription cancelled for ${email}`,
        subscription: user.subscription
      });
    } else if (action === 'check') {
      return NextResponse.json({
        email: user.email,
        subscription: user.subscription
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'activate', 'cancel', or 'check'" }, { status: 400 });
  } catch (error) {
    console.error("Admin subscription action error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
