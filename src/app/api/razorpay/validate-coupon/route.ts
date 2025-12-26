import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface CouponConfig {
  code: string;
  offerId: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscount?: number;
  description: string;
  validFor: ('monthly' | 'yearly')[];
  expiresAt?: Date;
  usageLimit?: number;
  usageCount?: number;
}

const VALID_COUPONS: CouponConfig[] = [
  {
    code: "WELCOME20",
    offerId: process.env.RAZORPAY_OFFER_WELCOME20 || "", 
    discountType: "percentage",
    discountValue: 20,
    maxDiscount: 500,
    description: "20% off your first subscription",
    validFor: ["monthly", "yearly"],
  },
  {
    code: "YEARLY50",
    offerId: process.env.RAZORPAY_OFFER_YEARLY50 || "",
    discountType: "flat",
    discountValue: 500,
    description: "₹500 off yearly plan",
    validFor: ["yearly"],
  },
  {
    code: "TRADER10",
    offerId: process.env.RAZORPAY_OFFER_TRADER10 || "",
    discountType: "percentage",
    discountValue: 10,
    description: "10% off for traders",
    validFor: ["monthly", "yearly"],
  },
];

export function getCouponByCode(code: string): CouponConfig | undefined {
  return VALID_COUPONS.find(c => c.code.toUpperCase() === code.toUpperCase());
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      jwt.verify(token, process.env.SECRET_KEY as string);
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const body = await request.json();
    const { couponCode, billingPeriod } = body;

    if (!couponCode) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = VALID_COUPONS.find(
      c => c.code.toUpperCase() === couponCode.toUpperCase()
    );

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    if (!coupon.validFor.includes(billingPeriod)) {
      return NextResponse.json({ 
        error: `This coupon is only valid for ${coupon.validFor.join(" or ")} billing` 
      }, { status: 400 });
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    const monthlyPrice = 849;
    const yearlyPrice = 8199;
    const basePrice = billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
    
    let discountAmount: number;
    if (coupon.discountType === 'percentage') {
      discountAmount = (basePrice * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, basePrice - 1);

    const finalPrice = basePrice - discountAmount;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      offerId: coupon.offerId || null,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Number(discountAmount.toFixed(2)),
      originalPrice: Number(basePrice.toFixed(2)),
      finalPrice: Number(finalPrice.toFixed(2)),
      description: coupon.description,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
