import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getUserModel } from "@/models/main/user.model";
import { getNoteModel } from "@/models/main/notes.model";
import { activateTrial } from "@/lib/subscription";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";
import nodemailer from "nodemailer";

const generateReferralUniqueId = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 16 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

const generateUserReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

export async function POST(req: Request) {
  try {
    const {
      email,
      fullName,
      phone,
      password,
      cpassword,
      countryCode,
      country,
      referralCode,
      couponCode,
    } = await req.json();

    // ✅ Validate input
    if (
      !email ||
      !fullName ||
      !phone ||
      !password ||
      !cpassword ||
      !countryCode ||
      !country
    ) {
      return NextResponse.json(
        { error: "Enter all the details" },
        { status: 400 },
      );
    }

    if (password !== cpassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    const User = await getUserModel();
    const Notes = await getNoteModel();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // ✅ Generate unique user ID
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const generateRandomCode = () =>
      Array.from(
        { length: 12 },
        () => characters[Math.floor(Math.random() * characters.length)],
      ).join("");

    let uniqueId;
    while (true) {
      const code = generateRandomCode();
      const exists = await User.findOne({ uniqueId: code });
      if (!exists) {
        uniqueId = code;
        break;
      }
    }

    // ✅ Generate unique referral code for this user
    let userReferralCode;
    while (true) {
      const code = generateUserReferralCode();
      const exists = await User.findOne({ referralCode: code });
      if (!exists) {
        userReferralCode = code;
        break;
      }
    }

    // ✅ Validate referral code if provided (user-to-user referrals)
    let validatedReferredBy: string | undefined;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        validatedReferredBy = referralCode.toUpperCase();
      }
    }

    // ✅ Generate signup verification token (expires in 15 minutes)
    const signUpVerificationToken = jwt.sign(
      { email },
      process.env.SECRET_KEY as string,
      { expiresIn: "15m" },
    );

    // ✅ Create user and notes documents
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 5);

    const user = new User({
      uniqueId,
      email,
      fullName,
      phone,
      password,
      cpassword,
      countryCode,
      country,
      subscription: {
        isSubscribed: false,
        trialEndsAt,
        trialUsed: true,
        subscriptionStatus: "pending",
      },
      referralCode: userReferralCode,
      referredBy: validatedReferredBy,
    });

    const notes = new Notes({
      uniqueId,
      email,
    });

    await user.save();
    await notes.save();

    // ✅ Track affiliate referral if referral code or coupon code is provided
    if (referralCode || couponCode) {
      try {
        const Affiliate = await getAffiliateModel();
        const Referral = await getReferralModel();

        let affiliate = null;

        if (referralCode) {
          affiliate = await Affiliate.findOne({
            referralCode,
            status: "approved",
          });
        }

        if (!affiliate && couponCode) {
          const { getAffiliateCouponModel } = await import(
            "@/models/main/affiliateCoupon.model"
          );
          const AffiliateCoupon = await getAffiliateCouponModel();
          const coupon = await AffiliateCoupon.findOne({
            code: couponCode.toUpperCase(),
            status: "active",
          });
          if (coupon) {
            affiliate = await Affiliate.findOne({
              uniqueId: coupon.affiliateId,
              status: "approved",
            });
          }
        }

        if (affiliate) {
          const referral = new Referral({
            uniqueId: generateReferralUniqueId(),
            affiliateId: affiliate.uniqueId,
            referredUserId: uniqueId,
            referralCode: referralCode || "",
            couponCode: couponCode || "",
            status: "signed_up",
            source: "registration",
          });
          await referral.save();

          await Affiliate.updateOne(
            { uniqueId: affiliate.uniqueId },
            { $inc: { totalReferrals: 1 }, $set: { updatedAt: new Date() } },
          );

          console.log(
            `Affiliate referral tracked: ${affiliate.referralCode} -> ${uniqueId}`,
          );
        }
      } catch (affiliateError) {
        console.error(
          "Affiliate tracking error (non-blocking):",
          affiliateError,
        );
      }
    }

    // ✅ Send verification email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAILPOS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL,
      to: email,
      subject: "Email Verification: ProJournX",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #040404; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #040404;">
            <tr>
              <td align="center" style="padding: 60px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 440px; background-color: #0c0c0c; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
                  <!-- Top Gradient Bar -->
                  <tr>
                    <td height="4" style="background: linear-gradient(90deg, #3b82f6, #10b981, #3b82f6); background-color: #3b82f6;"></td>
                  </tr>

                  <tr>
                    <td style="padding: 40px 32px; text-align: center;">
                      <!-- Logo Section -->
                      <div style="margin-bottom: 32px;">
                        <img src="https://www.projournx.com/images/logo-dark.png" alt="ProJournX Logo" style="height: 40px; display: block; margin: 0 auto;">
                      </div>

                      <!-- Content Section -->
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.5px;">Click to verify your email</h1>
                      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                        Welcome to ProJournX. Click the button below to confirm your email and unlock your full potential.
                      </p>

                      <!-- Action Button -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://app.projournx.com/verify?t=${signUpVerificationToken}" 
                               style="display: inline-block; width: 100%; max-width: 280px; background: linear-gradient(135deg, #3b82f6, #2563eb); background-color: #3b82f6; color: #ffffff; padding: 16px 0; border-radius: 14px; font-weight: 600; text-decoration: none; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                              Verify Account
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Footer Info -->
                      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                        <p style="color: #52525b; font-size: 13px; line-height: 1.5; margin: 0;">
                          Didn't request this? No worries, you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Compliance & Support -->
                <p style="margin: 24px 0 0 0; color: #52525b; font-size: 12px;">
                  Need help? Contact <a href="mailto:support@projournx.com" style="color: #3b82f6; text-decoration: none;">support@projournx.com</a>
                </p>
                <p style="margin: 8px 0 0 0; color: #3f3f46; font-size: 11px;">
                  © 2025 ProJournX. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Registration successful. Verification email sent." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
