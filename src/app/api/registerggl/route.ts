// app/api/registerggl/route.ts // changes
import { NextRequest, NextResponse } from "next/server";

import { getUserModel } from "@/models/main/user.model";
import { getNoteModel } from "@/models/main/notes.model";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";
import { GoogleAuthRequest, UserData, NotesData } from "@/types/auth";
import { activateTrial } from "@/lib/subscription";

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const User = await getUserModel();
    const Notes = await getNoteModel();
    const body: GoogleAuthRequest & {
      referralCode?: string;
      couponCode?: string;
    } = await request.json();
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
    } = body;

    console.log("[GOOGLE SIGNUP] New signup request:", {
      email,
      referralCode,
      couponCode,
    });

    console.log("Registration data:", {
      email,
      fullName,
      phone,
      countryCode,
      country,
    });

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
        { error: "Passwords don't match" },
        { status: 400 },
      );
    }

    const isUser = await User.findOne({ email });

    if (!isUser) {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      const generateRandomCode = (): string => {
        let uniqueId = "";
        for (let i = 0; i < 12; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          uniqueId += characters[randomIndex];
        }
        return uniqueId;
      };

      const generateUniqueCode = async (): Promise<string> => {
        let uniqueId: string;
        let isUserId: any;

        do {
          uniqueId = generateRandomCode();
          isUserId = await User.findOne({ uniqueId });
        } while (isUserId);

        return uniqueId;
      };

      const uniqueId = await generateUniqueCode();

      // Generate unique referral code for this user
      let userReferralCode: string;
      while (true) {
        const code = generateUserReferralCode();
        const exists = await User.findOne({ referralCode: code });
        if (!exists) {
          userReferralCode = code;
          break;
        }
      }

      // Validate referral code if provided
      let validatedReferredBy: string | undefined;
      let referrerUser = null;
      let affiliateReferrer = null;

      if (referralCode) {
        const normalizedCode = referralCode.toUpperCase();
        console.log(
          "[GOOGLE SIGNUP] Validating referral code:",
          normalizedCode,
        );

        referrerUser = await User.findOne({ referralCode: normalizedCode });
        if (referrerUser)
          console.log(
            "[GOOGLE SIGNUP] Referrer user found:",
            referrerUser.uniqueId,
          );

        const Affiliate = await getAffiliateModel();
        affiliateReferrer = await Affiliate.findOne({
          referralCode: normalizedCode,
        });
        if (affiliateReferrer)
          console.log(
            "[GOOGLE SIGNUP] Affiliate referrer found (status:",
            affiliateReferrer.status,
            "):",
            affiliateReferrer.uniqueId,
          );

        if (referrerUser || affiliateReferrer) {
          validatedReferredBy = normalizedCode;
          console.log(
            "[GOOGLE SIGNUP] ✅ Referral code validated. Type:",
            affiliateReferrer ? "Affiliate" : "User",
          );
        } else {
          console.log(
            "[GOOGLE SIGNUP] ❌ Referral code not found in any collection:",
            normalizedCode,
          );
        }
      }

      // 3-day free trial for new users
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);
      
      const userData: UserData = {
        isEmailVerified: true,
        uniqueId,
        email,
        fullName,
        phone,
        password,
        cpassword,
        countryCode,
        country,
        referralCode: userReferralCode,
        referredBy: validatedReferredBy,
        subscription: {
          isSubscribed: false,
          trialEndsAt,
          trialUsed: false,
          subscriptionStatus: "pending",
        },
      };

      console.log(
        "[GOOGLE SIGNUP] Creating user with referredBy:",
        validatedReferredBy || "(none)",
      );

      const notesData: NotesData = {
        uniqueId,
        email,
      };

      const user = new User(userData);
      const notes = new Notes(notesData);

      await user.save();
      await notes.save();

      // ✅ Track referrals
      if (referralCode || couponCode) {
        try {
          const Affiliate = await getAffiliateModel();
          const Referral = await getReferralModel();

          let affiliate = affiliateReferrer;
          let isAffiliateReferral = !!affiliateReferrer;

          // Check coupon code for affiliate if not already found
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
            console.log(
              "[GOOGLE SIGNUP] Attempting to store affiliate referral...",
            );
            const referralRecord = new Referral({
              uniqueId: generateReferralUniqueId(),
              affiliateId: affiliate.uniqueId,
              referredUserId: uniqueId,
              referralCode: referralCode || "",
              couponCode: couponCode || "",
              status: "signed_up",
              source: "google_registration",
            });

            await referralRecord.save();
            console.log(
              `[GOOGLE SIGNUP] ✅ Affiliate referral stored in DB: ${referralRecord.uniqueId}`,
            );

            if (affiliate.status === "approved") {
              await Affiliate.updateOne(
                { uniqueId: affiliate.uniqueId },
                {
                  $inc: { totalReferrals: 1 },
                  $set: { updatedAt: new Date() },
                },
              );
              console.log(
                `[GOOGLE SIGNUP] ✅ Affiliate stats updated: ${affiliate.referralCode}`,
              );
            } else {
              console.log(
                `[GOOGLE SIGNUP] ℹ️ Affiliate stats NOT updated (status is ${affiliate.status})`,
              );
            }
          }
          // Create referral record for user-to-user referrals
          else if (referrerUser && !isAffiliateReferral) {
            console.log(
              "[GOOGLE SIGNUP] Attempting to store user-to-user referral...",
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
              `[GOOGLE SIGNUP] ✅ User-to-user referral stored in DB: ${referralRecord.uniqueId}`,
            );
          } else {
            console.log(
              "[GOOGLE SIGNUP] ℹ️ No referral tracking record created",
            );
          }
        } catch (affiliateError) {
          console.error(
            "[GOOGLE SIGNUP] ❌ Referral tracking error:",
            affiliateError,
          );
        }
      }

      const isRegistered = await User.findOne({ email });

      if (isRegistered) {
        const token = await isRegistered.generateAuthToken();

        const response = NextResponse.json({
          msg: "registered user",
          message: token,
          id: isRegistered.uniqueId,
          name: isRegistered.fullName.split(" ")[0],
        });

        // Set cookie in response
        const fiveDays = 5 * 24 * 60 * 60;
        response.cookies.set("authToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: fiveDays,
          path: "/",
        });
        response.cookies.set({
          name: "userId",
          value: user.uniqueId,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: fiveDays,
          path: "/",
        });

        return response;
      } else {
        return NextResponse.json(
          { error: "Registration failed" },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "email already registered" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
