import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserModel } from '@/models/main/user.model';

interface JWTPayload {
  _id: string;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('jwt')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY as string) as JWTPayload;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const {
      isPublic,
      showEquityCurve,
      showMonthlyPnL,
      showWinRate,
      showProfitFactor,
      showTotalTrades,
      showTotalPnL,
      hideDollarAmounts,
      customUsername
    } = body;

    const User = await getUserModel();
    const user = await User.findById(decoded._id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (customUsername && customUsername !== user.publicProfile?.customUsername) {
      const existingUser = await User.findOne({
        'publicProfile.customUsername': customUsername,
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }

      const reservedUsernames = ['admin', 'profile', 'settings', 'api', 'dashboard', 'login', 'signup'];
      if (reservedUsernames.includes(customUsername.toLowerCase())) {
        return NextResponse.json({ error: "This username is reserved" }, { status: 400 });
      }
    }

    user.publicProfile = {
      isPublic: Boolean(isPublic),
      showEquityCurve: Boolean(showEquityCurve),
      showMonthlyPnL: Boolean(showMonthlyPnL),
      showWinRate: Boolean(showWinRate),
      showProfitFactor: Boolean(showProfitFactor),
      showTotalTrades: Boolean(showTotalTrades),
      showTotalPnL: Boolean(showTotalPnL),
      hideDollarAmounts: Boolean(hideDollarAmounts),
      customUsername: customUsername || undefined
    };

    await user.save();

    return NextResponse.json({ 
      success: true, 
      publicProfile: user.publicProfile 
    });
  } catch (error) {
    console.error("Error updating public profile:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
