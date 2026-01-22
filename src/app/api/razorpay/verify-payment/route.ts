import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getUserModel } from "@/models/main/user.model";
import { getTransactionModel } from "@/models/main/payment.model";
import { activateSubscription } from "@/lib/subscription";

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
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
            billingPeriod
        } = await request.json();

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Verify Signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
        }

        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_payment_id + "|" + razorpay_subscription_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        // 2. Process Activation
        const User = await getUserModel();
        const user = await User.findById(decoded._id);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // record the transaction
        const Transaction = await getTransactionModel();
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await Transaction.create({
            transactionId,
            userId: user.uniqueId,
            email: user.email,
            subscriptionId: razorpay_subscription_id,
            paymentId: razorpay_payment_id,
            amount: billingPeriod === 'yearly' ? 8199 : 849, // Approx, could be retrieved from Razorpay API if needed
            currency: 'INR',
            status: 'captured',
            source: 'checkout',
            rawResponse: { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
        });

        // Activate subscription
        activateSubscription(user, razorpay_subscription_id, user.subscription?.razorpayCustomerId, billingPeriod);
        await user.save();

        console.log(`Manual verification successful for user ${user.email}, sub: ${razorpay_subscription_id}`);

        return NextResponse.json({ success: true, message: "Subscription activated successfully" });

    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
