import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";
import { getCommissionModel } from "@/models/main/commission.model";
import { getAffiliateCouponModel } from "@/models/main/affiliateCoupon.model";

const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const generateUniqueId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken");
    const userId = cookieStore.get("userId")?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const Affiliate = await getAffiliateModel();
    const Referral = await getReferralModel();
    const Commission = await getCommissionModel();
    const AffiliateCoupon = await getAffiliateCouponModel();

    const affiliate = await Affiliate.findOne({ userId });

    if (!affiliate) {
      return NextResponse.json({ 
        isAffiliate: false,
        message: "Not enrolled in affiliate program" 
      }, { status: 200 });
    }

    const referrals = await Referral.find({ affiliateId: affiliate.uniqueId })
      .sort({ createdAt: -1 })
      .limit(50);

    const commissions = await Commission.find({ affiliateId: affiliate.uniqueId })
      .sort({ createdAt: -1 })
      .limit(50);

    const coupons = await AffiliateCoupon.find({ affiliateId: affiliate.uniqueId });

    const stats = {
      totalClicks: await Referral.countDocuments({ affiliateId: affiliate.uniqueId }),
      totalSignups: await Referral.countDocuments({ affiliateId: affiliate.uniqueId, status: { $in: ['signed_up', 'converted'] } }),
      totalConversions: await Referral.countDocuments({ affiliateId: affiliate.uniqueId, status: 'converted' }),
      pendingCommissions: await Commission.aggregate([
        { $match: { affiliateId: affiliate.uniqueId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(res => res[0]?.total || 0),
      paidCommissions: await Commission.aggregate([
        { $match: { affiliateId: affiliate.uniqueId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(res => res[0]?.total || 0),
    };

    return NextResponse.json({
      isAffiliate: true,
      affiliate: {
        uniqueId: affiliate.uniqueId,
        referralCode: affiliate.referralCode,
        status: affiliate.status,
        tier: affiliate.tier,
        commissionRate: affiliate.commissionRate,
        totalEarnings: affiliate.totalEarnings,
        pendingEarnings: affiliate.pendingEarnings,
        paidEarnings: affiliate.paidEarnings,
        totalReferrals: affiliate.totalReferrals,
        activeReferrals: affiliate.activeReferrals,
        createdAt: affiliate.createdAt,
      },
      referrals,
      commissions,
      coupons,
      stats
    }, { status: 200 });

  } catch (error) {
    console.error("Affiliate GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken");
    const userId = cookieStore.get("userId")?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const Affiliate = await getAffiliateModel();

    const existingAffiliate = await Affiliate.findOne({ userId });
    if (existingAffiliate) {
      return NextResponse.json({ 
        error: "Already enrolled in affiliate program",
        affiliate: existingAffiliate 
      }, { status: 409 });
    }

    let referralCode: string;
    while (true) {
      referralCode = generateReferralCode();
      const exists = await Affiliate.findOne({ referralCode });
      if (!exists) break;
    }

    const uniqueId = generateUniqueId();

    const newAffiliate = new Affiliate({
      uniqueId,
      userId,
      referralCode,
      status: 'approved',
      tier: 'bronze',
      commissionRate: 20,
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      totalReferrals: 0,
      activeReferrals: 0,
    });

    await newAffiliate.save();

    return NextResponse.json({
      success: true,
      message: "Successfully joined affiliate program",
      affiliate: {
        uniqueId: newAffiliate.uniqueId,
        referralCode: newAffiliate.referralCode,
        status: newAffiliate.status,
        tier: newAffiliate.tier,
        commissionRate: newAffiliate.commissionRate,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Affiliate POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
