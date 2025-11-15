// utils/calculatePerformanceMetricsNetPnL.ts

interface Trade {
  date: string;
  Profit: number;
  Commission: number;
  Swap: number;
  Size: number;
  Type: string;
  OpenTime?: string;
  CloseTime?: string;
}

interface DailyData {
  netPnl: number;
  trades: number;
  wins: number;
  losses: number;
  scratch: number;
  volume: number;
  holdTimeMs: number;
}

interface PerformanceMetrics {
  netPnL: number;
  winPercentage: number;
  avgDailyWinPercentage: number;
  profitFactor: number;
  tradeExpectancy: number;
  avgDailyWinLoss: number;
  avgTradeWinLoss: number;
  avgHoldTime: string;
  avgNetTradePnL: number;
  avgDailyNetPnL: number;
  avgPlannedRMultiple: number;
  avgRealizedRMultiple: number;
  avgDailyVolume: number;
  loggedDays: number;
  maxDailyNetDrawdown: number;
  avgDailyNetDrawdown: number;
  maxDailyProfit: number;
  maxDailyLoss: number;
  avgDailyHoldTime: string;
  zellaScale: number;
  longsWinPercentage: number;
  shortsWinPercentage: number;
  maxTradeProfit: number;
  maxTradeLoss: number;
  maxTradeDuration: string;
  longestTradeDurationMs: number;
}

/**
 * Calculates various performance metrics from an array of trade objects.
 * @param {Array} trades - Array of trade objects.
 * @returns {Object} An object containing all calculated performance metrics.
 */
