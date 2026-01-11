import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
