import { NextRequest, NextResponse } from 'next/server';
import { getPlaybookModel, IPlaybookEntry, IPlaybookRule, IPlaybookStats } from '@/models/main/playbook.model';
import { getUserModel } from '@/models/main/user.model';
import { getAutoSyncModel } from '@/models/accounts/autoSync.model';
import { getFileUploadModel } from '@/models/accounts/fileUploadSchema.model';
import { getManualModel } from '@/models/accounts/manual.model';
import { getOpenTradeModel } from '@/models/accounts/openTrades.model';

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

async function getAllTradesForUser(uniqueId: string, accountIds: string[]): Promise<any[]> {
  const [FileUpload, Manual, AutoSync, OpenTrades] = await Promise.all([
    getFileUploadModel(),
    getManualModel(),
    getAutoSyncModel(),
    getOpenTradeModel()
  ]);

  const [fileUploadTrades, manualTrades, autoSyncTrades, openTrades] = await Promise.all([
    FileUpload.find({ uniqueId, accountId: { $in: accountIds } }),
    Manual.find({ uniqueId, accountId: { $in: accountIds } }),
    AutoSync.find({ uniqueId, accountId: { $in: accountIds } }),
    OpenTrades.find({ uniqueId, accountId: { $in: accountIds } })
  ]);

  const allTrades: any[] = [];
  
  fileUploadTrades.forEach((doc: any) => {
    if (doc.tradeData && Array.isArray(doc.tradeData)) {
      allTrades.push(...doc.tradeData);
    }
  });
  
  manualTrades.forEach((doc: any) => {
    if (doc.tradeData && Array.isArray(doc.tradeData)) {
      allTrades.push(...doc.tradeData);
    }
  });
  
  autoSyncTrades.forEach((doc: any) => {
    if (doc.tradeData && Array.isArray(doc.tradeData)) {
      allTrades.push(...doc.tradeData);
    }
  });
  
  openTrades.forEach((doc: any) => {
    if (doc.tradeData && Array.isArray(doc.tradeData)) {
      allTrades.push(...doc.tradeData);
    }
  });

  return allTrades;
}