export const calculatePerformanceMetrics= (trades: Trade[]): PerformanceMetrics => {
  console.log("Calculating Performance Metrics for Net P&L");
  if (!Array.isArray(trades) || trades.length === 0) {
    return {
      // Return default values or null for empty data
      netPnL: 0,
      winPercentage: 0,
      avgDailyWinPercentage: 0,
      profitFactor: 0,
      tradeExpectancy: 0,
      avgDailyWinLoss: 0,
      avgTradeWinLoss: 0,
      avgHoldTime: '0h',
      avgNetTradePnL: 0,
      avgDailyNetPnL: 0,
      avgPlannedRMultiple: 0,
      avgRealizedRMultiple: 0,
      avgDailyVolume: 0,
      loggedDays: 0,
      maxDailyNetDrawdown: 0,
      avgDailyNetDrawdown: 0,
      maxDailyProfit: 0,
      maxDailyLoss: 0,
      avgDailyHoldTime: '0h',
      zellaScale: 0,
      longsWinPercentage: 0,
      shortsWinPercentage: 0,
      maxTradeProfit: 0,
      maxTradeLoss: 0,
      maxTradeDuration: '0h',
      longestTradeDurationMs: 0
    };
  }

  // --- Basic Aggregations ---
  let totalGrossPnL = 0;
  let totalNetPnL = 0; // Gross P&L minus commissions
  let totalCommission = 0;
  let totalSwap = 0;
  const totalTrades = trades.length;
  let winningTrades = 0;
  let losingTrades = 0;
  let scratchTrades = 0;
  let totalVolume = 0;
  let totalHoldTimeMs = 0; // In milliseconds
  let totalWinningNetPnL = 0;
  let totalLosingNetPnL = 0;
  let totalWinningTrades = 0;
  let totalLosingTrades = 0;

  // For long/short stats
  let longTrades = 0;
  let shortTrades = 0;
  let longWins = 0;
  let shortWins = 0;

  // For trade extremes
  let maxTradeNetProfit = Number.NEGATIVE_INFINITY;
  let maxTradeNetLoss = Number.POSITIVE_INFINITY;
  let longestTradeDurationMs = 0;

  // For daily calculations
  const dailyData: { [key: string]: DailyData } = {}; // day -> { netPnl, trades, wins, losses, scratch, volume, holdTimeMs }

  // --- Calculate per-trade and aggregate data using Net P&L ---
  trades.forEach(trade => {
    // Calculate Gross P&L for this trade (Profit + Swap) - Commission is subtracted separately
    const grossTradePnL = trade.Profit + trade.Swap;
    // Calculate Net P&L for this trade (Gross P&L - Commission)
    const netTradePnL = grossTradePnL - Math.abs(trade.Commission); // Assuming commission is a negative value, make it positive for subtraction
    
    totalGrossPnL += grossTradePnL;
    totalNetPnL += netTradePnL;
    totalCommission += Math.abs(trade.Commission); // Store absolute value of commission
    totalSwap += trade.Swap;
    totalVolume += trade.Size;

    // Determine win/loss/scratch based on net P&L
    if (netTradePnL > 0) {
      winningTrades++;
      totalWinningNetPnL += netTradePnL;
      totalWinningTrades++;
    } else if (netTradePnL < 0) {
      losingTrades++;
      totalLosingNetPnL += netTradePnL; // This is negative
      totalLosingTrades++;
    } else {
      scratchTrades++;
    }

    // Track long/short wins based on net P&L
    if (trade.Type === 'buy') {
      longTrades++;
      if (netTradePnL > 0) longWins++;
    } else if (trade.Type === 'sell') {
      shortTrades++;
      if (netTradePnL > 0) shortWins++;
    }

    // Calculate hold time in milliseconds
    const openTime = new Date(trade.OpenTime || '2025.10.16 12:23:13').getTime();
    const closeTime = new Date(trade.CloseTime || '2025.10.16 12:23:13').getTime();
    const holdTimeMs = closeTime - openTime;
    totalHoldTimeMs += holdTimeMs;

    // Update extremes based on net P&L
    if (netTradePnL > maxTradeNetProfit) maxTradeNetProfit = netTradePnL;
    if (netTradePnL < maxTradeNetLoss) maxTradeNetLoss = netTradePnL;
    if (holdTimeMs > longestTradeDurationMs) longestTradeDurationMs = holdTimeMs;

    // Aggregate by day using net P&L
    const dayKey = trade.date; // Assuming 'date' is YYYY-MM-DD
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = {
        netPnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        scratch: 0,
        volume: 0,
        holdTimeMs: 0
      };
    }
    dailyData[dayKey].netPnl += netTradePnL;
    dailyData[dayKey].trades++;
    if (netTradePnL > 0) dailyData[dayKey].wins++;
    else if (netTradePnL < 0) dailyData[dayKey].losses++;
    else dailyData[dayKey].scratch++;
    dailyData[dayKey].volume += trade.Size;
    dailyData[dayKey].holdTimeMs += holdTimeMs;
  });

  // --- Calculate Metrics based on Net P&L ---

  // Net P&L
  const netPnL = totalNetPnL;

  // Win %
  const winPercentage = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // Avg daily win % (Average of daily win percentages)
  const dailyWinPercentages = Object.values(dailyData).map(day => {
    return day.trades > 0 ? (day.wins / day.trades) * 100 : 0;
  });
  const avgDailyWinPercentage = dailyWinPercentages.length > 0 ? dailyWinPercentages.reduce((a, b) => a + b, 0) / dailyWinPercentages.length : 0;

  // Profit Factor (based on net P&L)
  const profitFactor = totalLosingNetPnL !== 0 ? Math.abs(totalWinningNetPnL / totalLosingNetPnL) : 0;

  // Trade Expectancy (based on net P&L)
  const avgWinPerTrade = totalWinningTrades > 0 ? totalWinningNetPnL / totalWinningTrades : 0;
  const avgLossPerTrade = totalLosingTrades > 0 ? totalLosingNetPnL / totalLosingTrades : 0; // This is negative
  const tradeExpectancy = (avgWinPerTrade * (winningTrades / totalTrades)) + (avgLossPerTrade * (losingTrades / totalTrades));

  // Avg daily win/loss (Average of daily net P&L)
  const dailyNetPnLs = Object.values(dailyData).map(day => day.netPnl);
  const avgDailyWinLoss = dailyNetPnLs.length > 0 ? dailyNetPnLs.reduce((a, b) => a + b, 0) / dailyNetPnLs.length : 0;

  // Avg trade win/loss (Average of net trade P&L)
  const avgTradeWinLoss = totalTrades > 0 ? totalNetPnL / totalTrades : 0;

  // Avg hold time (Convert milliseconds to hours and minutes)
  const avgHoldTimeMs = totalTrades > 0 ? totalHoldTimeMs / totalTrades : 0;
  const avgHoldHours = Math.floor(avgHoldTimeMs / (1000 * 60 * 60));
  const avgHoldMinutes = Math.floor((avgHoldTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  const avgHoldTime = `${avgHoldHours}h ${avgHoldMinutes}m`;

  // Avg net trade P&L
  const avgNetTradePnL = totalTrades > 0 ? totalNetPnL / totalTrades : 0;

  // Avg daily net P&L
  const avgDailyNetPnL = dailyNetPnLs.length > 0 ? dailyNetPnLs.reduce((a, b) => a + b, 0) / dailyNetPnLs.length : 0;

  // Logged days (Number of unique trading days)
  const loggedDays = Object.keys(dailyData).length;

  // Max daily net drawdown (Worst single day loss based on net P&L)
  const maxDailyNetDrawdown = dailyNetPnLs.length > 0 ? Math.min(...dailyNetPnLs) : 0;

  // Avg daily net drawdown (Average of daily net P&L, which can be negative)
  const avgDailyNetDrawdown = avgDailyNetPnL; // Same as avgDailyNetPnL for this context

  // Average planned R-Multiple & Average realized R-Multiple
  const avgPlannedRMultiple = 0;
  const avgRealizedRMultiple = 0;

  // Avg daily volume
  const avgDailyVolume = loggedDays > 0 ? totalVolume / loggedDays : 0;

  // --- NEW METRICS CALCULATIONS ---

  // Largest profitable day (based on net P&L)
  const maxDailyProfit = dailyNetPnLs.length > 0 ? Math.max(...dailyNetPnLs) : 0;

  // Largest losing day (most negative, based on net P&L)
  const maxDailyLoss = dailyNetPnLs.length > 0 ? Math.min(...dailyNetPnLs) : 0;

  // Avg daily hold time (average of daily total hold times)
  const dailyHoldTimes = Object.values(dailyData).map(day => day.holdTimeMs / day.trades).filter(h => !isNaN(h));
  const avgDailyHoldTimeMs = dailyHoldTimes.length > 0 ? dailyHoldTimes.reduce((a, b) => a + b, 0) / dailyHoldTimes.length : 0;
  const avgDailyHoldHours = Math.floor(avgDailyHoldTimeMs / (1000 * 60 * 60));
  const avgDailyHoldMinutes = Math.floor((avgDailyHoldTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  const avgDailyHoldTime = `${avgDailyHoldHours}h ${avgDailyHoldMinutes}m`;

  // Longs win % and Shorts win % (based on net P&L)
  const longsWinPercentage = longTrades > 0 ? (longWins / longTrades) * 100 : 0;
  const shortsWinPercentage = shortTrades > 0 ? (shortWins / shortTrades) * 100 : 0;

  // Largest profitable trade (based on net P&L)
  const maxTradeProfit = isFinite(maxTradeNetProfit) ? maxTradeNetProfit : 0;

  // Largest losing trade (based on net P&L)
  const maxTradeLoss = isFinite(maxTradeNetLoss) ? maxTradeNetLoss : 0;

  // Longest trade duration
  const maxTradeDurationHours = Math.floor(longestTradeDurationMs / (1000 * 60 * 60));
  const maxTradeDurationMinutes = Math.floor((longestTradeDurationMs % (1000 * 60 * 60)) / (1000 * 60));
  const maxTradeDuration = `${maxTradeDurationHours}h ${maxTradeDurationMinutes}m`;

  // Zella Scale (Example: normalize between 0-100 using win rate and expectancy based on net P&L)
  // You can adjust formula based on your definition of "Zella Scale"
  const zellaScale = Math.min(100, Math.max(0,
    (winPercentage * 0.4) + (profitFactor * 10) + (tradeExpectancy > 0 ? 20 : 0)
  ));

  return {
    netPnL,
    winPercentage,
    avgDailyWinPercentage,
    profitFactor,
    tradeExpectancy,
    avgDailyWinLoss,
    avgTradeWinLoss,
    avgHoldTime,
    avgNetTradePnL,
    avgDailyNetPnL,
    avgPlannedRMultiple,
    avgRealizedRMultiple,
    avgDailyVolume,
    loggedDays,
    maxDailyNetDrawdown,
    avgDailyNetDrawdown,
    maxDailyProfit,
    maxDailyLoss,
    avgDailyHoldTime,
    zellaScale,
    longsWinPercentage,
    shortsWinPercentage,
    maxTradeProfit,
    maxTradeLoss,
    maxTradeDuration,
    longestTradeDurationMs
  };
};