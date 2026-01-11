import { NextRequest, NextResponse } from 'next/server';
import { getUserModel, IUserAccount } from '@/models/main/user.model';
import { getManualModel } from '@/models/accounts/manual.model';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const User = await getUserModel();
    const Manual = await getManualModel();

    const user = await User.findOne({
      $or: [
        { 'publicProfile.customUsername': username },
        { uniqueId: username }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!user.publicProfile?.isPublic) {
      return NextResponse.json({ error: "This profile is private" }, { status: 403 });
    }

    const trades = await Manual.find({ uniqueId: user.uniqueId });
    const allTradeData = trades.flatMap(t => t.tradeData || []);

    const hasVerifiedAccounts = user.accounts.some((acc: IUserAccount) => acc.investorId);

    const totalTrades = allTradeData.length;
    const wins = allTradeData.filter(t => (t.pnl || 0) > 0);
    const losses = allTradeData.filter(t => (t.pnl || 0) < 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const totalPnL = allTradeData.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length) : 1;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin;

    const monthlyPnL: { [key: string]: number } = {};
    allTradeData.forEach(trade => {
      const date = new Date(trade.closeDate || trade.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyPnL[key] = (monthlyPnL[key] || 0) + (trade.pnl || 0);
    });

    const monthlyPnLData = Object.entries(monthlyPnL)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, pnl]) => ({ month, pnl }));

    const sortedTrades = [...allTradeData].sort((a, b) => {
      const dateA = new Date(a.closeDate || a.date).getTime();
      const dateB = new Date(b.closeDate || b.date).getTime();
      return dateA - dateB;
    });

    let cumulativePnL = 0;
    const equityCurveData = sortedTrades.map((trade, index) => {
      cumulativePnL += (trade.pnl || 0);
      return {
        tradeNumber: index + 1,
        equity: cumulativePnL,
        date: trade.closeDate || trade.date
      };
    });

    const publicProfile = user.publicProfile;
    const response: any = {
      displayName: user.fullName,
      profilePicture: user.profilePicture || null,
      bio: user.bio || null,
      isVerified: hasVerifiedAccounts,
      memberSince: user.date,
      settings: {
        showEquityCurve: publicProfile.showEquityCurve,
        showMonthlyPnL: publicProfile.showMonthlyPnL,
        showWinRate: publicProfile.showWinRate,
        showProfitFactor: publicProfile.showProfitFactor,
        showTotalTrades: publicProfile.showTotalTrades,
        showTotalPnL: publicProfile.showTotalPnL,
        hideDollarAmounts: publicProfile.hideDollarAmounts
      },
      stats: {}
    };

    if (publicProfile.showTotalTrades) {
      response.stats.totalTrades = totalTrades;
    }

    if (publicProfile.showWinRate) {
      response.stats.winRate = Math.round(winRate * 100) / 100;
    }

    if (publicProfile.showProfitFactor) {
      response.stats.profitFactor = Math.round(profitFactor * 100) / 100;
    }

    if (publicProfile.showTotalPnL) {
      response.stats.totalPnL = publicProfile.hideDollarAmounts ? null : Math.round(totalPnL * 100) / 100;
      response.stats.totalPnLHidden = publicProfile.hideDollarAmounts;
    }

    if (publicProfile.showMonthlyPnL) {
      response.monthlyPnL = publicProfile.hideDollarAmounts 
        ? monthlyPnLData.map(d => ({ ...d, pnl: d.pnl > 0 ? 1 : d.pnl < 0 ? -1 : 0 }))
        : monthlyPnLData;
    }

    if (publicProfile.showEquityCurve) {
      if (publicProfile.hideDollarAmounts && equityCurveData.length > 0) {
        const maxEquity = Math.max(...equityCurveData.map(d => Math.abs(d.equity)), 1);
        response.equityCurve = equityCurveData.map(d => ({
          ...d,
          equity: Math.round((d.equity / maxEquity) * 100)
        }));
      } else {
        response.equityCurve = equityCurveData;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
