import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "projournx#himanshu789";
const WEBHOOK_URL = "http://localhost:3000/api/razorpay/webhook";

async function testWebhook() {
    const payload = {
        event: "subscription.activated",
        payload: {
            subscription: {
                entity: {
                    id: "sub_test_123",
                    customer_id: "cust_test_123",
                    status: "active",
                    notes: {
                        email: "tester@projournx.com",
                        userId: "USER_TEST_123",
                        billingPeriod: "monthly"
                    }
                }
            }
        },
        account_id: "acc_test_123",
        created_at: Math.floor(Date.now() / 1000)
    };

    const body = JSON.stringify(payload);
    const signature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

    console.log("Sending test webhook to:", WEBHOOK_URL);

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-razorpay-signature": signature
            },
            body: body
        });

        const data = await response.json();
        console.log("Response status:", response.status);
        console.log("Response body:", data);
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
}

testWebhook();
