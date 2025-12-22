import { NextResponse } from "next/server";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";

const generateUniqueId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export async function POST(req: Request) {
  try {
    const { referralCode, couponCode, userId, action, ipAddress, userAgent, source } = await req.json();

    if (!referralCode && !couponCode) {
      return NextResponse.json({ error: "No referral or coupon code provided" }, { status: 400 });
    }

    const Affiliate = await getAffiliateModel();
    const Referral = await getReferralModel();

    let affiliate;
    
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

    if (!affiliate) {
      return NextResponse.json({ error: "Invalid referral or coupon code" }, { status: 404 });
    }

    if (action === 'click') {
      const referral = new Referral({
        uniqueId: generateUniqueId(),
        affiliateId: affiliate.uniqueId,
        referredUserId: '',
        referralCode: referralCode || '',
        couponCode: couponCode || '',
        status: 'clicked',
        ipAddress,
        userAgent,
        source,
      });
      await referral.save();

      return NextResponse.json({ 
        success: true, 
        message: "Click tracked",
        affiliateId: affiliate.uniqueId 
      }, { status: 200 });
    }

    if (action === 'signup' && userId) {
      const existingReferral = await Referral.findOne({ 
        affiliateId: affiliate.uniqueId,
        ipAddress,
        status: 'clicked'
      }).sort({ createdAt: -1 });

      if (existingReferral) {
        existingReferral.referredUserId = userId;
        existingReferral.status = 'signed_up';
        existingReferral.updatedAt = new Date();
        await existingReferral.save();
      } else {
        const referral = new Referral({
          uniqueId: generateUniqueId(),
          affiliateId: affiliate.uniqueId,
          referredUserId: userId,
          referralCode: referralCode || '',
          couponCode: couponCode || '',
          status: 'signed_up',
          ipAddress,
          userAgent,
          source,
        });
        await referral.save();
      }

      await Affiliate.updateOne(
        { uniqueId: affiliate.uniqueId },
        { $inc: { totalReferrals: 1 }, $set: { updatedAt: new Date() } }
      );

      return NextResponse.json({ 
        success: true, 
        message: "Signup tracked" 
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Referral tracking error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
