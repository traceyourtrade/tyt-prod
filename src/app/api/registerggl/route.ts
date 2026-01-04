// app/api/registerggl/route.ts // changes
import { NextRequest, NextResponse } from "next/server";

import { getUserModel } from "@/models/main/user.model";
import { getNoteModel } from "@/models/main/notes.model";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";
import { GoogleAuthRequest, UserData, NotesData } from "@/types/auth";
import { activateTrial } from "@/lib/subscription";

const generateReferralUniqueId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const generateUserReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const User = await getUserModel();
    const Notes = await getNoteModel();
    const body: GoogleAuthRequest & { referralCode?: string; couponCode?: string } = await request.json();
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

      // Validate referral code if provided (user-to-user referrals)
      let validatedReferredBy: string | undefined;
      if (referralCode) {
        const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        if (referrer) {
          validatedReferredBy = referralCode.toUpperCase();
        }
      }

      // No trial - users must subscribe to use the app
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
          trialUsed: false,
          subscriptionStatus: 'inactive'
        }
      };

      const notesData: NotesData = {
        uniqueId,
        email,
      };

      const user = new User(userData);
      const notes = new Notes(notesData);

      await user.save();
      await notes.save();

      // ✅ Track affiliate referral if referral code or coupon code is provided
      if (referralCode || couponCode) {
        try {
          const Affiliate = await getAffiliateModel();
          const Referral = await getReferralModel();
          
          let affiliate = null;
          
          if (referralCode) {
            affiliate = await Affiliate.findOne({ referralCode, status: 'approved' });
          }
          
          if (!affiliate && couponCode) {
            const { getAffiliateCouponModel } = await import("@/models/main/affiliateCoupon.model");
            const AffiliateCoupon = await getAffiliateCouponModel();
            const coupon = await AffiliateCoupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
            if (coupon) {
              affiliate = await Affiliate.findOne({ uniqueId: coupon.affiliateId, status: 'approved' });
            }
          }
          
          if (affiliate) {
            const referralEntry = new Referral({
              uniqueId: generateReferralUniqueId(),
              affiliateId: affiliate.uniqueId,
              referredUserId: uniqueId,
              referralCode: referralCode || '',
              couponCode: couponCode || '',
              status: 'signed_up',
              source: 'google_registration',
            });
            await referralEntry.save();
            
            await Affiliate.updateOne(
              { uniqueId: affiliate.uniqueId },
              { $inc: { totalReferrals: 1 }, $set: { updatedAt: new Date() } }
            );
            
            console.log(`Affiliate referral tracked (Google): ${affiliate.referralCode} -> ${uniqueId}`);
          }
        } catch (affiliateError) {
          console.error("Affiliate tracking error (non-blocking):", affiliateError);
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
