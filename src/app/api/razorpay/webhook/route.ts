import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserModel } from "@/models/main/user.model";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";
import { getCommissionModel } from "@/models/main/commission.model";

const generateUniqueId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

async function processAffiliateCommission(userId: string, transactionAmount: number, transactionType: string) {
  try {
    const Affiliate = await getAffiliateModel();
    const Referral = await getReferralModel();
    const Commission = await getCommissionModel();

    const referral = await Referral.findOne({ 
      referredUserId: userId, 
      status: { $in: ['signed_up', 'converted'] }
    });

    if (!referral) {
      console.log(`No affiliate referral found for user: ${userId}`);
      return;
    }

    const affiliate = await Affiliate.findOne({ 
      uniqueId: referral.affiliateId,
      status: 'approved'
    });

    if (!affiliate) {
      console.log(`Affiliate not found or not approved: ${referral.affiliateId}`);
      return;
    }

    const commissionRate = affiliate.commissionRate || 20;
    const commissionAmount = (transactionAmount * commissionRate) / 100;

    const existingCommission = await Commission.findOne({
      affiliateId: affiliate.uniqueId,
      referredUserId: userId,
      transactionType,
      createdAt: { $gte: new Date(Date.now() - 60000) }
    });

    if (existingCommission) {
      console.log(`Commission already processed for this transaction`);
      return;
    }

    const wasNotConverted = referral.status !== 'converted';

    const commission = new Commission({
      uniqueId: generateUniqueId(),
      affiliateId: affiliate.uniqueId,
      referralId: referral.uniqueId,
      referredUserId: userId,
      amount: commissionAmount,
      currency: 'INR',
      commissionRate,
      transactionAmount,
      transactionType,
      couponCode: referral.couponCode || '',
      status: 'pending',
    });
    await commission.save();

    if (wasNotConverted) {
      referral.status = 'converted';
      referral.conversionDate = new Date();
      await referral.save();
    }

    await Affiliate.updateOne(
      { uniqueId: affiliate.uniqueId },
      {
        $inc: {
          totalEarnings: commissionAmount,
          pendingEarnings: commissionAmount,
          activeReferrals: wasNotConverted ? 1 : 0
        },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`Affiliate commission created: ${affiliate.referralCode} earned ₹${commissionAmount.toFixed(2)} from user ${userId}`);
  } catch (error) {
    console.error("Affiliate commission processing error:", error);
  }
}

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
            const billingPeriod = payload.subscription?.entity?.notes?.billingPeriod || 'monthly';
            const expiry = new Date();
            if (billingPeriod === 'yearly') {
              expiry.setFullYear(expiry.getFullYear() + 1);
            } else {
              expiry.setMonth(expiry.getMonth() + 1);
            }

            user.subscription = {
              ...(user.subscription ?? { isSubscribed: false, trialUsed: false }),
              isSubscribed: true,
              subscriptionId,
              subscriptionStatus: 'active',
              subscriptionExpiry: expiry,
              razorpayCustomerId: customerId,
              trialUsed: true,
              billingPeriod: billingPeriod
            };
            await user.save();
            console.log(`Subscription activated for user: ${user.email}, billing: ${billingPeriod}`);

            const planAmount = billingPeriod === 'yearly' ? 8199 : 849;
            await processAffiliateCommission(user.uniqueId, planAmount, 'subscription_activated');
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
            const billingPeriod = user.subscription?.billingPeriod || 'monthly';
            const expiry = new Date();
            if (billingPeriod === 'yearly') {
              expiry.setFullYear(expiry.getFullYear() + 1);
            } else {
              expiry.setMonth(expiry.getMonth() + 1);
            }

            if (!user.subscription) {
              user.subscription = { isSubscribed: true, trialUsed: true };
            }
            user.subscription.subscriptionExpiry = expiry;
            user.subscription.subscriptionStatus = 'active';
            await user.save();
            console.log(`Subscription renewed for user: ${user.email}, billing: ${billingPeriod}`);

            const renewalAmount = billingPeriod === 'yearly' ? 8199 : 849;
            await processAffiliateCommission(user.uniqueId, renewalAmount, 'subscription_renewed');
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
