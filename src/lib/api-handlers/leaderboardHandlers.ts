import { NextRequest, NextResponse } from 'next/server';
import { 
  getLeaderboardEntryModel, 
  getLeaderboardSettingsModel,
  LeaderboardCategory,
  LeaderboardPeriod 
} from '@/models/main/leaderboard.model';
import { getUserModel } from '@/models/main/user.model';
import { getManualModel } from '@/models/accounts/manual.model';

export async function getLeaderboardHandler(
  req: NextRequest
) {
  try {
    const url = new URL(req.url);
    const category = (url.searchParams.get('category') || 'consistency') as LeaderboardCategory;
    const period = (url.searchParams.get('period') || 'weekly') as LeaderboardPeriod;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const LeaderboardEntry = await getLeaderboardEntryModel();
    
    const entries = await LeaderboardEntry.find({ category, period })
      .sort({ rank: 1 })
      .limit(limit);

    return NextResponse.json({ 
      entries,
      category,
      period
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

export async function getUserRankHandler(
  req: NextRequest,
  userId: string,
  token: string
) {
  try {
    const LeaderboardEntry = await getLeaderboardEntryModel();
    const LeaderboardSettings = await getLeaderboardSettingsModel();

    const settings = await LeaderboardSettings.findOne({ uniqueId: userId });
    
    if (!settings || !settings.optedIn) {
      return NextResponse.json({ 
        optedIn: false,
        message: "You have not opted into the leaderboard"
      });
    }

    const categories: LeaderboardCategory[] = ['consistency', 'rMultiple', 'winRate', 'profitFactor'];
    const periods: LeaderboardPeriod[] = ['weekly', 'monthly', 'allTime'];

    const rankings: any = {};

    for (const category of categories) {
      rankings[category] = {};
      for (const period of periods) {
        const entry = await LeaderboardEntry.findOne({ uniqueId: userId, category, period });
        rankings[category][period] = entry ? {
          rank: entry.rank,
          score: entry.score,
          previousRank: entry.previousRank,
          tradeCount: entry.tradeCount
        } : null;
      }
    }

    return NextResponse.json({ 
      optedIn: true,
      settings,
      rankings
    });
  } catch (error) {
    console.error("Error fetching user rank:", error);
    return NextResponse.json({ error: "Failed to fetch user rank" }, { status: 500 });
  }
}

export async function updateLeaderboardSettingsHandler(
  req: NextRequest,
  userId: string,
  token: string
) {
  try {
    const body = await req.json();
    const { optedIn, displayName, useAnonymousName, showInWeekly, showInMonthly, showInAllTime } = body;

    const LeaderboardSettings = await getLeaderboardSettingsModel();
    const User = await getUserModel();

    const user = await User.findOne({ uniqueId: userId });
    const defaultDisplayName = user?.fullName || "Anonymous Trader";
    
    const finalDisplayName = (displayName && displayName.trim()) ? displayName.trim() : defaultDisplayName;

    const existingSettings = await LeaderboardSettings.findOne({ uniqueId: userId });

    if (existingSettings) {
      const updateFields: any = {};
      if (optedIn !== undefined) updateFields.optedIn = optedIn;
      updateFields.displayName = finalDisplayName;
      if (useAnonymousName !== undefined) updateFields.useAnonymousName = useAnonymousName;
      if (showInWeekly !== undefined) updateFields.showInWeekly = showInWeekly;
      if (showInMonthly !== undefined) updateFields.showInMonthly = showInMonthly;
      if (showInAllTime !== undefined) updateFields.showInAllTime = showInAllTime;

      await LeaderboardSettings.updateOne({ uniqueId: userId }, { $set: updateFields });
    } else {
      const newSettings = new LeaderboardSettings({
        uniqueId: userId,
        optedIn: optedIn !== false,
        displayName: finalDisplayName,
        useAnonymousName: useAnonymousName || false,
        showInWeekly: showInWeekly !== false,
        showInMonthly: showInMonthly !== false,
        showInAllTime: showInAllTime !== false
      });
      await newSettings.save();
    }

    if (optedIn) {
      await calculateUserRankings(userId);
    }

    return NextResponse.json({ message: "Leaderboard settings updated successfully" });
  } catch (error) {
    console.error("Error updating leaderboard settings:", error);
    return NextResponse.json({ error: "Failed to update leaderboard settings" }, { status: 500 });
  }
}

async function calculateUserRankings(userId: string) {
  try {
    const Manual = await getManualModel();
    const User = await getUserModel();
    const LeaderboardEntry = await getLeaderboardEntryModel();
    const LeaderboardSettings = await getLeaderboardSettingsModel();

    const user = await User.findOne({ uniqueId: userId });
    const settings = await LeaderboardSettings.findOne({ uniqueId: userId });
    
    if (!user || !settings) return;

    const trades = await Manual.find({ uniqueId: userId });
    const allTradeData = trades.flatMap(t => t.tradeData || []);

    if (allTradeData.length < 5) return;

    const displayName = settings.useAnonymousName 
      ? `Trader${userId.slice(-4)}` 
      : settings.displayName || user.fullName;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filterByPeriod = (trade: any, period: LeaderboardPeriod) => {
      const tradeDate = new Date(trade.closeDate || trade.date);
      if (period === 'weekly') return tradeDate >= weekAgo;
      if (period === 'monthly') return tradeDate >= monthAgo;
      return true;
    };

    const calculateMetrics = (tradeList: any[]) => {
      if (tradeList.length === 0) return null;

      const wins = tradeList.filter(t => (t.pnl || 0) > 0);
      const losses = tradeList.filter(t => (t.pnl || 0) < 0);
      
      const winRate = (wins.length / tradeList.length) * 100;
      
      const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
      const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length) : 1;
      const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin;

      const rMultiples = tradeList.map(t => {
        const risk = t.riskAmount || Math.abs(t.pnl || 0);
        return risk > 0 ? (t.pnl || 0) / risk : 0;
      });
      const avgRMultiple = rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length;

      const dailyPnL = tradeList.reduce((acc: any, t) => {
        const date = new Date(t.closeDate || t.date).toDateString();
        acc[date] = (acc[date] || 0) + (t.pnl || 0);
        return acc;
      }, {});
      const dailyValues = Object.values(dailyPnL) as number[];
      const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
      const variance = dailyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyValues.length;
      const consistency = 100 - Math.min(Math.sqrt(variance) / (Math.abs(mean) || 1) * 10, 100);

      return {
        winRate: Math.round(winRate * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        rMultiple: Math.round(avgRMultiple * 100) / 100,
        consistency: Math.round(Math.max(0, consistency) * 100) / 100,
        tradeCount: tradeList.length
      };
    };

    const periods: LeaderboardPeriod[] = ['weekly', 'monthly', 'allTime'];
    const categories: LeaderboardCategory[] = ['consistency', 'rMultiple', 'winRate', 'profitFactor'];

    for (const period of periods) {
      const periodTrades = allTradeData.filter(t => filterByPeriod(t, period));
      const metrics = calculateMetrics(periodTrades);
      
      if (!metrics || metrics.tradeCount < 5) continue;

      for (const category of categories) {
        const score = metrics[category as keyof typeof metrics] as number;
        
        const existingEntry = await LeaderboardEntry.findOne({ uniqueId: userId, category, period });
        
        if (existingEntry) {
          await LeaderboardEntry.updateOne(
            { uniqueId: userId, category, period },
            { 
              $set: { 
                score,
                displayName,
                avatarUrl: user.profilePicture,
                tradeCount: metrics.tradeCount,
                previousRank: existingEntry.rank
              }
            }
          );
        } else {
          const newEntry = new LeaderboardEntry({
            uniqueId: userId,
            displayName,
            avatarUrl: user.profilePicture,
            category,
            period,
            score,
            rank: 0,
            tradeCount: metrics.tradeCount,
            previousRank: null
          });
          await newEntry.save();
        }
      }
    }

    await recalculateAllRanks();
  } catch (error) {
    console.error("Error calculating user rankings:", error);
  }
}

async function recalculateAllRanks() {
  try {
    const LeaderboardEntry = await getLeaderboardEntryModel();
    const categories: LeaderboardCategory[] = ['consistency', 'rMultiple', 'winRate', 'profitFactor'];
    const periods: LeaderboardPeriod[] = ['weekly', 'monthly', 'allTime'];

    for (const category of categories) {
      for (const period of periods) {
        const entries = await LeaderboardEntry.find({ category, period }).sort({ score: -1 });
        
        for (let i = 0; i < entries.length; i++) {
          await LeaderboardEntry.updateOne(
            { _id: entries[i]._id },
            { $set: { rank: i + 1 } }
          );
        }
      }
    }
  } catch (error) {
    console.error("Error recalculating ranks:", error);
  }
}

export async function getLeaderboardSettingsHandler(
  req: NextRequest,
  userId: string,
  token: string
) {
  try {
    const LeaderboardSettings = await getLeaderboardSettingsModel();
    const User = await getUserModel();

    const settings = await LeaderboardSettings.findOne({ uniqueId: userId });
    const user = await User.findOne({ uniqueId: userId });

    if (!settings) {
      return NextResponse.json({
        optedIn: false,
        displayName: user?.fullName || "Anonymous Trader",
        useAnonymousName: false,
        showInWeekly: true,
        showInMonthly: true,
        showInAllTime: true
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching leaderboard settings:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard settings" }, { status: 500 });
  }
}
