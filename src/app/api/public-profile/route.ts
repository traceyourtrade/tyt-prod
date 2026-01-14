import { NextRequest, NextResponse } from 'next/server';
import { getUserModel, IUserAccount } from '@/models/main/user.model';
import { getManualModel } from '@/models/accounts/manual.model';
import { getFileUploadModel } from '@/models/accounts/fileUploadSchema.model';
import { getAutoSyncModel } from '@/models/accounts/autoSync.model';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get('username');
    
    let currentUserUniqueId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { uniqueId: string };
        currentUserUniqueId = decoded.uniqueId;
      }
    } catch (e) {
    }

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const User = await getUserModel();

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

    // Auto-generate referral code for users who don't have one
    if (!user.referralCode) {
      let newCode: string;
      let codeExists = true;
      while (codeExists) {
        newCode = generateReferralCode();
        const existing = await User.findOne({ referralCode: newCode });
        codeExists = !!existing;
      }
      user.referralCode = newCode!;
      await user.save();
    }

    const Manual = await getManualModel();
    const FileUpload = await getFileUploadModel();
    let AutoSync: any = null;
    try {
      AutoSync = await getAutoSyncModel();
    } catch (e) {
    }

    const accountIds = user.accounts.map((acc: any) => acc.accountId);

    const [manualTrades, fileUploadTrades, autoSyncTrades] = await Promise.all([
      Manual.find({ uniqueId: user.uniqueId, accountId: { $in: accountIds } }),
      FileUpload.find({ uniqueId: user.uniqueId, accountId: { $in: accountIds } }),
      AutoSync ? AutoSync.find({ uniqueId: user.uniqueId, accountId: { $in: accountIds } }) : Promise.resolve([])
    ]);

    const allTradeData: any[] = [];

    manualTrades.forEach((tradeDoc: any) => {
      if (tradeDoc.tradeData) {
        allTradeData.push(...tradeDoc.tradeData);
      }
    });

    fileUploadTrades.forEach((tradeDoc: any) => {
      if (tradeDoc.tradeData) {
        allTradeData.push(...tradeDoc.tradeData);
      }
    });

    autoSyncTrades.forEach((tradeDoc: any) => {
      if (tradeDoc.tradeData) {
        allTradeData.push(...tradeDoc.tradeData);
      }
    });

    const hasVerifiedAccounts = user.accounts.some((acc: IUserAccount) => acc.investorId);

    const totalTrades = allTradeData.length;
    const wins = allTradeData.filter((t: any) => (t.Profit || t.pnl || 0) > 0);
    const losses = allTradeData.filter((t: any) => (t.Profit || t.pnl || 0) < 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const totalPnL = allTradeData.reduce((sum: number, t: any) => sum + (t.Profit || t.pnl || 0), 0);

    const totalWins = wins.reduce((sum: number, t: any) => sum + (t.Profit || t.pnl || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum: number, t: any) => sum + (t.Profit || t.pnl || 0), 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? totalWins : 0;

    const monthlyPnL: { [key: string]: number } = {};
    allTradeData.forEach((trade: any) => {
      const date = new Date(trade.CloseTime || trade.closeDate || trade.date);
      if (!isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyPnL[key] = (monthlyPnL[key] || 0) + (trade.Profit || trade.pnl || 0);
      }
    });

    const monthlyPnLData = Object.entries(monthlyPnL)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, pnl]) => ({ month, pnl }));

    const sortedTrades = [...allTradeData].sort((a: any, b: any) => {
      const dateA = new Date(a.CloseTime || a.closeDate || a.date).getTime();
      const dateB = new Date(b.CloseTime || b.closeDate || b.date).getTime();
      return dateA - dateB;
    });

    let cumulativePnL = 0;
    const equityCurveData = sortedTrades.map((trade: any, index: number) => {
      cumulativePnL += (trade.Profit || trade.pnl || 0);
      return {
        tradeNumber: index + 1,
        equity: cumulativePnL,
        date: trade.CloseTime || trade.closeDate || trade.date
      };
    });

    const publicProfile = user.publicProfile;
    const isOwner = currentUserUniqueId === user.uniqueId;
    
    const response: any = {
      displayName: user.fullName,
      profilePicture: user.profilePicture || null,
      bio: user.bio || null,
      isVerified: hasVerifiedAccounts,
      memberSince: user.date,
      isOwner,
      referralCode: user.referralCode || null,
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
