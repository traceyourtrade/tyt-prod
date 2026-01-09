import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getUserModel } from "@/models/main/user.model";
import { getNoteModel } from "@/models/main/notes.model";
import { activateTrial } from "@/lib/subscription";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";
import { sendEmail, addContactToAudience } from "@/lib/resend";
import VerificationEmail from "@/emails/VerificationEmail";

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

    console.log("[REGISTER] New signup request:", {
      email,
      referralCode,
      couponCode,
    });

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

    // ✅ Validate and prepare referral tracking data
    let validatedReferredBy: string | undefined;
    let referrerUser = null;
    let affiliateReferrer = null;

    if (referralCode) {
      const normalizedCode = referralCode.toUpperCase();
      console.log("[REGISTER] Validating referral code:", normalizedCode);

      // Check if it's a regular user code
      referrerUser = await User.findOne({ referralCode: normalizedCode });
      if (referrerUser)
        console.log("[REGISTER] Referrer user found:", referrerUser.uniqueId);

      // Check if it's an affiliate code (relaxing status check for tracking)
      const Affiliate = await getAffiliateModel();
      affiliateReferrer = await Affiliate.findOne({
        referralCode: normalizedCode,
      });
      if (affiliateReferrer)
        console.log(
          "[REGISTER] Affiliate referrer found (status:",
          affiliateReferrer.status,
          "):",
          affiliateReferrer.uniqueId,
        );

      if (referrerUser || affiliateReferrer) {
        validatedReferredBy = normalizedCode;
        console.log(
          "[REGISTER] ✅ Referral code validated. Type:",
          affiliateReferrer ? "Affiliate" : "User",
        );
      } else {
        console.log(
          "[REGISTER] ❌ Referral code not found in any collection:",
          normalizedCode,
        );
      }
    }

    // ✅ Generate signup verification token (expires in 15 minutes)
    const signUpVerificationToken = jwt.sign(
      { email },
      process.env.SECRET_KEY as string,
      { expiresIn: "15m" },
    );

    // ✅ Create user and notes documents (trial not auto-started, user must opt-in)
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
        trialUsed: false,
        hasEverSubscribed: false,
        subscriptionStatus: "inactive",
      },
      referralCode: userReferralCode,
      referredBy: validatedReferredBy,
    });

    console.log(
      "[REGISTER] Creating user with referredBy:",
      validatedReferredBy || "(none)",
    );

    const notes = new Notes({
      uniqueId,
      email,
    });

    await user.save();
    await notes.save();

    // ✅ Sync user to Resend contacts for bulk emails
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    try {
      await addContactToAudience({
        email,
        firstName,
        lastName
      });
    } catch (contactError) {
      console.error('[REGISTER] Non-blocking: Failed to add contact to Resend:', contactError);
    }

    // ✅ Track referrals
    if (referralCode || couponCode) {
      try {
        const Affiliate = await getAffiliateModel();
        const Referral = await getReferralModel();

        let affiliate = affiliateReferrer;
        let isAffiliateReferral = !!affiliateReferrer;

        // Check coupon code for affiliate if not already found via referralCode
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
            if (affiliate) {
              isAffiliateReferral = true;
            }
          }
        }

        // Create referral record for affiliate referrals
        if (affiliate) {
          console.log("[REGISTER] Attempting to store affiliate referral...");
          const referralRecord = new Referral({
            uniqueId: generateReferralUniqueId(),
            affiliateId: affiliate.uniqueId,
            referredUserId: uniqueId,
            referralCode: referralCode || "",
            couponCode: couponCode || "",
            status: "signed_up",
            source: "registration",
          });

          await referralRecord.save();
          console.log(
            `[REGISTER] ✅ Affiliate referral stored in DB: ${referralRecord.uniqueId}`,
          );

          if (affiliate.status === "approved") {
            await Affiliate.updateOne(
              { uniqueId: affiliate.uniqueId },
              { $inc: { totalReferrals: 1 }, $set: { updatedAt: new Date() } },
            );
            console.log(
              `[REGISTER] ✅ Affiliate stats updated: ${affiliate.referralCode}`,
            );
          } else {
            console.log(
              `[REGISTER] ℹ️ Affiliate stats NOT updated (status is ${affiliate.status})`,
            );
          }
        }
        // Create referral record for user-to-user referrals
        else if (referrerUser && !isAffiliateReferral) {
          console.log(
            "[REGISTER] Attempting to store user-to-user referral...",
          );
          const referralRecord = new Referral({
            uniqueId: generateReferralUniqueId(),
            affiliateId: referrerUser.uniqueId,
            referredUserId: uniqueId,
            referralCode: referralCode || "",
            couponCode: couponCode || "",
            status: "signed_up",
            source: "user_referral",
          });

          await referralRecord.save();
          console.log(
            `[REGISTER] ✅ User-to-user referral stored in DB: ${referralRecord.uniqueId}`,
          );
        } else {
          console.log("[REGISTER] ℹ️ No referral tracking record created");
        }
      } catch (affiliateError) {
        console.error(
          "[REGISTER] ❌ Referral tracking error (non-blocking):",
          affiliateError,
        );
      }
    }

    // ✅ Send verification email using Resend with React Email template
    const verificationUrl = `https://app.projournx.com/verify?t=${signUpVerificationToken}`;
    await sendEmail({
      to: email,
      subject: "Email Verification: ProJournX",
      react: VerificationEmail({ verificationUrl }),
    });

    return NextResponse.json(
      { message: "Registration successful. Verification email sent." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
