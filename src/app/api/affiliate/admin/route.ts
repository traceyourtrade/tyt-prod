import { NextResponse } from "next/server";
import { getAffiliateModel } from "@/models/main/affiliate.model";
import { getReferralModel } from "@/models/main/referral.model";
import { getCommissionModel } from "@/models/main/commission.model";
import { getAffiliateCouponModel } from "@/models/main/affiliateCoupon.model";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function verifyAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get("x-admin-api-key");
  return authHeader === ADMIN_API_KEY && !!ADMIN_API_KEY;
}

export async function GET(req: Request) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const Affiliate = await getAffiliateModel();
    const Referral = await getReferralModel();
    const Commission = await getCommissionModel();
    const AffiliateCoupon = await getAffiliateCouponModel();

    const affiliates = await Affiliate.find().sort({ createdAt: -1 });

    const enrichedAffiliates = await Promise.all(
      affiliates.map(async (aff) => {
        const referralCount = await Referral.countDocuments({ affiliateId: aff.uniqueId });
        const conversionCount = await Referral.countDocuments({ affiliateId: aff.uniqueId, status: 'converted' });
        const pendingCommissions = await Commission.aggregate([
          { $match: { affiliateId: aff.uniqueId, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(res => res[0]?.total || 0);
        const coupons = await AffiliateCoupon.find({ affiliateId: aff.uniqueId });

        return {
          ...aff.toObject(),
          referralCount,
          conversionCount,
          pendingCommissions,
          coupons,
        };
      })
    );

    const stats = {
      totalAffiliates: affiliates.length,
      activeAffiliates: affiliates.filter(a => a.status === 'approved').length,
      pendingAffiliates: affiliates.filter(a => a.status === 'pending').length,
      totalReferrals: await Referral.countDocuments(),
      totalConversions: await Referral.countDocuments({ status: 'converted' }),
      totalCommissionsPaid: await Commission.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(res => res[0]?.total || 0),
      pendingPayouts: await Commission.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(res => res[0]?.total || 0),
    };

    return NextResponse.json({
      affiliates: enrichedAffiliates,
      stats
    }, { status: 200 });

  } catch (error) {
    console.error("Admin affiliate GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { affiliateId, action, data } = await req.json();

    if (!affiliateId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const Affiliate = await getAffiliateModel();

    if (action === 'update_status') {
      await Affiliate.updateOne(
        { uniqueId: affiliateId },
        { $set: { status: data.status, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: "Status updated" }, { status: 200 });
    }

    if (action === 'update_tier') {
      await Affiliate.updateOne(
        { uniqueId: affiliateId },
        { $set: { tier: data.tier, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: "Tier updated" }, { status: 200 });
    }

    if (action === 'update_commission_rate') {
      await Affiliate.updateOne(
        { uniqueId: affiliateId },
        { $set: { commissionRate: data.commissionRate, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: "Commission rate updated" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Admin affiliate PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
