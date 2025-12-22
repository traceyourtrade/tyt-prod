import { NextResponse } from "next/server";
import { getAffiliateCouponModel } from "@/models/main/affiliateCoupon.model";
import { getAffiliateModel } from "@/models/main/affiliate.model";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function verifyAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get("x-admin-api-key");
  return authHeader === ADMIN_API_KEY && !!ADMIN_API_KEY;
}

const generateUniqueId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export async function GET(req: Request) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const AffiliateCoupon = await getAffiliateCouponModel();
    const Affiliate = await getAffiliateModel();

    const coupons = await AffiliateCoupon.find().sort({ createdAt: -1 });

    const enrichedCoupons = await Promise.all(
      coupons.map(async (coupon) => {
        const affiliate = await Affiliate.findOne({ uniqueId: coupon.affiliateId });
        return {
          ...coupon.toObject(),
          affiliateReferralCode: affiliate?.referralCode || 'N/A',
        };
      })
    );

    return NextResponse.json({ coupons: enrichedCoupons }, { status: 200 });

  } catch (error) {
    console.error("Admin coupons GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { affiliateId, code, discountPercent, discountType, usageLimit, expiresAt, description } = await req.json();

    if (!affiliateId || !code || discountPercent === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const AffiliateCoupon = await getAffiliateCouponModel();
    const Affiliate = await getAffiliateModel();

    const affiliate = await Affiliate.findOne({ uniqueId: affiliateId });
    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const existingCoupon = await AffiliateCoupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }

    const newCoupon = new AffiliateCoupon({
      uniqueId: generateUniqueId(),
      affiliateId,
      code: code.toUpperCase(),
      discountPercent,
      discountType: discountType || 'percentage',
      usageLimit: usageLimit || null,
      usageCount: 0,
      status: 'active',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      description,
    });

    await newCoupon.save();

    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      coupon: newCoupon
    }, { status: 201 });

  } catch (error) {
    console.error("Admin coupons POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { couponId, updates } = await req.json();

    if (!couponId) {
      return NextResponse.json({ error: "Missing coupon ID" }, { status: 400 });
    }

    const AffiliateCoupon = await getAffiliateCouponModel();

    const allowedUpdates = ['discountPercent', 'discountType', 'usageLimit', 'status', 'expiresAt', 'description'];
    const sanitizedUpdates: Record<string, any> = { updatedAt: new Date() };
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    await AffiliateCoupon.updateOne(
      { uniqueId: couponId },
      { $set: sanitizedUpdates }
    );

    return NextResponse.json({ success: true, message: "Coupon updated" }, { status: 200 });

  } catch (error) {
    console.error("Admin coupons PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!verifyAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const couponId = searchParams.get("couponId");

    if (!couponId) {
      return NextResponse.json({ error: "Missing coupon ID" }, { status: 400 });
    }

    const AffiliateCoupon = await getAffiliateCouponModel();
    await AffiliateCoupon.deleteOne({ uniqueId: couponId });

    return NextResponse.json({ success: true, message: "Coupon deleted" }, { status: 200 });

  } catch (error) {
    console.error("Admin coupons DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
