import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserModel } from "@/models/main/user.model";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";
import { getCommissionModel } from "@/models/main/commission.model";
import { getTransactionModel } from "@/models/main/payment.model";
import { activateSubscription } from "@/lib/subscription";

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
    const eventId = event.account_id + "_" + event.created_at + "_" + eventType; // Simple idempotency key

    console.log(`Razorpay webhook received: ${eventType} (ID: ${event.id || 'N/A'})`);

    const User = await getUserModel();
    const Transaction = await getTransactionModel();

    // Record the webhook event
    const recordWebhook = async (status: string, userId: string, email: string, subId?: string, paymentId?: string, amount?: number) => {
      try {
        await Transaction.create({
          transactionId: `WEBHOOK_${event.id || Date.now()}`,
          userId: userId || 'unknown',
          email: email || 'unknown',
          subscriptionId: subId,
          paymentId: paymentId,
          amount: amount || 0,
          currency: 'INR',
          status: status as any,
          source: 'webhook',
          rawResponse: event
        });
      } catch (e) {
        console.error("Error recording webhook transaction:", e);
      }
    };

    const findUserBySubscription = async (subscription: any) => {
      const subscriptionId = subscription?.id;
      const customerId = subscription?.customer_id;
      const email = subscription?.notes?.email;
      const userId = subscription?.notes?.userId;

      let user = null;
      if (subscriptionId) {
        user = await User.findOne({ "subscription.subscriptionId": subscriptionId });
      }
      if (!user && userId) {
        user = await User.findOne({ uniqueId: userId });
      }
      if (!user && email) {
        user = await User.findOne({ email });
      }
      if (!user && customerId) {
        user = await User.findOne({ "subscription.razorpayCustomerId": customerId });
      }
      return user;
    };

    switch (eventType) {
      case "subscription.authenticated": {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const user = await findUserBySubscription(subscription);
          if (user) {
            if (!user.subscription) {
              user.subscription = { isSubscribed: false, trialUsed: false };
            }
            user.subscription.subscriptionId = subscription.id;
            user.subscription.razorpayCustomerId = subscription.customer_id;
            user.subscription.subscriptionStatus = 'pending';
            await user.save();
            await recordWebhook('authenticated', user.uniqueId, user.email, subscription.id);
            console.log(`Subscription authenticated for user: ${user.email}`);
          }
        }
        break;
      }

      case "subscription.activated": {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const user = await findUserBySubscription(subscription);

          if (user) {
            const billingPeriod = subscription?.notes?.billingPeriod || user.subscription?.billingPeriod || 'monthly';
            activateSubscription(user, subscription.id, subscription.customer_id, billingPeriod as any);
            await user.save();

            const planAmount = billingPeriod === 'yearly' ? 8199 : 849;
            await recordWebhook('activated', user.uniqueId, user.email, subscription.id, undefined, planAmount);
            console.log(`Subscription activated for user: ${user.email}, billing: ${billingPeriod}`);

            await processAffiliateCommission(user.uniqueId, planAmount, 'subscription_activated');
          } else {
            console.error(`User not found for subscription.activated: ${subscription.id}`);
          }
        }
        break;
      }

      case "subscription.charged": {
        const subscription = payload.subscription?.entity;
        const payment = payload.payment?.entity;
        if (subscription) {
          const user = await findUserBySubscription(subscription);

          if (user) {
            const billingPeriod = user.subscription?.billingPeriod || 'monthly';
            activateSubscription(user, subscription.id, subscription.customer_id, billingPeriod as any);
            await user.save();

            const renewalAmount = billingPeriod === 'yearly' ? 8199 : 849;
            await recordWebhook('captured', user.uniqueId, user.email, subscription.id, payment?.id, renewalAmount);
            console.log(`Subscription charged/renewed for user: ${user.email}, billing: ${billingPeriod}`);

            await processAffiliateCommission(user.uniqueId, renewalAmount, 'subscription_renewed');
          } else {
            console.error(`User not found for subscription.charged: ${subscription.id}`);
          }
        }
        break;
      }

      case "subscription.pending": {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const user = await findUserBySubscription(subscription);
          if (user) {
            if (!user.subscription) {
              user.subscription = { isSubscribed: false, trialUsed: false };
            }
            user.subscription.subscriptionId = subscription.id;
            user.subscription.subscriptionStatus = 'pending';
            await user.save();
            await recordWebhook('pending', user.uniqueId, user.email, subscription.id);
            console.log(`Subscription pending for user: ${user.email}`);
          }
        }
        break;
      }

      case "payment.captured": {
        const payment = payload.payment?.entity;
        if (payment) {
          const subscriptionId = payment.subscription_id;
          const email = payment.email || payment.notes?.email;

          let user = null;
          if (subscriptionId) {
            user = await User.findOne({ "subscription.subscriptionId": subscriptionId });
          }
          if (!user && email) {
            user = await User.findOne({ email });
          }

          if (user && subscriptionId) {
            const billingPeriod = user.subscription?.billingPeriod || 'monthly';
            activateSubscription(user, subscriptionId, user.subscription?.razorpayCustomerId, billingPeriod as any);
            await user.save();
            await recordWebhook('captured', user.uniqueId, user.email, subscriptionId, payment.id, payment.amount / 100);
            console.log(`Payment captured, subscription activated for user: ${user.email}`);
          }
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted": {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const user = await findUserBySubscription(subscription);

          if (user) {
            // If it's still active according to expiry, we might want to keep it active until expiry
            // but the current logic sets isSubscribed to false immediately.
            // I'll keep the current behavior but add logging.

            if (user.subscription?.subscriptionStatus === 'active' && user.subscription?.isSubscribed) {
              // check expiry
              const now = new Date();
              if (user.subscription.subscriptionExpiry && new Date(user.subscription.subscriptionExpiry) > now) {
                console.log(`Ignoring ${eventType} for active subscription that hasn't expired yet: ${user.email}`);
                break;
              }
            }

            if (!user.subscription) {
              user.subscription = { isSubscribed: false, trialUsed: true };
            }
            user.subscription.isSubscribed = false;
            user.subscription.subscriptionStatus = eventType === "subscription.cancelled" ? 'cancelled' : 'halted';
            await user.save();
            await recordWebhook(user.subscription.subscriptionStatus, user.uniqueId, user.email, subscription.id);
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
