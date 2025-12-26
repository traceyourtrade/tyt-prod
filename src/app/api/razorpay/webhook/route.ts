import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserModel } from "@/models/main/user.model";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    
    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload;

    console.log("Razorpay webhook received:", eventType);

    const User = await getUserModel();

    switch (eventType) {
      case "subscription.activated": {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const customerId = subscription.customer_id;
          const subscriptionId = subscription.id;
          const email = payload.subscription?.entity?.notes?.email;

          let user = null;
          if (email) {
            user = await User.findOne({ email });
          }
          if (!user && customerId) {
            user = await User.findOne({ "subscription.razorpayCustomerId": customerId });
          }

          if (user) {
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + 1);

            user.subscription = {
              ...(user.subscription ?? { isSubscribed: false, trialUsed: false }),
              isSubscribed: true,
              subscriptionId,
              subscriptionStatus: 'active',
              subscriptionExpiry: expiry,
              razorpayCustomerId: customerId,
              trialUsed: true
            };
            await user.save();
            console.log(`Subscription activated for user: ${user.email}`);
          }
        }
        break;
      }

      case "subscription.charged": {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const subscriptionId = subscription.id;
          const user = await User.findOne({ "subscription.subscriptionId": subscriptionId });

          if (user) {
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + 1);

            if (!user.subscription) {
              user.subscription = { isSubscribed: true, trialUsed: true };
            }
            user.subscription.subscriptionExpiry = expiry;
            user.subscription.subscriptionStatus = 'active';
            await user.save();
            console.log(`Subscription renewed for user: ${user.email}`);
          }
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted": {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const subscriptionId = subscription.id;
          const user = await User.findOne({ "subscription.subscriptionId": subscriptionId });

          if (user) {
            if (!user.subscription) {
              user.subscription = { isSubscribed: false, trialUsed: true };
            }
            user.subscription.isSubscribed = false;
            user.subscription.subscriptionStatus = eventType === "subscription.cancelled" ? 'cancelled' : 'halted';
            await user.save();
            console.log(`Subscription ${eventType} for user: ${user.email}`);
          }
        }
        break;
      }

      default:
        console.log("Unhandled event type:", eventType);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