export async function getPlaybooksHandler(req: NextRequest, userId: string, token: string) {
  try {
    const rootUser = await getUserFromToken(token);
    if (!rootUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const Playbook = await getPlaybookModel();
    const playbooks = await Playbook.find({ uniqueId: rootUser.uniqueId }).sort({ createdAt: -1 });

    return NextResponse.json({ data: playbooks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching playbooks:", error);
    return NextResponse.json({ error: "Failed to fetch playbooks" }, { status: 500 });
  }
}

export async function createPlaybookHandler(req: any, userId: string, token: string) {
  try {
    const rootUser = await getUserFromToken(token);
    if (!rootUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { name, description, strategy, rules, optimalTimeStart, optimalTimeEnd, optimalDays, preferredSymbols, isAutoDetected } = req;

    if (!name) {
      return NextResponse.json({ error: "Playbook name is required" }, { status: 400 });
    }

    const Playbook = await getPlaybookModel();
    
    const existingPlaybook = await Playbook.findOne({ uniqueId: rootUser.uniqueId, name });
    if (existingPlaybook) {
      return NextResponse.json({ error: "Playbook with this name already exists" }, { status: 400 });
    }

    const newPlaybook = new Playbook({
      uniqueId: rootUser.uniqueId,
      name,
      description,
      strategy,
      rules: rules || [],
      optimalTimeStart,
      optimalTimeEnd,
      optimalDays: optimalDays || [],
      preferredSymbols: preferredSymbols || [],
      isAutoDetected: isAutoDetected || false,
      stats: {
        totalTrades: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        totalProfit: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        lastUpdated: new Date()
      }
    });

    await newPlaybook.save();

    return NextResponse.json({ data: newPlaybook, message: "Playbook created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating playbook:", error);
    return NextResponse.json({ error: "Failed to create playbook" }, { status: 500 });
  }
}

export async function updatePlaybookHandler(req: any, userId: string, token: string) {
  try {
    const rootUser = await getUserFromToken(token);
    if (!rootUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { playbookId, updates } = req;

    if (!playbookId) {
      return NextResponse.json({ error: "Playbook ID is required" }, { status: 400 });
    }

    const Playbook = await getPlaybookModel();
    
    const playbook = await Playbook.findOne({ _id: playbookId, uniqueId: rootUser.uniqueId });
    if (!playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    const allowedUpdates = ['name', 'description', 'strategy', 'rules', 'optimalTimeStart', 'optimalTimeEnd', 'optimalDays', 'preferredSymbols', 'isActive', 'stats'];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        (playbook as any)[key] = updates[key];
      }
    });
    
    playbook.updatedAt = new Date();
    await playbook.save();

    return NextResponse.json({ data: playbook, message: "Playbook updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating playbook:", error);
    return NextResponse.json({ error: "Failed to update playbook" }, { status: 500 });
  }
}

export async function deletePlaybookHandler(req: any, userId: string, token: string) {
  try {
    const rootUser = await getUserFromToken(token);
    if (!rootUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { playbookId } = req;

    if (!playbookId) {
      return NextResponse.json({ error: "Playbook ID is required" }, { status: 400 });
    }

    const Playbook = await getPlaybookModel();
    
    const result = await Playbook.findOneAndDelete({ _id: playbookId, uniqueId: rootUser.uniqueId });
    
    if (!result) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Playbook deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting playbook:", error);
    return NextResponse.json({ error: "Failed to delete playbook" }, { status: 500 });
  }
}

interface Trade {
  date: string;
  time?: string;
  Item: string;
  Type: string;
  Profit: number;
  strategy?: string;
  OpenTime?: string;
  CloseTime?: string;
  marketType?: string;
  [key: string]: unknown;
}

interface PatternStats {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalProfit: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

interface DetectedPattern {
  type: 'strategy' | 'symbol' | 'time' | 'day';
  name: string;
  value: string;
  stats: PatternStats;
  description: string;
}

function calculatePatternStats(trades: Trade[]): PatternStats {
  let winCount = 0;
  let lossCount = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalProfit = 0;

  trades.forEach(trade => {
    const profit = trade.Profit || 0;
    totalProfit += profit;
    if (profit > 0) {
      winCount++;
      totalWins += profit;
    } else if (profit < 0) {
      lossCount++;
      totalLosses += Math.abs(profit);
    }
  });

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const avgWin = winCount > 0 ? totalWins / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  return {
    totalTrades,
    winCount,
    lossCount,
    winRate,
    totalProfit,
    avgWin,
    avgLoss,
    profitFactor: profitFactor === Infinity ? 999 : profitFactor
  };
}

function getHourFromTime(timeStr: string): number {
  if (!timeStr) return -1;
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10);
}

function getDayFromDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

interface NearMissPattern {
  type: 'strategy' | 'symbol' | 'time' | 'day';
  name: string;
  value: string;
  currentTrades: number;
  requiredTrades: number;
  currentWinRate: number;
  requiredWinRate: number;
  reason: string;
}

interface DiagnosticInfo {
  totalTrades: number;
  tradesWithStrategy: number;
  tradesWithSymbol: number;
  tradesWithTime: number;
  tradesWithDay: number;
  strategyDistribution: Record<string, number>;
  symbolDistribution: Record<string, number>;
  timeDistribution: Record<string, number>;
  dayDistribution: Record<string, number>;
}

export async function detectPatternsHandler(req: any, userId: string, token: string) {
  try {
    const rootUser = await getUserFromToken(token);
    if (!rootUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const accountIds = rootUser.accounts.map((acc: any) => acc.accountId);
    const allTrades: Trade[] = await getAllTradesForUser(rootUser.uniqueId, accountIds);
    
    console.log(`[Playbook] User: ${rootUser.email}, Accounts: ${rootUser.accounts?.length || 0}, Trades: ${allTrades.length}`);

    const diagnostics: DiagnosticInfo = {
      totalTrades: allTrades.length,
      tradesWithStrategy: 0,
      tradesWithSymbol: 0,
      tradesWithTime: 0,
      tradesWithDay: 0,
      strategyDistribution: {},
      symbolDistribution: {},
      timeDistribution: {},
      dayDistribution: {}
    };

    if (allTrades.length < 10) {
      return NextResponse.json({ 
        data: [], 
        nearMissPatterns: [],
        diagnostics: { ...diagnostics, tradesNeeded: 10 - allTrades.length },
        message: `Need ${10 - allTrades.length} more trades to start pattern detection (minimum 10 required)` 
      }, { status: 200 });
    }

    const detectedPatterns: DetectedPattern[] = [];
    const nearMissPatterns: NearMissPattern[] = [];

    const strategyGroups: Record<string, Trade[]> = {};
    allTrades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      if (strategy !== 'Select' && strategy !== 'Unknown') {
        if (!strategyGroups[strategy]) {
          strategyGroups[strategy] = [];
        }
        strategyGroups[strategy].push(trade);
        diagnostics.tradesWithStrategy++;
      }
      diagnostics.strategyDistribution[strategy] = (diagnostics.strategyDistribution[strategy] || 0) + 1;
    });

    Object.entries(strategyGroups).forEach(([strategy, trades]) => {
      const stats = calculatePatternStats(trades);
      if (trades.length >= 5) {
        if (stats.winRate >= 50 && stats.totalProfit > 0) {
          detectedPatterns.push({
            type: 'strategy',
            name: `${strategy} Strategy`,
            value: strategy,
            stats,
            description: `Your ${strategy} strategy shows a ${stats.winRate.toFixed(1)}% win rate across ${stats.totalTrades} trades with $${stats.totalProfit.toFixed(2)} total profit.`
          });
        } else if (stats.winRate >= 40 || stats.totalProfit > 0) {
          nearMissPatterns.push({
            type: 'strategy',
            name: `${strategy} Strategy`,
            value: strategy,
            currentTrades: trades.length,
            requiredTrades: 5,
            currentWinRate: stats.winRate,
            requiredWinRate: 50,
            reason: stats.winRate < 50 
              ? `Win rate ${stats.winRate.toFixed(1)}% - need 50%+`
              : `Negative profit $${stats.totalProfit.toFixed(2)} - need positive`
          });
        }
      } else if (trades.length >= 3) {
        nearMissPatterns.push({
          type: 'strategy',
          name: `${strategy} Strategy`,
          value: strategy,
          currentTrades: trades.length,
          requiredTrades: 5,
          currentWinRate: stats.winRate,
          requiredWinRate: 50,
          reason: `Need ${5 - trades.length} more trades (${trades.length}/5)`
        });
      }
    });

    const symbolGroups: Record<string, Trade[]> = {};
    allTrades.forEach(trade => {
      const symbol = trade.Item;
      if (symbol) {
        if (!symbolGroups[symbol]) {
          symbolGroups[symbol] = [];
        }
        symbolGroups[symbol].push(trade);
        diagnostics.tradesWithSymbol++;
      }
      diagnostics.symbolDistribution[symbol || 'Unknown'] = (diagnostics.symbolDistribution[symbol || 'Unknown'] || 0) + 1;
    });

    Object.entries(symbolGroups).forEach(([symbol, trades]) => {
      const stats = calculatePatternStats(trades);
      if (trades.length >= 5) {
        if (stats.winRate >= 55 && stats.totalProfit > 0) {
          detectedPatterns.push({
            type: 'symbol',
            name: `${symbol} Trading`,
            value: symbol,
            stats,
            description: `Trading ${symbol} yields ${stats.winRate.toFixed(1)}% wins across ${stats.totalTrades} trades with $${stats.totalProfit.toFixed(2)} profit.`
          });
        } else if (stats.winRate >= 45 || stats.totalProfit > 0) {
          nearMissPatterns.push({
            type: 'symbol',
            name: `${symbol} Trading`,
            value: symbol,
            currentTrades: trades.length,
            requiredTrades: 5,
            currentWinRate: stats.winRate,
            requiredWinRate: 55,
            reason: stats.winRate < 55 
              ? `Win rate ${stats.winRate.toFixed(1)}% - need 55%+`
              : `Negative profit $${stats.totalProfit.toFixed(2)} - need positive`
          });
        }
      } else if (trades.length >= 3) {
        nearMissPatterns.push({
          type: 'symbol',
          name: `${symbol} Trading`,
          value: symbol,
          currentTrades: trades.length,
          requiredTrades: 5,
          currentWinRate: stats.winRate,
          requiredWinRate: 55,
          reason: `Need ${5 - trades.length} more trades (${trades.length}/5)`
        });
      }
    });

    const hourGroups: Record<number, Trade[]> = {};
    allTrades.forEach(trade => {
      const time = trade.time || (trade.OpenTime ? trade.OpenTime.split('T')[1] : '');
      const hour = getHourFromTime(time);
      if (hour >= 0) {
        if (!hourGroups[hour]) {
          hourGroups[hour] = [];
        }
        hourGroups[hour].push(trade);
        diagnostics.tradesWithTime++;
      }
      const hourKey = hour >= 0 ? `${hour}:00` : 'Unknown';
      diagnostics.timeDistribution[hourKey] = (diagnostics.timeDistribution[hourKey] || 0) + 1;
    });

    Object.entries(hourGroups).forEach(([hourStr, trades]) => {
      const hour = parseInt(hourStr, 10);
      const timeLabel = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
      const stats = calculatePatternStats(trades);
      if (trades.length >= 5) {
        if (stats.winRate >= 55 && stats.totalProfit > 0) {
          detectedPatterns.push({
            type: 'time',
            name: `${timeLabel} Session`,
            value: hourStr,
            stats,
            description: `Trading at ${timeLabel} shows ${stats.winRate.toFixed(1)}% win rate with ${stats.totalTrades} trades and $${stats.totalProfit.toFixed(2)} profit.`
          });
        } else if (stats.winRate >= 45 || stats.totalProfit > 0) {
          nearMissPatterns.push({
            type: 'time',
            name: `${timeLabel} Session`,
            value: hourStr,
            currentTrades: trades.length,
            requiredTrades: 5,
            currentWinRate: stats.winRate,
            requiredWinRate: 55,
            reason: stats.winRate < 55 
              ? `Win rate ${stats.winRate.toFixed(1)}% - need 55%+`
              : `Negative profit $${stats.totalProfit.toFixed(2)} - need positive`
          });
        }
      } else if (trades.length >= 3) {
        nearMissPatterns.push({
          type: 'time',
          name: `${timeLabel} Session`,
          value: hourStr,
          currentTrades: trades.length,
          requiredTrades: 5,
          currentWinRate: stats.winRate,
          requiredWinRate: 55,
          reason: `Need ${5 - trades.length} more trades (${trades.length}/5)`
        });
      }
    });

    const dayGroups: Record<string, Trade[]> = {};
    allTrades.forEach(trade => {
      const day = getDayFromDate(trade.date);
      if (day) {
        if (!dayGroups[day]) {
          dayGroups[day] = [];
        }
        dayGroups[day].push(trade);
        diagnostics.tradesWithDay++;
      }
      diagnostics.dayDistribution[day || 'Unknown'] = (diagnostics.dayDistribution[day || 'Unknown'] || 0) + 1;
    });

    Object.entries(dayGroups).forEach(([day, trades]) => {
      const stats = calculatePatternStats(trades);
      if (trades.length >= 5) {
        if (stats.winRate >= 55 && stats.totalProfit > 0) {
          detectedPatterns.push({
            type: 'day',
            name: `${day}s`,
            value: day,
            stats,
            description: `Trading on ${day}s achieves ${stats.winRate.toFixed(1)}% win rate across ${stats.totalTrades} trades with $${stats.totalProfit.toFixed(2)} profit.`
          });
        } else if (stats.winRate >= 45 || stats.totalProfit > 0) {
          nearMissPatterns.push({
            type: 'day',
            name: `${day}s`,
            value: day,
            currentTrades: trades.length,
            requiredTrades: 5,
            currentWinRate: stats.winRate,
            requiredWinRate: 55,
            reason: stats.winRate < 55 
              ? `Win rate ${stats.winRate.toFixed(1)}% - need 55%+`
              : `Negative profit $${stats.totalProfit.toFixed(2)} - need positive`
          });
        }
      } else if (trades.length >= 3) {
        nearMissPatterns.push({
          type: 'day',
          name: `${day}s`,
          value: day,
          currentTrades: trades.length,
          requiredTrades: 5,
          currentWinRate: stats.winRate,
          requiredWinRate: 55,
          reason: `Need ${5 - trades.length} more trades (${trades.length}/5)`
        });
      }
    });

    detectedPatterns.sort((a, b) => {
      const scoreA = a.stats.winRate * Math.log(a.stats.totalTrades + 1) * (a.stats.totalProfit > 0 ? 1 : 0.5);
      const scoreB = b.stats.winRate * Math.log(b.stats.totalTrades + 1) * (b.stats.totalProfit > 0 ? 1 : 0.5);
      return scoreB - scoreA;
    });

    nearMissPatterns.sort((a, b) => {
      const progressA = a.currentTrades / a.requiredTrades;
      const progressB = b.currentTrades / b.requiredTrades;
      return progressB - progressA;
    });

    return NextResponse.json({ 
      data: detectedPatterns.slice(0, 10),
      nearMissPatterns: nearMissPatterns.slice(0, 8),
      diagnostics,
      totalTrades: allTrades.length,
      message: detectedPatterns.length > 0 
        ? `Detected ${detectedPatterns.length} winning patterns from ${allTrades.length} trades`
        : nearMissPatterns.length > 0
          ? `No qualifying patterns yet, but ${nearMissPatterns.length} patterns are close to qualifying`
          : `Analyzed ${allTrades.length} trades - add more trades with consistent strategies to detect patterns`
    }, { status: 200 });

  } catch (error) {
    console.error("Error detecting patterns:", error);
    return NextResponse.json({ error: "Failed to detect patterns" }, { status: 500 });
  }
}

export async function updatePlaybookStatsHandler(req: any, userId: string, token: string) {
  try {
    const rootUser = await getUserFromToken(token);
    if (!rootUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const Playbook = await getPlaybookModel();
    const playbooks = await Playbook.find({ uniqueId: rootUser.uniqueId, isActive: true });

    const allTrades: Trade[] = [];
    rootUser.accounts.forEach((account: any) => {
      if (account.tradeData && Array.isArray(account.tradeData)) {
        allTrades.push(...account.tradeData);
      }
    });

    for (const playbook of playbooks) {
      let matchingTrades: Trade[] = allTrades;

      if (playbook.strategy) {
        matchingTrades = matchingTrades.filter(t => t.strategy === playbook.strategy);
      }

      if (playbook.preferredSymbols && playbook.preferredSymbols.length > 0) {
        matchingTrades = matchingTrades.filter(t => playbook.preferredSymbols!.includes(t.Item));
      }

      if (playbook.optimalDays && playbook.optimalDays.length > 0) {
        matchingTrades = matchingTrades.filter(t => {
          const day = getDayFromDate(t.date);
          return playbook.optimalDays!.includes(day);
        });
      }

      const stats = calculatePatternStats(matchingTrades);
      playbook.stats = {
        ...stats,
        lastUpdated: new Date()
      };
      await playbook.save();
    }

    return NextResponse.json({ message: "Playbook stats updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating playbook stats:", error);
    return NextResponse.json({ error: "Failed to update playbook stats" }, { status: 500 });
  }
}
