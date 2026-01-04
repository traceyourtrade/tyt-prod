import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserModel } from "@/models/main/user.model";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ProJournX")?.value;

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as { _id: string };
    
    const User = await getUserModel();
    const currentUser = await User.findById(decoded._id);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!currentUser.referralCode) {
      return NextResponse.json({
        referralCode: null,
        referrals: [],
        stats: { total: 0, thisMonth: 0 }
      });
    }

    const referredUsers = await User.find({ referredBy: currentUser.referralCode })
      .select('fullName email date referralCode')
      .sort({ date: -1 })
      .limit(100);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = referredUsers.filter(
      (u) => new Date(u.date) >= startOfMonth
    ).length;

    const referrals = referredUsers.map((user: any) => ({
      id: user._id.toString(),
      name: user.fullName,
      email: user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'N/A',
      joinedAt: user.date,
    }));

    return NextResponse.json({
      referralCode: currentUser.referralCode,
      referralLink: `https://app.projournx.com/signup?ref=${currentUser.referralCode}`,
      referrals,
      stats: {
        total: referrals.length,
        thisMonth: thisMonthCount,
      }
    });

  } catch (error) {
    console.error("Referrals API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
