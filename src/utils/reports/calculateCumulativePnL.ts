// utils/calculateCumulativePnL.ts

interface Trade {
  date: string;
  Profit: number;
  Commission: number;
  Swap: number;
}

interface CumulativePnLDataPoint {
  date: string;
  value: number;
}

/**
 * Calculates cumulative P&L data points from an array of trade objects.
 * @param {Array} trades - Array of trade objects.
 * @returns {Array} An array of objects with 'date' and 'value' properties for the cumulative P&L chart.
 */
export const calculateCumulativePnL = (trades: Trade[]): CumulativePnLDataPoint[] => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return [];
  }

  // --- Aggregate P&L by Date ---
  const dailyPnL: { [key: string]: number } = {}; // date (YYYY-MM-DD) -> cumulative P&L for that date

  trades.forEach(trade => {
    // Calculate P&L for this trade (Profit + Commission + Swap)
    const tradePnL = trade.Profit + trade.Commission + trade.Swap;
    const dateKey = trade.date; // Assuming 'date' is YYYY-MM-DD

    if (!dailyPnL[dateKey]) {
      dailyPnL[dateKey] = 0;
    }
    dailyPnL[dateKey] += tradePnL;
  });

  // --- Sort dates and Calculate Cumulative Total ---
  const sortedDates = Object.keys(dailyPnL).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const cumulativePnLData: CumulativePnLDataPoint[] = [];
  let runningTotal = 0;

  sortedDates.forEach(date => {
    runningTotal += dailyPnL[date];
    cumulativePnLData.push({
      date: date,
      value:parseFloat(runningTotal) // Round to 2 decimal places
    });
  });

  return cumulativePnLData;
};